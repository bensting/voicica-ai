import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
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
  try {
    const payload: KieVideoCallbackPayload = await request.json();

    console.log('🎬 [KIE Video Callback] 收到回调:', JSON.stringify(payload, null, 2));

    if (payload.code !== 200) {
      console.error('🎬 [KIE Video Callback] 回调错误:', payload.msg);

      // 尝试根据 external_task_id 更新记录状态并返还积分（使用乐观锁防止重复）
      if (payload.data?.taskId) {
        const failedRecord = await prisma.video_records.findFirst({
          where: { external_task_id: payload.data.taskId },
        });

        if (failedRecord) {
          const updateResult = await prisma.video_records.updateMany({
            where: {
              id: failedRecord.id,
              status: 'PROCESSING', // 乐观锁：防止重复处理
            },
            data: {
              status: 'FAILURE',
              error_message: payload.msg || 'Generation failed',
              completed_at: new Date(),
            },
          });

          // 如果更新成功（count > 0），说明是第一个处理的，需要返还积分
          if (updateResult.count > 0 && failedRecord.credits_cost && failedRecord.credits_cost > 0) {
            try {
              await refundCreditsSimple(
                failedRecord.user_id,
                failedRecord.credits_cost,
                ProductType.TEXT_TO_VIDEO,
                `Video generation failed (KIE callback error): ${payload.msg || 'Unknown error'}`,
                failedRecord.task_id
              );
              console.log(`💰 [KIE Video Callback] 积分已返还: ${failedRecord.credits_cost}`);
            } catch (refundError) {
              console.error(`❌ [KIE Video Callback] 积分返还失败:`, refundError);
            }
          } else if (updateResult.count === 0) {
            console.log(`⚠️ [KIE Video Callback] 任务已被其他请求处理，跳过: ${failedRecord.task_id}`);
          }
        }
      }

      return NextResponse.json({ success: false, error: payload.msg });
    }

    const { taskId: externalTaskId, state, resultJson, failMsg, costTime } = payload.data;

    // 查找对应的记录（通过 external_task_id）
    const record = await prisma.video_records.findFirst({
      where: { external_task_id: externalTaskId },
    });

    if (!record) {
      console.warn(`🎬 [KIE Video Callback] 找不到对应记录: ${externalTaskId}`);
      return NextResponse.json({ success: false, error: 'Record not found' });
    }

    console.log(`🎬 [KIE Video Callback] 状态: ${state}, 记录ID: ${record.task_id}`);

    if (state === 'fail') {
      // 生成失败 - 使用乐观锁，只有 PROCESSING 状态才能更新为 FAILURE
      const updateResult = await prisma.video_records.updateMany({
        where: {
          id: record.id,
          status: 'PROCESSING', // 乐观锁：防止重复处理
        },
        data: {
          status: 'FAILURE',
          progress: 0,
          error_message: failMsg || 'Video generation failed',
          completed_at: new Date(),
        },
      });

      // 如果更新成功（count > 0），说明是第一个处理的，需要返还积分
      if (updateResult.count > 0) {
        await prisma.task_queue.updateMany({
          where: { task_id: record.task_id },
          data: {
            status: 'FAILURE',
            error_message: failMsg || 'Video generation failed',
            completed_at: new Date(),
          },
        });

        // 返还积分
        if (record.credits_cost && record.credits_cost > 0) {
          try {
            await refundCreditsSimple(
              record.user_id,
              record.credits_cost,
              ProductType.TEXT_TO_VIDEO,
              `Video generation failed (KIE): ${failMsg || 'Unknown error'}`,
              record.task_id
            );
            console.log(`💰 [KIE Video Callback] 积分已返还: ${record.credits_cost}`);
          } catch (refundError) {
            console.error(`❌ [KIE Video Callback] 积分返还失败:`, refundError);
          }
        }

        console.log(`🎬 [KIE Video Callback] 视频生成失败: ${record.task_id}`);
      } else {
        console.log(`⚠️ [KIE Video Callback] 任务已被其他请求处理，跳过: ${record.task_id}`);
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
      const r2VideoUrl = await downloadAndUploadVideoToR2(videoUrl, record.task_id, record.user_id);

      // 使用 R2 URL（如果上传成功），否则保留原始 URL
      const finalVideoUrl = r2VideoUrl || videoUrl;

      // 更新记录
      await prisma.video_records.update({
        where: { id: record.id },
        data: {
          status: 'SUCCESS',
          progress: 100,
          video_url: finalVideoUrl,
          api_cost: costTime ? costTime / 1000 : null,
          completed_at: new Date(),
        },
      });

      await prisma.task_queue.updateMany({
        where: { task_id: record.task_id },
        data: {
          status: 'SUCCESS',
          completed_at: new Date(),
        },
      });

      console.log(`🎬 [KIE Video Callback] 视频处理完成: ${record.task_id}`);
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
