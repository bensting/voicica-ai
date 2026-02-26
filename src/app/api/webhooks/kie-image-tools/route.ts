import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { imageToolRecords } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { uploadImage } from '@/lib/services/r2-storage';
import { refundCreditsSimple } from '@/lib/credits';
import { ProductType } from '@/config/productType';

/**
 * KIE API 图片工具回调处理
 * BG Remove & HD Upscale 完成后的 webhook
 */

interface KieImageToolCallbackPayload {
  code: number;
  msg: string;
  data: {
    taskId: string;
    model: string;
    state: 'waiting' | 'success' | 'fail';
    resultJson: string | null;
    failCode: string | null;
    failMsg: string | null;
    costTime: number | null;
    completeTime: number | null;
  };
}

/**
 * 从 URL 下载图片并上传到 R2
 */
async function downloadAndUploadImageToR2(
  url: string,
  taskId: string,
  userId: string
): Promise<string | null> {
  try {
    console.log(`📥 [R2 Upload] 下载图片: ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
      console.error(`📥 [R2 Upload] 下载失败: ${response.status}`);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || 'image/png';
    const ext = contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : 'png';
    const fileName = `${taskId}_result.${ext}`;
    const r2Url = await uploadImage(buffer, fileName, contentType, `image-tools/${userId}`);
    console.log(`✅ [R2 Upload] 图片上传成功: ${r2Url}`);
    return r2Url;
  } catch (error) {
    console.error(`❌ [R2 Upload] 上传失败:`, error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  const db = await getDb();
  try {
    const payload: KieImageToolCallbackPayload = await request.json();

    console.log('🔧 [KIE ImageTool Callback] 收到回调:', JSON.stringify(payload, null, 2));

    if (payload.code !== 200) {
      console.error('🔧 [KIE ImageTool Callback] 回调错误:', payload.msg);

      if (payload.data?.taskId) {
        const [failedRecord] = await db
          .select()
          .from(imageToolRecords)
          .where(eq(imageToolRecords.taskId, payload.data.taskId))
          .limit(1);

        if (failedRecord) {
          const updateResult = await db
            .update(imageToolRecords)
            .set({
              status: 'FAILURE',
              error: payload.msg || 'Processing failed',
              completedAt: new Date().toISOString(),
            })
            .where(
              and(
                eq(imageToolRecords.id, failedRecord.id),
                eq(imageToolRecords.status, 'PENDING')
              )
            )
            .returning();

          if (updateResult.length > 0 && failedRecord.creditsUsed > 0) {
            try {
              await refundCreditsSimple(
                failedRecord.userId,
                failedRecord.creditsUsed,
                ProductType.IMAGE_TOOL,
                `Image tool failed (callback error): ${payload.msg || 'Unknown error'}`,
                failedRecord.taskId
              );
              console.log(`💰 [KIE ImageTool Callback] 积分已返还: ${failedRecord.creditsUsed}`);
            } catch (refundError) {
              console.error(`❌ [KIE ImageTool Callback] 积分返还失败:`, refundError);
            }
          }
        }
      }

      return NextResponse.json({ success: false, error: payload.msg });
    }

    const { taskId, state, resultJson, failMsg } = payload.data;

    // 查找对应的记录
    const [record] = await db
      .select()
      .from(imageToolRecords)
      .where(eq(imageToolRecords.taskId, taskId))
      .limit(1);

    if (!record) {
      console.warn(`🔧 [KIE ImageTool Callback] 找不到对应记录: ${taskId}`);
      return NextResponse.json({ success: false, error: 'Record not found' });
    }

    console.log(`🔧 [KIE ImageTool Callback] 状态: ${state}, 记录ID: ${record.id}`);

    if (state === 'fail') {
      // 乐观锁：只更新 PENDING 状态的记录
      const updateResult = await db
        .update(imageToolRecords)
        .set({
          status: 'FAILURE',
          error: failMsg || 'Processing failed',
          completedAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(imageToolRecords.id, record.id),
            eq(imageToolRecords.status, 'PENDING')
          )
        )
        .returning();

      // 返还积分
      if (updateResult.length > 0 && record.creditsUsed > 0) {
        try {
          await refundCreditsSimple(
            record.userId,
            record.creditsUsed,
            ProductType.IMAGE_TOOL,
            `Image tool failed (KIE): ${failMsg || 'Unknown error'}`,
            record.taskId
          );
          console.log(`💰 [KIE ImageTool Callback] 积分已返还: ${record.creditsUsed}`);
        } catch (refundError) {
          console.error(`❌ [KIE ImageTool Callback] 积分返还失败:`, refundError);
        }
      }

      return NextResponse.json({ success: true });
    }

    if (state === 'success' && resultJson) {
      // 解析结果
      let imageUrl: string | undefined;
      try {
        const result = JSON.parse(resultJson);
        imageUrl = result.image_url || result.resultUrls?.[0];
      } catch {
        console.error('🔧 [KIE ImageTool Callback] 解析 resultJson 失败:', resultJson);
      }

      if (!imageUrl) {
        console.error('🔧 [KIE ImageTool Callback] 未找到图片 URL');
        return NextResponse.json({ success: false, error: 'No image URL in result' });
      }

      // 乐观锁：标记已认领下载（防止和 polling 竞争）
      const claimResult = await db
        .update(imageToolRecords)
        .set({ progress: 99 })
        .where(
          and(
            eq(imageToolRecords.id, record.id),
            eq(imageToolRecords.status, 'PENDING'),
            eq(imageToolRecords.progress, 0)
          )
        )
        .returning();

      if (claimResult.length === 0) {
        // 已被 polling 认领或已经处理过
        console.log(`🔧 [KIE ImageTool Callback] 任务已被其他进程处理: ${taskId}`);
        return NextResponse.json({ success: true });
      }

      // 下载图片并上传到 R2
      const r2ImageUrl = await downloadAndUploadImageToR2(imageUrl, taskId, record.userId);
      const finalImageUrl = r2ImageUrl || imageUrl;

      // 更新记录
      await db
        .update(imageToolRecords)
        .set({
          status: 'SUCCESS',
          resultImageUrl: finalImageUrl,
          completedAt: new Date().toISOString(),
        })
        .where(eq(imageToolRecords.id, record.id));

      console.log(`🔧 [KIE ImageTool Callback] 处理完成: ${taskId}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('🔧 [KIE ImageTool Callback] 处理错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// 支持 GET 请求用于验证 endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'KIE Image Tools Webhook',
    timestamp: new Date().toISOString(),
  });
}
