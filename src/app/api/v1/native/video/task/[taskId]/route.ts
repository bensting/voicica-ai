/**
 * Native App Video Task Status API
 *
 * GET /api/v1/native/video/task/:taskId
 * 获取视频任务状态
 *
 * 对于 KIE 后端的任务，会主动查询 KIE API 获取最新状态（和 Music 相同的模式）
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserOrAnonymous } from '@/lib/auth-firebase';
import { queryKieVideoTaskStatus } from '@/lib/services/kie-video';
import { uploadVideo } from '@/lib/services/r2-storage';
import { videoModelsConfig } from '@/config/native/videoModels';
import { refundCreditsSimple } from '@/lib/credits';
import { ProductType } from '@/config/productType';

/**
 * 从 URL 下载视频并上传到 R2
 */
async function downloadAndUploadVideoToR2(
  url: string,
  taskId: string,
  userId: string
): Promise<string | null> {
  try {
    console.log(`📥 [Video Status] 下载视频: ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
      console.error(`📥 [Video Status] 下载失败: ${response.status}`);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const fileName = `${taskId}.mp4`;
    const r2Url = await uploadVideo(buffer, fileName, 'video/mp4', `videos/${userId}`);
    console.log(`✅ [Video Status] 视频上传成功: ${r2Url}`);
    return r2Url;
  } catch (error) {
    console.error(`❌ [Video Status] 上传失败:`, error);
    return null;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    // 1. 获取用户身份
    const { user_id } = await getUserOrAnonymous();

    // 2. 获取任务 ID
    const { taskId } = await params;

    // 3. 查询任务记录
    const task = await prisma.video_records.findUnique({
      where: { task_id: taskId },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // 4. 验证用户权限（只能查看自己的任务）
    if (task.user_id !== user_id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // 5. 对于 KIE 后端的 PROCESSING 任务，主动查询 KIE API
    // 检查任务是否使用 KIE 后端
    const modelConfig = videoModelsConfig.find((m) => m.apiModelId === task.model || m.id === task.model);
    const isKieBackend = modelConfig?.apiBackend === 'kie';

    // 任务超时判断：只在任务创建后 30 分钟内查询 KIE API
    const taskAgeMinutes = (Date.now() - new Date(task.created_at).getTime()) / 1000 / 60;
    const isWithinTimeout = taskAgeMinutes < 30;

    if (
      isKieBackend &&
      task.external_task_id &&
      task.status === 'PROCESSING' &&
      isWithinTimeout
    ) {
      console.log(`🎬 [Video Status] 查询 KIE API: ${task.external_task_id}, 任务已创建 ${taskAgeMinutes.toFixed(1)} 分钟`);

      const kieStatus = await queryKieVideoTaskStatus(task.external_task_id);

      // 如果 KIE 返回成功，下载视频到 R2 并更新数据库
      if (kieStatus.status === 'SUCCESS' && kieStatus.videoUrl) {
        console.log('🎬 [Video Status] KIE 任务完成，开始下载视频到 R2...');

        const r2VideoUrl = await downloadAndUploadVideoToR2(
          kieStatus.videoUrl,
          task.task_id,
          task.user_id
        );

        // 使用 R2 URL（如果上传成功），否则保留原始 URL
        const finalVideoUrl = r2VideoUrl || kieStatus.videoUrl;

        await prisma.video_records.update({
          where: { task_id: taskId },
          data: {
            status: 'SUCCESS',
            progress: 100,
            video_url: finalVideoUrl,
            api_cost: kieStatus.costTime ? kieStatus.costTime / 1000 : null,
            completed_at: new Date(),
          },
        });

        // 更新 task_queue
        await prisma.task_queue.updateMany({
          where: { task_id: taskId },
          data: {
            status: 'SUCCESS',
            completed_at: new Date(),
          },
        });

        console.log(`✅ [Video Status] 视频处理完成: ${taskId}`);

        return NextResponse.json({
          success: true,
          task: {
            task_id: task.task_id,
            status: 'SUCCESS',
            progress: 100,
            prompt: task.prompt,
            model: task.model,
            resolution: task.resolution,
            duration: task.duration,
            aspect_ratio: task.aspect_ratio,
            video_url: finalVideoUrl,
            is_public: task.is_public,
            error_message: null,
            created_at: task.created_at?.toISOString(),
            completed_at: new Date().toISOString(),
          },
        });
      }

      // 如果 KIE 返回失败，更新数据库（使用乐观锁防止重复处理）
      if (kieStatus.status === 'FAILURE') {
        const updateResult = await prisma.video_records.updateMany({
          where: {
            task_id: taskId,
            status: 'PROCESSING', // 乐观锁：防止重复处理
          },
          data: {
            status: 'FAILURE',
            progress: 0,
            error_message: kieStatus.error || 'Video generation failed',
            completed_at: new Date(),
          },
        });

        // 如果更新成功（count > 0），说明是第一个处理的，需要返还积分
        if (updateResult.count > 0) {
          // 更新 task_queue
          await prisma.task_queue.updateMany({
            where: { task_id: taskId },
            data: {
              status: 'FAILURE',
              error_message: kieStatus.error || 'Video generation failed',
              completed_at: new Date(),
            },
          });

          // 返还积分
          if (task.credits_cost && task.credits_cost > 0) {
            try {
              await refundCreditsSimple(
                task.user_id,
                task.credits_cost,
                ProductType.TEXT_TO_VIDEO,
                `Video generation failed (KIE): ${kieStatus.error || 'Unknown error'}`,
                task.task_id
              );
              console.log(`💰 [Video Status] 积分已返还: ${task.credits_cost}`);
            } catch (refundError) {
              console.error(`❌ [Video Status] 积分返还失败:`, refundError);
            }
          }

          console.log(`❌ [Video Status] 视频生成失败: ${taskId}, error=${kieStatus.error}`);
        } else {
          console.log(`⚠️ [Video Status] 任务已被其他请求处理，跳过积分返还: ${taskId}`);
        }

        return NextResponse.json({
          success: true,
          task: {
            task_id: task.task_id,
            status: 'FAILURE',
            progress: 0,
            prompt: task.prompt,
            model: task.model,
            resolution: task.resolution,
            duration: task.duration,
            aspect_ratio: task.aspect_ratio,
            video_url: null,
            is_public: task.is_public,
            error_message: kieStatus.error || 'Video generation failed',
            created_at: task.created_at?.toISOString(),
            completed_at: new Date().toISOString(),
          },
        });
      }

      // 仍在处理中，更新进度
      if (kieStatus.progress !== task.progress) {
        await prisma.video_records.update({
          where: { task_id: taskId },
          data: { progress: kieStatus.progress },
        });
      }

      return NextResponse.json({
        success: true,
        task: {
          task_id: task.task_id,
          status: 'PROCESSING',
          progress: kieStatus.progress,
          prompt: task.prompt,
          model: task.model,
          resolution: task.resolution,
          duration: task.duration,
          aspect_ratio: task.aspect_ratio,
          video_url: null,
          is_public: task.is_public,
          error_message: kieStatus.error || null,
          created_at: task.created_at?.toISOString(),
          completed_at: null,
        },
      });
    }

    // 6. 直接从数据库读取状态（非 KIE 任务或已完成的任务）
    return NextResponse.json({
      success: true,
      task: {
        task_id: task.task_id,
        status: task.status,
        progress: task.progress,
        prompt: task.prompt,
        model: task.model,
        resolution: task.resolution,
        duration: task.duration,
        aspect_ratio: task.aspect_ratio,
        video_url: task.video_url,
        is_public: task.is_public,
        error_message: task.error_message,
        created_at: task.created_at?.toISOString(),
        completed_at: task.completed_at?.toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ [NativeVideo] 获取任务状态失败:', error);

    if (error instanceof Error && error.message === '未提供认证信息') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get task status',
      },
      { status: 500 }
    );
  }
}
