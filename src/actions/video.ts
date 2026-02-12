'use server';

/**
 * Video 模块 Server Actions
 */
import db from '@/lib/db';
import { videoRecords, taskQueue, anonymousUsers, users, creditHistory } from '@/db/schema';
import { eq, and, desc, count, gte, lte, inArray, sql } from 'drizzle-orm';
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
    await db.insert(videoRecords).values({
      userId,
      taskId,
      taskType: 'text_to_video',
      model,
      prompt: request.prompt,
      promptZh: request.prompt_zh || null,
      negativePrompt: request.negative_prompt || null,
      resolution: request.resolution,
      duration: request.duration,
      aspectRatio: request.aspect_ratio,
      seed: request.seed,
      isPublic: false,
      creditsCost: requiredCredits,
      status: 'PENDING',
      progress: 0,
      format: 'mp4',
      shareId,
    });

    // 5. 创建任务队列记录
    await db.insert(taskQueue).values({
      taskId,
      taskType: 'TEXT_TO_VIDEO',
      userId,
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
      retryCount: 0,
      maxRetries: 2,
      timeoutSeconds: 600,
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
      await db.update(anonymousUsers)
        .set({ credits: sql`${anonymousUsers.credits} - ${requiredCredits}` })
        .where(eq(anonymousUsers.userId, userId));
    } else {
      await db.update(users)
        .set({ credits: sql`${users.credits} - ${requiredCredits}` })
        .where(eq(users.userId, userId));
    }

    await db.insert(creditHistory).values({
      userId,
      amount: -requiredCredits,
      taskId,
      description: `AI Video generation (Seedance 1.5 Pro)`,
      productType: 'text_to_video',
    });

    // 8. 保存外部任务 ID，更新状态为 PROCESSING
    await db.update(videoRecords)
      .set({
        externalTaskId,
        status: 'PROCESSING',
        progress: 10,
      })
      .where(eq(videoRecords.taskId, taskId));

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
  const [record] = await db.select().from(videoRecords).where(eq(videoRecords.taskId, taskId)).limit(1);

  if (!record) {
    throw new Error(`Task not found: ${taskId}`);
  }

  // 如果任务还在处理中，且有外部任务 ID，直接查询 Kie.ai API
  // 不完全依赖回调（回调可能失败），作为轮询兜底
  // 超时判断：只在任务创建后 30 分钟内查询，避免无限轮询
  const taskAgeMinutes = (Date.now() - new Date(record.createdAt).getTime()) / 1000 / 60;
  const isWithinTimeout = taskAgeMinutes < 30;

  if (record.externalTaskId && (record.status === 'PENDING' || record.status === 'PROCESSING') && isWithinTimeout) {
    console.log(`🎬 [getVideoTaskStatus] 查询 Kie.ai API: ${record.externalTaskId}, 任务已创建 ${taskAgeMinutes.toFixed(1)} 分钟`);

    const kieStatus = await queryKieVideoTaskStatus(record.externalTaskId);

    // 如果 Kie.ai 返回成功，下载视频到 R2 并更新数据库
    if (kieStatus.status === 'SUCCESS' && kieStatus.videoUrl) {
      console.log('🎬 [getVideoTaskStatus] 开始下载视频到 R2...');

      const r2VideoUrl = await downloadAndUploadVideoToR2(
        kieStatus.videoUrl,
        record.taskId,
        record.userId
      );

      const finalVideoUrl = r2VideoUrl || kieStatus.videoUrl;

      await db.update(videoRecords)
        .set({
          status: 'SUCCESS',
          progress: 100,
          videoUrl: finalVideoUrl,
          apiCost: kieStatus.costTime ? kieStatus.costTime / 1000 : null,
          completedAt: new Date().toISOString(),
        })
        .where(eq(videoRecords.taskId, taskId));

      await db.update(taskQueue)
        .set({
          status: 'SUCCESS',
          completedAt: new Date().toISOString(),
        })
        .where(eq(taskQueue.taskId, taskId));

      console.log('🎬 [getVideoTaskStatus] 视频处理完成');

      return {
        task_id: taskId,
        status: 'SUCCESS',
        progress: 100,
        result: {
          video_url: finalVideoUrl,
          duration: record.actualDuration || record.duration,
          format: record.format,
          task_id: taskId,
          user_id: record.userId,
          record_id: record.id,
          credits_cost: record.creditsCost,
        },
        error: null,
      };
    }

    // 如果 Kie.ai 返回失败，更新数据库并返还积分（使用乐观锁防止重复处理）
    if (kieStatus.status === 'FAILURE') {
      const updateResult = await db.update(videoRecords)
        .set({
          status: 'FAILURE',
          progress: 0,
          errorMessage: kieStatus.error || 'Video generation failed',
          completedAt: new Date().toISOString(),
        })
        .where(and(eq(videoRecords.taskId, taskId), eq(videoRecords.status, 'PROCESSING')))
        .returning();

      // 如果更新成功（返回了行），说明是第一个处理的，需要返还积分
      if (updateResult.length > 0 && record.creditsCost && record.creditsCost > 0) {
        try {
          await refundCreditsSimple(
            record.userId,
            record.creditsCost,
            ProductType.TEXT_TO_VIDEO,
            `Video generation failed (KIE): ${kieStatus.error || 'Unknown error'}`,
            record.taskId
          );
          console.log(`💰 [getVideoTaskStatus] 积分已返还: ${record.creditsCost}`);
        } catch (refundError) {
          console.error(`❌ [getVideoTaskStatus] 积分返还失败:`, refundError);
        }
      } else if (updateResult.length === 0) {
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
      await db.update(videoRecords)
        .set({ progress: kieStatus.progress })
        .where(eq(videoRecords.taskId, taskId));
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
          video_url: record.videoUrl || '',
          duration: record.actualDuration || record.duration,
          format: record.format,
          task_id: taskId,
          user_id: record.userId,
          record_id: record.id,
          credits_cost: record.creditsCost,
        },
        error: null,
      };

    case 'FAILURE':
      return {
        task_id: taskId,
        status: 'FAILURE',
        progress: 0,
        result: null,
        error: record.errorMessage,
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

  const records = await db.select().from(videoRecords)
    .where(eq(videoRecords.userId, userId))
    .orderBy(desc(videoRecords.createdAt))
    .limit(limit);

  return records.map((r) => ({
    id: r.id,
    user_id: r.userId,
    task_id: r.taskId,
    task_type: r.taskType,
    model: r.model,
    prompt: r.prompt,
    prompt_zh: r.promptZh,
    negative_prompt: r.negativePrompt,
    resolution: r.resolution,
    duration: r.duration,
    aspect_ratio: r.aspectRatio,
    seed: r.seed,
    is_public: r.isPublic,
    credits_cost: r.creditsCost,
    status: r.status,
    progress: r.progress,
    video_url: r.videoUrl,
    thumbnail_url: r.thumbnailUrl,
    actual_duration: r.actualDuration,
    format: r.format,
    error_message: r.errorMessage,
    created_at: new Date(r.createdAt),
    completed_at: r.completedAt ? new Date(r.completedAt) : null,
    share_id: r.shareId,
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
  const conditions = [eq(videoRecords.userId, userId)];

  if (status) {
    if (status.includes(',')) {
      conditions.push(inArray(videoRecords.status, status.split(',')));
    } else {
      conditions.push(eq(videoRecords.status, status));
    }
  }

  if (start_date) {
    conditions.push(gte(videoRecords.createdAt, start_date.toISOString()));
  }
  if (end_date) {
    conditions.push(lte(videoRecords.createdAt, end_date.toISOString()));
  }

  const whereClause = and(...conditions);

  // 查询总数
  const [{ total }] = await db.select({ total: count() }).from(videoRecords).where(whereClause);

  // 查询记录
  const offset = (page - 1) * page_size;
  const records = await db.select().from(videoRecords)
    .where(whereClause)
    .orderBy(desc(videoRecords.createdAt))
    .offset(offset)
    .limit(page_size);

  const total_pages = Math.ceil(total / page_size);

  return {
    records: records.map((r) => ({
      id: r.id,
      user_id: r.userId,
      task_id: r.taskId,
      task_type: r.taskType,
      model: r.model,
      prompt: r.prompt,
      prompt_zh: r.promptZh,
      negative_prompt: r.negativePrompt,
      resolution: r.resolution,
      duration: r.duration,
      aspect_ratio: r.aspectRatio,
      seed: r.seed,
      is_public: r.isPublic,
      credits_cost: r.creditsCost,
      status: r.status,
      progress: r.progress,
      video_url: r.videoUrl,
      thumbnail_url: r.thumbnailUrl,
      actual_duration: r.actualDuration,
      format: r.format,
      error_message: r.errorMessage,
      created_at: new Date(r.createdAt),
      completed_at: r.completedAt ? new Date(r.completedAt) : null,
      share_id: r.shareId,
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

  const [record] = await db.select().from(videoRecords).where(eq(videoRecords.id, numericId)).limit(1);

  if (!record) {
    throw new Error(`Record not found: ${recordId}`);
  }

  if (record.userId !== userId) {
    throw new Error('Not authorized to delete this record');
  }

  await db.delete(videoRecords).where(eq(videoRecords.id, numericId));

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

    const [record] = await db.select().from(videoRecords)
      .where(and(eq(videoRecords.taskId, taskId), eq(videoRecords.userId, userId)))
      .limit(1);

    if (!record) {
      return null;
    }

    return {
      id: record.id,
      user_id: record.userId,
      task_id: record.taskId,
      task_type: record.taskType,
      model: record.model,
      prompt: record.prompt,
      prompt_zh: record.promptZh,
      negative_prompt: record.negativePrompt,
      resolution: record.resolution,
      duration: record.duration,
      aspect_ratio: record.aspectRatio,
      seed: record.seed,
      is_public: record.isPublic,
      credits_cost: record.creditsCost,
      status: record.status,
      progress: record.progress,
      video_url: record.videoUrl,
      thumbnail_url: record.thumbnailUrl,
      actual_duration: record.actualDuration,
      format: record.format,
      error_message: record.errorMessage,
      created_at: new Date(record.createdAt),
      completed_at: record.completedAt ? new Date(record.completedAt) : null,
      share_id: record.shareId,
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

  const [record] = await db.select().from(videoRecords).where(eq(videoRecords.id, recordId)).limit(1);

  if (!record) {
    throw new Error(`Record not found: ${recordId}`);
  }

  if (record.userId !== userId) {
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
  const createdAt = new Date(record.createdAt);
  const elapsedMinutes = (now.getTime() - createdAt.getTime()) / 1000 / 60;

  // 视频超时阈值：15分钟（视频生成时间较长）
  const TIMEOUT_THRESHOLD_MINUTES = 15;

  if (elapsedMinutes > TIMEOUT_THRESHOLD_MINUTES) {
    console.error(
      `❌ [checkStuckVideoTask] 任务 ${record.taskId} 已超时 ${elapsedMinutes.toFixed(1)} 分钟，标记为失败`
    );

    // 积分已扣减的条件：progress >= 20
    const creditsWereDeducted = (record.progress ?? 0) >= 20;

    const [updatedRecord] = await db.update(videoRecords)
      .set({
        status: 'FAILURE',
        progress: 0,
        errorMessage: `任务超时（运行时间: ${elapsedMinutes.toFixed(1)} 分钟）`,
        completedAt: now.toISOString(),
      })
      .where(eq(videoRecords.id, recordId))
      .returning();

    if (creditsWereDeducted) {
      const isAnonymous = unifiedUser.is_anonymous;
      if (isAnonymous) {
        await db.update(anonymousUsers)
          .set({ credits: sql`${anonymousUsers.credits} + ${record.creditsCost}` })
          .where(eq(anonymousUsers.userId, userId));
      } else {
        await db.update(users)
          .set({ credits: sql`${users.credits} + ${record.creditsCost}` })
          .where(eq(users.userId, userId));
      }
      console.log(`✅ [checkStuckVideoTask] 已返还 ${record.creditsCost} 积分给用户 ${userId}`);
    }

    return {
      handled: true,
      newStatus: 'FAILURE',
      message: creditsWereDeducted
        ? `任务超时已取消，已返还 ${record.creditsCost} 积分`
        : '任务超时已取消（积分未扣减）',
      record: mapRecord(updatedRecord),
    };
  }

  console.log(`⏳ [checkStuckVideoTask] 任务 ${record.taskId} 运行 ${elapsedMinutes.toFixed(1)} 分钟，继续等待`);

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
  userId: string;
  taskId: string;
  taskType: string;
  model: string;
  prompt: string;
  promptZh: string | null;
  negativePrompt: string | null;
  resolution: string;
  duration: number;
  aspectRatio: string;
  seed: number | null;
  isPublic: boolean;
  creditsCost: number;
  status: string;
  progress: number;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  actualDuration: number | null;
  format: string;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
  shareId: string | null;
}): VideoRecord {
  return {
    id: r.id,
    user_id: r.userId,
    task_id: r.taskId,
    task_type: r.taskType,
    model: r.model,
    prompt: r.prompt,
    prompt_zh: r.promptZh,
    negative_prompt: r.negativePrompt,
    resolution: r.resolution,
    duration: r.duration,
    aspect_ratio: r.aspectRatio,
    seed: r.seed,
    is_public: r.isPublic,
    credits_cost: r.creditsCost,
    status: r.status,
    progress: r.progress,
    video_url: r.videoUrl,
    thumbnail_url: r.thumbnailUrl,
    actual_duration: r.actualDuration,
    format: r.format,
    error_message: r.errorMessage,
    created_at: new Date(r.createdAt),
    completed_at: r.completedAt ? new Date(r.completedAt) : null,
    share_id: r.shareId,
  };
}
