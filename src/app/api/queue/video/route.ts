/**
 * Video 任务队列处理函数 (Upstash QStash)
 *
 * 由 QStash 调用，处理异步视频生成任务
 * 使用 Runware API 进行视频生成
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import prisma from '@/lib/prisma';
import { generateVideoAndWait } from '@/lib/services/runware-video';
import { uploadVideo } from '@/lib/services/r2-storage';
import { ProductType } from '@/config/productType';
import type { VideoQueuePayload } from '@/lib/queue/video-queue';
import { deductCreditsAtomic, refundCredits, type DeductionBreakdown } from '@/lib/credits';

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
    startFrame,
    endFrame: _endFrame,
  } = payload;

  console.log(`🚀 [VideoQueue] 开始处理视频任务: ${taskId}`);
  let deductionBreakdown: DeductionBreakdown | null = null;

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

    // 3. 扣减积分（返回扣减详情用于失败时精确返还）
    deductionBreakdown = await deductCreditsAtomic(
      userId,
      creditsCost,
      ProductType.TEXT_TO_VIDEO,
      isAnonymous,
      `Video: ${prompt.substring(0, 30)}${prompt.length > 30 ? '...' : ''}`,
      taskId
    );

    // 4. 更新进度到 20%
    await prisma.video_records.update({
      where: { task_id: taskId },
      data: { progress: 20 },
    });

    // 5. 提交视频生成任务到 Runware
    console.log(`🎬 [VideoQueue] 提交 Runware 任务: model=${model}, resolution=${resolution}, duration=${duration}s, hasImage=${!!startFrame}`);

    const runwareResult = await generateVideoAndWait(
      {
        prompt,
        negativePrompt,
        model, // Runware model ID (e.g., "google:3@2")
        duration,
        aspectRatio: aspectRatio as '16:9' | '9:16',
        seed,
        // 传递起始帧图片（如果有）
        inputImage: startFrame,
        // TODO: endFrame 支持需要根据具体模型 API 实现
      },
      async (progress) => {
        // 更新进度（30% - 90%）
        await prisma.video_records.update({
          where: { task_id: taskId },
          data: { progress },
        });
      }
    );

    if (!runwareResult.videoURL) {
      throw new Error('Video generation completed but no video URL returned');
    }

    // 6. 下载视频并上传到 R2
    console.log(`📤 [VideoQueue] 下载视频并上传到 R2...`);
    const videoResponse = await fetch(runwareResult.videoURL);
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.status}`);
    }
    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());

    const fileName = `${taskId}.mp4`;
    const videoUrl = await uploadVideo(
      videoBuffer,
      fileName,
      'video/mp4',
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
        api_cost: runwareResult.cost, // 实际 API 成本
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

    console.log(`✅ [VideoQueue] 视频任务处理成功: ${taskId}, api_cost=${runwareResult.cost}`);

    return NextResponse.json({
      success: true,
      taskId,
      videoUrl,
    });
  } catch (error) {
    console.error(`❌ [VideoQueue] 视频任务处理失败: ${taskId}`, error);

    // 如果积分已扣减，精确返还到原来的积分池
    if (deductionBreakdown) {
      try {
        await refundCredits(
          userId,
          deductionBreakdown,
          ProductType.TEXT_TO_VIDEO,
          isAnonymous,
          'Video task failed, refund credits',
          taskId
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