'use server';

/**
 * Video 模块 Server Actions
 */
import prisma from '@/lib/prisma';
import { getUserOrAnonymous } from '@/lib/auth-firebase';
import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid';
import { createKieVideoTask, queryKieVideoTaskStatus } from '@/lib/services/kie-video';
import { uploadVideo } from '@/lib/services/r2-storage';
import { InsufficientCreditsError, errorToResponse } from '@/lib/errors';
import { calculateVideoCost, type VideoResolution, type VideoDuration } from '@/config/creditsCost';
import { checkCredits, refundCreditsSimple } from '@/lib/credits';
import { ProductType } from '@/config/productType';

/**
 * 生成分享短码
 */
function generateShareId(): string {
  return nanoid(8);
}

// 类型定义
export interface VideoGenerationRequest {
  /** 视频描述提示词 */
  prompt: string;
  /** 翻译后的中文提示词（可选） */
  prompt_zh?: string;
  /** 负面提示词 */
  negative_prompt?: string;
  /** 分辨率 */
  resolution: VideoResolution;
  /** 时长（秒） */
  duration: VideoDuration;
  /** 宽高比 */
  aspect_ratio: '16:9' | '9:16';
  /** 模型 */
  model?: string;
  /** 随机种子 */
  seed?: number;
}

export interface VideoTaskStatus {
  task_id: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILURE';
  progress: number;
  result?: {
    video_url: string;
    duration: number;
    format: string;
    task_id: string;
    user_id: string;
    record_id: number;
    credits_cost: number;
  } | null;
  error?: string | null;
  errorCode?: string;
  errorData?: Record<string, unknown>;
}

export interface VideoRecord {
  id: number;
  user_id: string;
  task_id: string;
  task_type: string;
  model: string;
  prompt: string;
  prompt_zh: string | null;
  negative_prompt: string | null;
  resolution: string;
  duration: number;
  aspect_ratio: string;
  seed: number | null;
  is_public: boolean;
  credits_cost: number;
  status: string;
  progress: number;
  video_url: string | null;
  thumbnail_url: string | null;
  actual_duration: number | null;
  format: string;
  error_message: string | null;
  created_at: Date;
  completed_at: Date | null;
  share_id: string | null;
}

export interface VideoRecordsQueryResponse {
  records: VideoRecord[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/**
 * 创建视频生成任务（异步）
 */
export async function createVideoTask(request: VideoGenerationRequest): Promise<VideoTaskStatus> {
  console.log('🎬 [createVideoTask] 开始创建视频任务');

  try {
    const unifiedUser = await getUserOrAnonymous();
    const userId = unifiedUser.user_id;
    const isAnonymous = unifiedUser.is_anonymous;

    console.log('🎬 [createVideoTask] 用户认证成功:', { userId, isAnonymous });

    // 1. 计算所需积分
    const requiredCredits = calculateVideoCost(request.resolution, request.duration);
    if (requiredCredits === 0) {
      throw new Error(`Unsupported resolution or duration: ${request.resolution} / ${request.duration}s`);
    }

    // 2. 检查积分是否足够
    const { hasEnough, current } = await checkCredits(userId, requiredCredits, isAnonymous);
    if (!hasEnough) {
      console.log(`⚠️ [createVideoTask] 积分不足: 需要 ${requiredCredits}, 当前 ${current}`);
      throw new InsufficientCreditsError(requiredCredits, current);
    }

    // 3. 生成任务 ID
    const taskId = uuidv4();
    const model = request.model || 'bytedance/seedance-1.5-pro';

    // 4. 创建视频记录
    const shareId = generateShareId();
    await prisma.video_records.create({
      data: {
        user_id: userId,
        task_id: taskId,
        task_type: 'text_to_video',
        model,
        prompt: request.prompt,
        prompt_zh: request.prompt_zh || null,
        negative_prompt: request.negative_prompt || null,
        resolution: request.resolution,
        duration: request.duration,
        aspect_ratio: request.aspect_ratio,
        seed: request.seed,
        is_public: false,
        credits_cost: requiredCredits,
        status: 'PENDING',
        progress: 0,
        format: 'mp4',
        share_id: shareId,
      },
    });

    // 5. 创建任务队列记录
    await prisma.task_queue.create({
      data: {
        task_id: taskId,
        task_type: 'TEXT_TO_VIDEO',
        user_id: userId,
        status: 'PENDING',
        priority: 5,
        payload: {
          prompt: request.prompt,
          prompt_zh: request.prompt_zh || null,
          negative_prompt: request.negative_prompt || null,
          resolution: request.resolution,
          duration: request.duration,
          aspect_ratio: request.aspect_ratio,
          model,
          seed: request.seed,
          credits_cost: requiredCredits,
          is_anonymous: isAnonymous,
        },
        retry_count: 0,
        max_retries: 2,
        timeout_seconds: 600,
      },
    });

    console.log(`视频任务已创建: ${taskId}, 用户: ${userId}, 积分: ${requiredCredits}`);

    // 6. 直接调用 Kie.ai API（参照 music.ts 的直调模式）
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.voicica.ai'}/api/webhooks/kie-video`;

    const externalTaskId = await createKieVideoTask({
      prompt: request.prompt,
      aspectRatio: request.aspect_ratio as '1:1' | '21:9' | '4:3' | '3:4' | '16:9' | '9:16',
      resolution: request.resolution as '480p' | '720p',
      duration: String(request.duration) as '4' | '8' | '12',
      callBackUrl: callbackUrl,
    });

    // 7. API 成功后扣减积分
    if (isAnonymous) {
      await prisma.anonymous_users.update({
        where: { user_id: userId },
        data: { credits: { decrement: requiredCredits } },
      });
    } else {
      await prisma.users.update({
        where: { user_id: userId },
        data: { credits: { decrement: requiredCredits } },
      });
    }

    await prisma.credit_history.create({
      data: {
        user_id: userId,
        amount: -requiredCredits,
        task_id: taskId,
        description: `AI Video generation (Seedance 1.5 Pro)`,
        product_type: 'text_to_video',
      },
    });

    // 8. 保存外部任务 ID，更新状态为 PROCESSING
    await prisma.video_records.update({
      where: { task_id: taskId },
      data: {
        external_task_id: externalTaskId,
        status: 'PROCESSING',
        progress: 10,
      },
    });

    console.log(`✅ 视频任务已提交到 Kie.ai: ${taskId} -> ${externalTaskId}`);

    return {
      task_id: taskId,
      status: 'PROCESSING' as const,
      progress: 10,
      result: null,
      error: null,
    };
  } catch (error) {
    console.error('❌ [createVideoTask] 创建任务失败:', error);

    const errorResponse = errorToResponse(error);

    return {
      task_id: '',
      status: 'FAILURE',
      progress: 0,
      result: null,
      ...errorResponse,
    };
  }
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
    console.log(`📥 [Video] 下载视频: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`📥 [Video] 下载失败: ${response.status}`);
      return null;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const fileName = `${taskId}.mp4`;
    const r2Url = await uploadVideo(buffer, fileName, 'video/mp4', `videos/${userId}`);
    console.log(`✅ [Video] 视频上传成功: ${r2Url}`);
    return r2Url;
  } catch (error) {
    console.error(`❌ [Video] 上传失败:`, error);
    return null;
  }
}

/**
 * 查询视频任务状态
 *
 * 对于 PROCESSING 任务，主动查询 Kie.ai API 获取最新状态（和 Music 相同的轮询兜底模式）
 */
export async function getVideoTaskStatus(taskId: string): Promise<VideoTaskStatus> {
  const record = await prisma.video_records.findUnique({
    where: { task_id: taskId },
  });

  if (!record) {
    throw new Error(`Task not found: ${taskId}`);
  }

  // 如果任务还在处理中，且有外部任务 ID，直接查询 Kie.ai API
  // 不完全依赖回调（回调可能失败），作为轮询兜底
  // 超时判断：只在任务创建后 30 分钟内查询，避免无限轮询
  const taskAgeMinutes = (Date.now() - new Date(record.created_at).getTime()) / 1000 / 60;
  const isWithinTimeout = taskAgeMinutes < 30;

  if (record.external_task_id && (record.status === 'PENDING' || record.status === 'PROCESSING') && isWithinTimeout) {
    console.log(`🎬 [getVideoTaskStatus] 查询 Kie.ai API: ${record.external_task_id}, 任务已创建 ${taskAgeMinutes.toFixed(1)} 分钟`);

    const kieStatus = await queryKieVideoTaskStatus(record.external_task_id);

    // 如果 Kie.ai 返回成功，下载视频到 R2 并更新数据库
    if (kieStatus.status === 'SUCCESS' && kieStatus.videoUrl) {
      console.log('🎬 [getVideoTaskStatus] 开始下载视频到 R2...');

      const r2VideoUrl = await downloadAndUploadVideoToR2(
        kieStatus.videoUrl,
        record.task_id,
        record.user_id
      );

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

      await prisma.task_queue.updateMany({
        where: { task_id: taskId },
        data: {
          status: 'SUCCESS',
          completed_at: new Date(),
        },
      });

      console.log('🎬 [getVideoTaskStatus] 视频处理完成');

      return {
        task_id: taskId,
        status: 'SUCCESS',
        progress: 100,
        result: {
          video_url: finalVideoUrl,
          duration: record.actual_duration || record.duration,
          format: record.format,
          task_id: taskId,
          user_id: record.user_id,
          record_id: record.id,
          credits_cost: record.credits_cost,
        },
        error: null,
      };
    }

    // 如果 Kie.ai 返回失败，更新数据库并返还积分（使用乐观锁防止重复处理）
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
      if (updateResult.count > 0 && record.credits_cost && record.credits_cost > 0) {
        try {
          await refundCreditsSimple(
            record.user_id,
            record.credits_cost,
            ProductType.TEXT_TO_VIDEO,
            `Video generation failed (KIE): ${kieStatus.error || 'Unknown error'}`,
            record.task_id
          );
          console.log(`💰 [getVideoTaskStatus] 积分已返还: ${record.credits_cost}`);
        } catch (refundError) {
          console.error(`❌ [getVideoTaskStatus] 积分返还失败:`, refundError);
        }
      } else if (updateResult.count === 0) {
        console.log(`⚠️ [getVideoTaskStatus] 任务已被其他请求处理，跳过积分返还: ${taskId}`);
      }

      return {
        task_id: taskId,
        status: 'FAILURE',
        progress: 0,
        result: null,
        error: kieStatus.error || null,
      };
    }

    // 仍在处理中，更新进度
    if (kieStatus.progress !== record.progress) {
      await prisma.video_records.update({
        where: { task_id: taskId },
        data: { progress: kieStatus.progress },
      });
    }

    return {
      task_id: taskId,
      status: 'PROCESSING',
      progress: kieStatus.progress,
      result: null,
      error: kieStatus.error || null,
    };
  }

  // 任务已完成或超时，直接从数据库读取
  switch (record.status) {
    case 'PENDING':
      return {
        task_id: taskId,
        status: 'PENDING',
        progress: record.progress,
        result: null,
        error: null,
      };

    case 'PROCESSING':
      return {
        task_id: taskId,
        status: 'PROCESSING',
        progress: record.progress,
        result: null,
        error: null,
      };

    case 'SUCCESS':
      return {
        task_id: taskId,
        status: 'SUCCESS',
        progress: 100,
        result: {
          video_url: record.video_url || '',
          duration: record.actual_duration || record.duration,
          format: record.format,
          task_id: taskId,
          user_id: record.user_id,
          record_id: record.id,
          credits_cost: record.credits_cost,
        },
        error: null,
      };

    case 'FAILURE':
      return {
        task_id: taskId,
        status: 'FAILURE',
        progress: 0,
        result: null,
        error: record.error_message,
      };

    default:
      throw new Error(`Unknown task status: ${record.status}`);
  }
}

/**
 * 获取用户视频历史记录
 */
export async function getVideoRecords(limit: number = 50): Promise<VideoRecord[]> {
  const unifiedUser = await getUserOrAnonymous();
  const userId = unifiedUser.user_id;

  const records = await prisma.video_records.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
    take: limit,
  });

  return records.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    task_id: r.task_id,
    task_type: r.task_type,
    model: r.model,
    prompt: r.prompt,
    prompt_zh: r.prompt_zh,
    negative_prompt: r.negative_prompt,
    resolution: r.resolution,
    duration: r.duration,
    aspect_ratio: r.aspect_ratio,
    seed: r.seed,
    is_public: r.is_public,
    credits_cost: r.credits_cost,
    status: r.status,
    progress: r.progress,
    video_url: r.video_url,
    thumbnail_url: r.thumbnail_url,
    actual_duration: r.actual_duration,
    format: r.format,
    error_message: r.error_message,
    created_at: r.created_at,
    completed_at: r.completed_at,
    share_id: r.share_id,
  }));
}

/**
 * 高级查询视频记录（支持分页和过滤）
 */
export async function queryVideoRecords(params: {
  status?: string;
  start_date?: Date;
  end_date?: Date;
  page?: number;
  page_size?: number;
}): Promise<VideoRecordsQueryResponse> {
  const unifiedUser = await getUserOrAnonymous();
  const userId = unifiedUser.user_id;

  const { status, start_date, end_date, page = 1, page_size = 20 } = params;

  // 构建查询条件
  const where: Record<string, unknown> = {
    user_id: userId,
  };

  if (status) {
    if (status.includes(',')) {
      where.status = { in: status.split(',') };
    } else {
      where.status = status;
    }
  }

  if (start_date || end_date) {
    where.created_at = {};
    if (start_date) {
      (where.created_at as Record<string, unknown>).gte = start_date;
    }
    if (end_date) {
      (where.created_at as Record<string, unknown>).lte = end_date;
    }
  }

  // 查询总数
  const total = await prisma.video_records.count({ where });

  // 查询记录
  const offset = (page - 1) * page_size;
  const records = await prisma.video_records.findMany({
    where,
    orderBy: { created_at: 'desc' },
    skip: offset,
    take: page_size,
  });

  const total_pages = Math.ceil(total / page_size);

  return {
    records: records.map((r) => ({
      id: r.id,
      user_id: r.user_id,
      task_id: r.task_id,
      task_type: r.task_type,
      model: r.model,
      prompt: r.prompt,
      prompt_zh: r.prompt_zh,
      negative_prompt: r.negative_prompt,
      resolution: r.resolution,
      duration: r.duration,
      aspect_ratio: r.aspect_ratio,
      seed: r.seed,
      is_public: r.is_public,
      credits_cost: r.credits_cost,
      status: r.status,
      progress: r.progress,
      video_url: r.video_url,
      thumbnail_url: r.thumbnail_url,
      actual_duration: r.actual_duration,
      format: r.format,
      error_message: r.error_message,
      created_at: r.created_at,
      completed_at: r.completed_at,
      share_id: r.share_id,
    })),
    total,
    page,
    page_size,
    total_pages,
  };
}

/**
 * 删除单个视频记录
 */
export async function deleteVideoRecord(recordId: string): Promise<void> {
  const unifiedUser = await getUserOrAnonymous();
  const userId = unifiedUser.user_id;

  const numericId = parseInt(recordId, 10);
  if (isNaN(numericId)) {
    throw new Error(`Invalid record ID: ${recordId}`);
  }

  const record = await prisma.video_records.findUnique({
    where: { id: numericId },
  });

  if (!record) {
    throw new Error(`Record not found: ${recordId}`);
  }

  if (record.user_id !== userId) {
    throw new Error('Not authorized to delete this record');
  }

  await prisma.video_records.delete({
    where: { id: numericId },
  });

  console.log(`视频记录已删除: ${recordId}`);
}

/**
 * 根据 taskId 获取单条视频记录
 */
export async function getVideoRecordByTaskId(taskId: string): Promise<VideoRecord | null> {
  try {
    const unifiedUser = await getUserOrAnonymous();
    const userId = unifiedUser.user_id;
    if (!userId) {
      return null;
    }

    const record = await prisma.video_records.findFirst({
      where: {
        task_id: taskId,
        user_id: userId,
      },
    });

    if (!record) {
      return null;
    }

    return {
      id: record.id,
      user_id: record.user_id,
      task_id: record.task_id,
      task_type: record.task_type,
      model: record.model,
      prompt: record.prompt,
      prompt_zh: record.prompt_zh,
      negative_prompt: record.negative_prompt,
      resolution: record.resolution,
      duration: record.duration,
      aspect_ratio: record.aspect_ratio,
      seed: record.seed,
      is_public: record.is_public,
      credits_cost: record.credits_cost,
      status: record.status,
      progress: record.progress,
      video_url: record.video_url,
      thumbnail_url: record.thumbnail_url,
      actual_duration: record.actual_duration,
      format: record.format,
      error_message: record.error_message,
      created_at: record.created_at,
      completed_at: record.completed_at,
      share_id: record.share_id,
    };
  } catch (error) {
    console.error('❌ [getVideoRecordByTaskId] Error:', error);
    return null;
  }
}

/**
 * 检查并处理超时的视频任务
 */
export async function checkAndHandleStuckVideoTask(
  recordId: number
): Promise<{
  handled: boolean;
  newStatus: 'FAILURE' | 'PROCESSING' | 'SUCCESS' | 'PENDING';
  message: string;
  record: VideoRecord;
}> {
  const unifiedUser = await getUserOrAnonymous();
  const userId = unifiedUser.user_id;

  const record = await prisma.video_records.findUnique({
    where: { id: recordId },
  });

  if (!record) {
    throw new Error(`Record not found: ${recordId}`);
  }

  if (record.user_id !== userId) {
    throw new Error('Not authorized to access this record');
  }

  // 如果任务已经完成，直接返回
  if (record.status === 'SUCCESS' || record.status === 'FAILURE') {
    return {
      handled: false,
      newStatus: record.status as 'SUCCESS' | 'FAILURE',
      message: '任务已完成',
      record: mapRecord(record),
    };
  }

  // 检查任务创建时间，判断是否超时
  const now = new Date();
  const createdAt = new Date(record.created_at);
  const elapsedMinutes = (now.getTime() - createdAt.getTime()) / 1000 / 60;

  // 视频超时阈值：15分钟（视频生成时间较长）
  const TIMEOUT_THRESHOLD_MINUTES = 15;

  if (elapsedMinutes > TIMEOUT_THRESHOLD_MINUTES) {
    console.error(
      `❌ [checkStuckVideoTask] 任务 ${record.task_id} 已超时 ${elapsedMinutes.toFixed(1)} 分钟，标记为失败`
    );

    // 积分已扣减的条件：progress >= 20
    const creditsWereDeducted = (record.progress ?? 0) >= 20;

    const updatedRecord = await prisma.$transaction(async (tx) => {
      const updated = await tx.video_records.update({
        where: { id: recordId },
        data: {
          status: 'FAILURE',
          progress: 0,
          error_message: `任务超时（运行时间: ${elapsedMinutes.toFixed(1)} 分钟）`,
          completed_at: now,
        },
      });

      if (creditsWereDeducted) {
        const isAnonymous = unifiedUser.is_anonymous;
        if (isAnonymous) {
          await tx.anonymous_users.update({
            where: { user_id: userId },
            data: { credits: { increment: record.credits_cost } },
          });
        } else {
          await tx.users.update({
            where: { user_id: userId },
            data: { credits: { increment: record.credits_cost } },
          });
        }
        console.log(`✅ [checkStuckVideoTask] 已返还 ${record.credits_cost} 积分给用户 ${userId}`);
      }

      return updated;
    });

    return {
      handled: true,
      newStatus: 'FAILURE',
      message: creditsWereDeducted
        ? `任务超时已取消，已返还 ${record.credits_cost} 积分`
        : '任务超时已取消（积分未扣减）',
      record: mapRecord(updatedRecord),
    };
  }

  console.log(`⏳ [checkStuckVideoTask] 任务 ${record.task_id} 运行 ${elapsedMinutes.toFixed(1)} 分钟，继续等待`);

  return {
    handled: false,
    newStatus: record.status as 'PROCESSING' | 'PENDING',
    message: `任务仍在处理中（已运行 ${elapsedMinutes.toFixed(1)} 分钟）`,
    record: mapRecord(record),
  };
}

// 辅助函数：映射数据库记录到返回类型
function mapRecord(r: {
  id: number;
  user_id: string;
  task_id: string;
  task_type: string;
  model: string;
  prompt: string;
  prompt_zh: string | null;
  negative_prompt: string | null;
  resolution: string;
  duration: number;
  aspect_ratio: string;
  seed: number | null;
  is_public: boolean;
  credits_cost: number;
  status: string;
  progress: number;
  video_url: string | null;
  thumbnail_url: string | null;
  actual_duration: number | null;
  format: string;
  error_message: string | null;
  created_at: Date;
  completed_at: Date | null;
  share_id: string | null;
}): VideoRecord {
  return {
    id: r.id,
    user_id: r.user_id,
    task_id: r.task_id,
    task_type: r.task_type,
    model: r.model,
    prompt: r.prompt,
    prompt_zh: r.prompt_zh,
    negative_prompt: r.negative_prompt,
    resolution: r.resolution,
    duration: r.duration,
    aspect_ratio: r.aspect_ratio,
    seed: r.seed,
    is_public: r.is_public,
    credits_cost: r.credits_cost,
    status: r.status,
    progress: r.progress,
    video_url: r.video_url,
    thumbnail_url: r.thumbnail_url,
    actual_duration: r.actual_duration,
    format: r.format,
    error_message: r.error_message,
    created_at: r.created_at,
    completed_at: r.completed_at,
    share_id: r.share_id,
  };
}