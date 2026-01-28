import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { uploadImage } from '@/lib/services/r2-storage';
import { refundCreditsSimple } from '@/lib/credits';
import { ProductType } from '@/config/productType';

/**
 * KIE API 图片生成回调处理
 *
 * 当图片生成完成时，KIE API 会调用此回调
 */

interface KieImageCallbackPayload {
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
    const fileName = `${taskId}.${ext}`;
    const r2Url = await uploadImage(buffer, fileName, contentType, `images/${userId}`);
    console.log(`✅ [R2 Upload] 图片上传成功: ${r2Url}`);
    return r2Url;
  } catch (error) {
    console.error(`❌ [R2 Upload] 上传失败:`, error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload: KieImageCallbackPayload = await request.json();

    console.log('🖼️ [KIE Image Callback] 收到回调:', JSON.stringify(payload, null, 2));

    if (payload.code !== 200) {
      console.error('🖼️ [KIE Image Callback] 回调错误:', payload.msg);

      // 尝试更新记录状态并返还积分
      if (payload.data?.taskId) {
        const failedRecord = await prisma.image_records.findFirst({
          where: { task_id: payload.data.taskId },
        });

        if (failedRecord) {
          const updateResult = await prisma.image_records.updateMany({
            where: {
              id: failedRecord.id,
              status: 'PENDING', // 乐观锁：防止重复处理
            },
            data: {
              status: 'FAILURE',
              error: payload.msg || 'Generation failed',
              completed_at: new Date(),
            },
          });

          // 如果更新成功，返还积分
          if (updateResult.count > 0 && failedRecord.credits_used && failedRecord.credits_used > 0) {
            try {
              await refundCreditsSimple(
                failedRecord.user_id,
                failedRecord.credits_used,
                ProductType.IMAGE,
                `Image generation failed (KIE callback error): ${payload.msg || 'Unknown error'}`,
                failedRecord.task_id
              );
              console.log(`💰 [KIE Image Callback] 积分已返还: ${failedRecord.credits_used}`);
            } catch (refundError) {
              console.error(`❌ [KIE Image Callback] 积分返还失败:`, refundError);
            }
          }
        }
      }

      return NextResponse.json({ success: false, error: payload.msg });
    }

    const { taskId, state, resultJson, failMsg, costTime } = payload.data;

    // 查找对应的记录
    const record = await prisma.image_records.findFirst({
      where: { task_id: taskId },
    });

    if (!record) {
      console.warn(`🖼️ [KIE Image Callback] 找不到对应记录: ${taskId}`);
      return NextResponse.json({ success: false, error: 'Record not found' });
    }

    console.log(`🖼️ [KIE Image Callback] 状态: ${state}, 记录ID: ${record.id}`);

    if (state === 'fail') {
      // 生成失败
      const updateResult = await prisma.image_records.updateMany({
        where: {
          id: record.id,
          status: 'PENDING',
        },
        data: {
          status: 'FAILURE',
          error: failMsg || 'Image generation failed',
          completed_at: new Date(),
        },
      });

      // 返还积分
      if (updateResult.count > 0 && record.credits_used && record.credits_used > 0) {
        try {
          await refundCreditsSimple(
            record.user_id,
            record.credits_used,
            ProductType.IMAGE,
            `Image generation failed (KIE): ${failMsg || 'Unknown error'}`,
            record.task_id
          );
          console.log(`💰 [KIE Image Callback] 积分已返还: ${record.credits_used}`);
        } catch (refundError) {
          console.error(`❌ [KIE Image Callback] 积分返还失败:`, refundError);
        }
      }

      console.log(`🖼️ [KIE Image Callback] 图片生成失败: ${taskId}`);
      return NextResponse.json({ success: true });
    }

    if (state === 'success' && resultJson) {
      // 解析结果
      let imageUrl: string | undefined;
      try {
        const result = JSON.parse(resultJson);
        // KIE 图片结果可能在 image_url 或 resultUrls
        imageUrl = result.image_url || result.resultUrls?.[0];
      } catch {
        console.error('🖼️ [KIE Image Callback] 解析 resultJson 失败:', resultJson);
      }

      if (!imageUrl) {
        console.error('🖼️ [KIE Image Callback] 未找到图片 URL');
        return NextResponse.json({ success: false, error: 'No image URL in result' });
      }

      // 下载图片并上传到 R2
      console.log('🖼️ [KIE Image Callback] 开始下载图片到 R2...');
      const r2ImageUrl = await downloadAndUploadImageToR2(imageUrl, taskId, record.user_id);

      // 使用 R2 URL（如果上传成功），否则保留原始 URL
      const finalImageUrl = r2ImageUrl || imageUrl;

      // 更新记录
      await prisma.image_records.update({
        where: { id: record.id },
        data: {
          status: 'SUCCESS',
          image_url: finalImageUrl,
          completed_at: new Date(),
        },
      });

      console.log(`🖼️ [KIE Image Callback] 图片处理完成: ${taskId}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('🖼️ [KIE Image Callback] 处理错误:', error);
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
    endpoint: 'KIE Image Webhook',
    timestamp: new Date().toISOString(),
  });
}
