/**
 * Video 任务队列处理函数 (Upstash QStash)
 *
 * 由 QStash 调用，处理异步视频生成任务
 * 使用 Google Veo 3.1 服务
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import prisma from '@/lib/prisma';
import {
  submitVideoGeneration,
  waitForCompletion,
  toVeoResolution,
  toVeoDuration,
  type VeoModel,
} from '@/lib/services/google-veo';
import { uploadVideo } from '@/lib/services/r2-storage';
import { ProductType } from '@/config/productType';
import type { VideoQueuePayload } from '@/lib/queue/video-queue';
import { deductCreditsAtomic, addCredits } from '@/lib/credits';

// 允许长时间运行（Hobby 计划最大 300 秒）
export const maxDuration = 300;

// 处理函数（不带签名验证，用于开发环境）
async function handleVideoTask(req: NextRequest) {
  const payload: VideoQueuePayload = await req.json();
  const {
    taskId,
    userId,
    prompt,
    negativePrompt,
    resolution,
    duration,
    aspectRatio,
    model,
    seed,
    creditsCost,
    isAnonymous,
  } = payload;

  console.log(`🚀 [VideoQueue] 开始处理视频任务: ${taskId}`);
  let creditsDeducted = false;

  try {
    // 1. 幂等性检查：获取任务记录并验证状态
    const videoRecord = await prisma.video_records.findUnique({
      where: { task_id: taskId },
    });

    if (!videoRecord) {
      throw new Error(`任务记录不存在: ${taskId}`);
    }

    // 如果任务已被处理，跳过执行
    if (videoRecord.status !== 'PENDING') {
      console.log(`⚠️ [VideoQueue] 任务 ${taskId} 已被处理，状态: ${videoRecord.status}，跳过执行`);
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: `Task already in status: ${videoRecord.status}`,
      });
    }

    // 2. 使用乐观锁更新状态为处理中（只有 PENDING 状态才能更新）
    const updateResult = await prisma.video_records.updateMany({
      where: {
        task_id: taskId,
        status: 'PENDING',
      },
      data: {
        status: 'PROCESSING',
        progress: 10,
      },
    });

    if (updateResult.count === 0) {
      console.log(`⚠️ [VideoQueue] 任务 ${taskId} 状态已被其他实例修改，跳过执行`);
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: 'Task status already modified',
      });
    }

    console.log(`🔓 [VideoQueue] 任务 ${taskId} 状态已锁定为 PROCESSING`);

    // 3. 扣减积分
    await deductCreditsAtomic(
      userId,
      creditsCost,
      ProductType.TEXT_TO_VIDEO,
      isAnonymous,
      `Video: ${prompt.substring(0, 30)}${prompt.length > 30 ? '...' : ''}`,
      taskId
    );
    creditsDeducted = true;

    // 4. 更新进度到 20%
    await prisma.video_records.update({
      where: { task_id: taskId },
      data: { progress: 20 },
    });

    // 5. 提交视频生成任务到 Veo
    console.log(`🎬 [VideoQueue] 提交 Veo 任务: model=${model}, resolution=${resolution}, duration=${duration}s`);

    const veoResult = await submitVideoGeneration({
      prompt,
      negativePrompt,
      resolution: toVeoResolution(resolution),
      duration: toVeoDuration(duration),
      aspectRatio,
      seed,
      model: model as VeoModel,
      generateAudio: true, // Veo 3 支持音频生成
    });

    // 6. 更新进度到 30%，保存操作 ID
    await prisma.video_records.update({
      where: { task_id: taskId },
      data: { progress: 30 },
    });

    // 7. 等待视频生成完成（轮询）
    const completedResult = await waitForCompletion(
      veoResult.operationName,
      model as VeoModel,
      540000, // 最长等待 9 分钟
      15000, // 每 15 秒轮询一次
      async (progress) => {
        // 更新进度（30% - 90%）
        await prisma.video_records.update({
          where: { task_id: taskId },
          data: { progress },
        });
      }
    );

    // 8. 上传视频到 R2
    console.log(`📤 [VideoQueue] 上传视频到 R2...`);
    const fileName = `${taskId}.mp4`;
    const videoUrl = await uploadVideo(
      completedResult.videoData,
      fileName,
      completedResult.mimeType || 'video/mp4',
      `videos/${userId}`
    );

    // 9. 更新任务状态为成功
    await prisma.video_records.update({
      where: { task_id: taskId },
      data: {
        status: 'SUCCESS',
        progress: 100,
        video_url: videoUrl,
        actual_duration: duration, // 实际时长等于请求时长
        completed_at: new Date(),
      },
    });

    // 更新 task_queue 状态
    await prisma.task_queue.updateMany({
      where: { task_id: taskId },
      data: {
        status: 'SUCCESS',
        completed_at: new Date(),
      },
    });

    console.log(`✅ [VideoQueue] 视频任务处理成功: ${taskId}`);

    return NextResponse.json({
      success: true,
      taskId,
      videoUrl,
    });
  } catch (error) {
    console.error(`❌ [VideoQueue] 视频任务处理失败: ${taskId}`, error);

    // 如果积分已扣减，退还积分
    if (creditsDeducted) {
      try {
        await addCredits(
          userId,
          creditsCost,
          ProductType.TEXT_TO_VIDEO,
          isAnonymous,
          '视频任务失败，积分退还',
          taskId,
          true
        );
      } catch (refundError) {
        console.error('积分退还失败:', refundError);
      }
    }

    // 更新任务状态为失败
    try {
      await prisma.video_records.updateMany({
        where: { task_id: taskId },
        data: {
          status: 'FAILURE',
          progress: 0,
          error_message: error instanceof Error ? error.message : String(error),
          completed_at: new Date(),
        },
      });

      await prisma.task_queue.updateMany({
        where: { task_id: taskId },
        data: {
          status: 'FAILURE',
          error_message: error instanceof Error ? error.message : String(error),
          completed_at: new Date(),
        },
      });
    } catch (updateError) {
      console.error('更新失败状态异常:', updateError);
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process video task',
      },
      { status: 500 }
    );
  }
}

// 导出 POST 函数
// 生产环境：使用 QStash 签名验证
// 开发环境：跳过验证
export const POST =
  process.env.NODE_ENV === 'production' && process.env.QSTASH_CURRENT_SIGNING_KEY
    ? verifySignatureAppRouter(handleVideoTask)
    : handleVideoTask;