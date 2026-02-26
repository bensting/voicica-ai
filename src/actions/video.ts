'use server';

/**
 * Video 模块 Server Actions
 */
import { getDb } from '@/lib/db';
import { videoRecords, taskQueue } from '@/db/schema';
import { eq, and, desc, count, gte, lte, inArray } from 'drizzle-orm';
import { getUserOrAnonymous } from '@/lib/auth-firebase';
import { queryKieVideoTaskStatus } from '@/lib/services/kie-video';
import { uploadVideo } from '@/lib/services/r2-storage';
import { refundCreditsSimple } from '@/lib/credits';
import { ProductType } from '@/config/productType';

// 类型定义
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
  const db = await getDb();
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
  const db = await getDb();
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
  const db = await getDb();
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
  const db = await getDb();
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
  const db = await getDb();
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
