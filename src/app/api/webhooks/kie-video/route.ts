import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { videoRecords, taskQueue } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { uploadVideo } from '@/lib/services/r2-storage';
import { refundCreditsSimple } from '@/lib/credits';
import { ProductType } from '@/config/productType';

/**
 * KIE API 视频生成回调处理
 *
 * 当视频生成完成时，KIE API 会调用此回调
 */

interface KieVideoCallbackPayload {
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
 * 从 URL 下载视频并上传到 R2
 */
async function downloadAndUploadVideoToR2(
  url: string,
  taskId: string,
  userId: string
): Promise<string | null> {
  try {
    console.log(`📥 [R2 Upload] 下载视频: ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
      console.error(`📥 [R2 Upload] 下载失败: ${response.status}`);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const fileName = `${taskId}.mp4`;
    const r2Url = await uploadVideo(buffer, fileName, 'video/mp4', `videos/${userId}`);
    console.log(`✅ [R2 Upload] 视频上传成功: ${r2Url}`);
    return r2Url;
  } catch (error) {
    console.error(`❌ [R2 Upload] 上传失败:`, error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  const db = await getDb();
  try {
    const payload: KieVideoCallbackPayload = await request.json();

    console.log('🎬 [KIE Video Callback] 收到回调:', JSON.stringify(payload, null, 2));

    if (payload.code !== 200) {
      console.error('🎬 [KIE Video Callback] 回调错误:', payload.msg);

      // 尝试根据 external_task_id 更新记录状态并返还积分（使用乐观锁防止重复）
      if (payload.data?.taskId) {
        const [failedRecord] = await db
          .select()
          .from(videoRecords)
          .where(eq(videoRecords.externalTaskId, payload.data.taskId))
          .limit(1);

        if (failedRecord) {
          const updateResult = await db
            .update(videoRecords)
            .set({
              status: 'FAILURE',
              errorMessage: payload.msg || 'Generation failed',
              completedAt: new Date().toISOString(),
            })
            .where(
              and(
                eq(videoRecords.id, failedRecord.id),
                eq(videoRecords.status, 'PROCESSING') // 乐观锁：防止重复处理
              )
            )
            .returning();

          // 如果更新成功（有返回行），说明是第一个处理的，需要返还积分
          if (updateResult.length > 0 && failedRecord.creditsCost && failedRecord.creditsCost > 0) {
            try {
              await refundCreditsSimple(
                failedRecord.userId,
                failedRecord.creditsCost,
                ProductType.TEXT_TO_VIDEO,
                `Video generation failed (KIE callback error): ${payload.msg || 'Unknown error'}`,
                failedRecord.taskId
              );
              console.log(`💰 [KIE Video Callback] 积分已返还: ${failedRecord.creditsCost}`);
            } catch (refundError) {
              console.error(`❌ [KIE Video Callback] 积分返还失败:`, refundError);
            }
          } else if (updateResult.length === 0) {
            console.log(`⚠️ [KIE Video Callback] 任务已被其他请求处理，跳过: ${failedRecord.taskId}`);
          }
        }
      }

      return NextResponse.json({ success: false, error: payload.msg });
    }

    const { taskId: externalTaskId, state, resultJson, failMsg, costTime } = payload.data;

    // 查找对应的记录（通过 external_task_id）
    const [record] = await db
      .select()
      .from(videoRecords)
      .where(eq(videoRecords.externalTaskId, externalTaskId))
      .limit(1);

    if (!record) {
      console.warn(`🎬 [KIE Video Callback] 找不到对应记录: ${externalTaskId}`);
      return NextResponse.json({ success: false, error: 'Record not found' });
    }

    console.log(`🎬 [KIE Video Callback] 状态: ${state}, 记录ID: ${record.taskId}`);

    if (state === 'fail') {
      // 生成失败 - 使用乐观锁，只有 PROCESSING 状态才能更新为 FAILURE
      const updateResult = await db
        .update(videoRecords)
        .set({
          status: 'FAILURE',
          progress: 0,
          errorMessage: failMsg || 'Video generation failed',
          completedAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(videoRecords.id, record.id),
            eq(videoRecords.status, 'PROCESSING') // 乐观锁：防止重复处理
          )
        )
        .returning();

      // 如果更新成功（有返回行），说明是第一个处理的，需要返还积分
      if (updateResult.length > 0) {
        await db
          .update(taskQueue)
          .set({
            status: 'FAILURE',
            errorMessage: failMsg || 'Video generation failed',
            completedAt: new Date().toISOString(),
          })
          .where(eq(taskQueue.taskId, record.taskId));

        // 返还积分
        if (record.creditsCost && record.creditsCost > 0) {
          try {
            await refundCreditsSimple(
              record.userId,
              record.creditsCost,
              ProductType.TEXT_TO_VIDEO,
              `Video generation failed (KIE): ${failMsg || 'Unknown error'}`,
              record.taskId
            );
            console.log(`💰 [KIE Video Callback] 积分已返还: ${record.creditsCost}`);
          } catch (refundError) {
            console.error(`❌ [KIE Video Callback] 积分返还失败:`, refundError);
          }
        }

        console.log(`🎬 [KIE Video Callback] 视频生成失败: ${record.taskId}`);
      } else {
        console.log(`⚠️ [KIE Video Callback] 任务已被其他请求处理，跳过: ${record.taskId}`);
      }

      return NextResponse.json({ success: true });
    }

    if (state === 'success' && resultJson) {
      // 解析结果
      let videoUrl: string | undefined;
      try {
        const result = JSON.parse(resultJson);
        videoUrl = result.resultUrls?.[0];
      } catch {
        console.error('🎬 [KIE Video Callback] 解析 resultJson 失败:', resultJson);
      }

      if (!videoUrl) {
        console.error('🎬 [KIE Video Callback] 未找到视频 URL');
        return NextResponse.json({ success: false, error: 'No video URL in result' });
      }

      // 下载视频并上传到 R2
      console.log('🎬 [KIE Video Callback] 开始下载视频到 R2...');
      const r2VideoUrl = await downloadAndUploadVideoToR2(videoUrl, record.taskId, record.userId);

      // 使用 R2 URL（如果上传成功），否则保留原始 URL
      const finalVideoUrl = r2VideoUrl || videoUrl;

      // 更新记录
      await db
        .update(videoRecords)
        .set({
          status: 'SUCCESS',
          progress: 100,
          videoUrl: finalVideoUrl,
          apiCost: costTime ? costTime / 1000 : null,
          completedAt: new Date().toISOString(),
        })
        .where(eq(videoRecords.id, record.id));

      await db
        .update(taskQueue)
        .set({
          status: 'SUCCESS',
          completedAt: new Date().toISOString(),
        })
        .where(eq(taskQueue.taskId, record.taskId));

      console.log(`🎬 [KIE Video Callback] 视频处理完成: ${record.taskId}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('🎬 [KIE Video Callback] 处理错误:', error);
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
    endpoint: 'KIE Video Webhook',
    timestamp: new Date().toISOString(),
  });
}
