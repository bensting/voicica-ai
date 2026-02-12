'use server';

/**
 * TTS 模块 Server Actions
 */
import db from '@/lib/db';
import { ttsRecords, voices, taskQueue, anonymousUsers, users, storyParagraphs, stories } from '@/db/schema';
import { eq, and, desc, count, gte, lte, inArray, sql } from 'drizzle-orm';
import { getUserOrAnonymous } from '@/lib/auth-firebase';
import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid';
import { ttsQueue } from '@/lib/queue/tts-queue';
import { InsufficientCreditsError, errorToResponse } from '@/lib/errors';
import { calculateProductCreditsCost } from '@/config/creditsCost';
import { ProductType } from '@/config/productType';
import { checkCredits } from '@/lib/credits';

/**
 * 生成分享短码
 * 使用 nanoid 生成 8 位 URL 安全的随机字符串
 */
function generateShareId(): string {
  return nanoid(8);
}

// 类型定义
export interface TtsRequest {
  text: string;
  voice_name: string;
  language?: string;
  style?: string; // 语音风格，如 "calm", "cheerful" 等
  speed?: number;
  pitch?: number;
  volume?: number;
  story_id?: string; // 关联的故事 ID（可选）
  paragraph_id?: string; // 关联的段落 ID（可选）
  platform?: string; // 来源平台：web, mobile-web, android, ios
}

export interface TtsTaskStatus {
  task_id: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILURE';
  progress: number;
  result?: {
    audio_url: string;
    duration: number;
    format: string;
    task_id: string;
    user_id: string;
    record_id: number;
    credits_cost: number;
  } | null;
  error?: string | null;
  errorCode?: string; // 错误码，用于前端国际化
  errorData?: Record<string, unknown>; // 错误相关数据，如 { required: 100, current: 50 }
}

export interface TtsRecordVoice {
  id: number;
  name: string;
  display_name: string | null;
  provider: string;
  locale: string;
  country: string;
  gender: string;
  avatar_url: string;
}

export interface TtsRecord {
  id: number;
  user_id: string;
  task_id: string;
  text: string;
  voice_name: string;
  language: string | null;
  style: string | null;
  speed: number;
  pitch: number;
  volume: number;
  credits_cost: number;
  character_count: number;
  status: string;
  progress: number;
  audio_url: string | null;
  duration: number | null;
  format: string;
  error_message: string | null;
  created_at: Date;
  completed_at: Date | null;
  share_id: string | null;
  story_id: string | null; // 关联的故事 ID
  voice?: TtsRecordVoice | null;
}

/**
 * 公开分享记录接口（用于分享页面展示）
 */
export interface SharedTtsRecord {
  share_id: string;
  text: string;
  audio_url: string;
  duration: number;
  character_count: number;
  created_at: Date;
  voice: {
    name: string;
    display_name: string | null;
    avatar_url: string;
  } | null;
}

export interface TtsRecordsQueryResponse {
  records: TtsRecord[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/**
 * 根据语音 role 映射到计费类型
 * role 值：celebrity, professional, standard 等
 */
function mapRoleToVoiceType(role: string): 'standard' | 'professional' | 'celebrity' | 'special' | 'clone' {
  const normalizedRole = role.toLowerCase();
  if (normalizedRole === 'celebrity') return 'celebrity';
  if (normalizedRole === 'professional') return 'professional';
  if (normalizedRole === 'special') return 'special';
  if (normalizedRole === 'clone') return 'clone';
  return 'standard';
}

/**
 * 计算 TTS 积分消耗
 *
 * 计费规则：每 100 个字符消耗对应积分，不足 100 也按一个单位计算
 * 根据语音的 role 确定计费类型（standard/professional/celebrity/special/clone）
 *
 * @param text 待转换文本
 * @param voiceName 语音名称
 */
async function calculateCreditsCost(text: string, voiceName: string): Promise<number> {
  // 查询语音的 role 来确定计费类型
  const [voice] = await db.select({ role: voices.role }).from(voices).where(eq(voices.name, voiceName)).limit(1);

  const voiceType = voice ? mapRoleToVoiceType(voice.role) : 'standard';
  console.log(`💰 [calculateCreditsCost] voice=${voiceName}, role=${voice?.role}, voiceType=${voiceType}`);

  return calculateProductCreditsCost(ProductType.TEXT_TO_SPEECH, {
    charCount: text.length,
    voiceType,
  });
}

/**
 * 创建 TTS 任务（异步）
 *
 * 返回任务 ID，实际处理由后台 Worker 完成
 */
export async function createTtsTask(request: TtsRequest): Promise<TtsTaskStatus> {
  console.log('🎤 [createTtsTask] 开始创建 TTS 任务');

  try {
    const unifiedUser = await getUserOrAnonymous();
    const userId = unifiedUser.user_id;
    const isAnonymous = unifiedUser.is_anonymous;

    console.log('🎤 [createTtsTask] 用户认证成功:', { userId, isAnonymous });

    // 1. 计算所需积分（根据语音的 role 确定计费类型）
    const requiredCredits = await calculateCreditsCost(request.text, request.voice_name);

    // 2. 检查积分是否足够
    const { hasEnough, current } = await checkCredits(userId, requiredCredits, isAnonymous);
    if (!hasEnough) {
      console.log(`⚠️ [createTtsTask] 积分不足: 需要 ${requiredCredits}, 当前 ${current}`);

      // 抛出业务错误，由 catch 块统一处理
      throw new InsufficientCreditsError(requiredCredits, current);
    }

    // 3. 生成任务 ID
    const taskId = uuidv4();

    // 4. 创建任务队列记录
    await db.insert(taskQueue).values({
      taskId,
      taskType: 'TTS',
      userId,
      status: 'PENDING',
      priority: 5,
      payload: {
        text: request.text,
        voice_name: request.voice_name,
        language: request.language || null,
        style: request.style || null,     // 语音风格
        speed: request.speed ?? 1.0,      // 0.5 - 2.0，默认 1.0 倍速
        pitch: request.pitch ?? 50,       // 1 - 100，默认 50（中间值）
        volume: request.volume ?? 50,     // 1 - 100，默认 50（中间值）
        credits_cost: requiredCredits,
        is_anonymous: isAnonymous,
      },
      retryCount: 0,
      maxRetries: 3,
      timeoutSeconds: 300,
    });

    // 5. 创建 TTS 记录（同时生成分享短码）
    const characterCount = request.text.length;
    const shareId = generateShareId();
    await db.insert(ttsRecords).values({
      userId,
      taskId,
      text: request.text,
      voiceName: request.voice_name,
      language: request.language || null,
      style: request.style || null,     // 语音风格
      speed: request.speed ?? 1.0,      // 0.5 - 2.0，默认 1.0 倍速
      pitch: request.pitch ?? 50,       // 1 - 100，默认 50（中间值）
      volume: request.volume ?? 50,     // 1 - 100，默认 50（中间值）
      creditsCost: requiredCredits,
      characterCount,
      status: 'PENDING',
      progress: 0,
      format: 'mp3',
      shareId,
      storyId: request.story_id || null, // 关联故事（可选）
      platform: request.platform || null, // 来源平台
    });

    console.log(`TTS 任务已创建: ${taskId}, 用户: ${userId}, 积分: ${requiredCredits}`);

    // 6. 触发后台处理任务
    await ttsQueue.enqueue({
      taskId,
      userId,
      text: request.text,
      voiceName: request.voice_name,
      language: request.language,
      style: request.style,
      speed: request.speed ?? 1.0,
      pitch: request.pitch ?? 50,
      volume: request.volume ?? 50,
      creditsCost: requiredCredits,
      isAnonymous,
    });

    console.log(`📤 队列任务已添加: ${taskId}`);

    return {
      task_id: taskId,
      status: 'PENDING',
      progress: 0,
      result: null,
      error: null,
    };
  } catch (error) {
    console.error('❌ [createTtsTask] 创建任务失败:', error);
    console.error('❌ [createTtsTask] 错误类型:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('❌ [createTtsTask] 错误消息:', error instanceof Error ? error.message : String(error));
    console.error('❌ [createTtsTask] 错误堆栈:', error instanceof Error ? error.stack : 'No stack trace');

    // 统一错误处理：将错误转换为标准响应格式
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
 * 查询 TTS 任务状态
 */
export async function getTtsTaskStatus(taskId: string): Promise<TtsTaskStatus> {
  const [record] = await db.select().from(ttsRecords).where(eq(ttsRecords.taskId, taskId)).limit(1);

  if (!record) {
    throw new Error(`Task not found: ${taskId}`);
  }

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
          audio_url: record.audioUrl || '',
          duration: record.duration || 0,
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
 * 获取用户 TTS 历史记录
 */
export async function getTtsRecords(limit: number = 50): Promise<TtsRecord[]> {
  const unifiedUser = await getUserOrAnonymous();
  const userId = unifiedUser.user_id;

  const records = await db.select().from(ttsRecords)
    .where(eq(ttsRecords.userId, userId))
    .orderBy(desc(ttsRecords.createdAt))
    .limit(limit);

  // 获取所有不重复的 voice_name
  const voiceNames = [...new Set(records.map(r => r.voiceName))];

  // 批量查询语音信息
  const voiceRows = voiceNames.length > 0
    ? await db.select({
        id: voices.id,
        name: voices.name,
        displayName: voices.displayName,
        provider: voices.provider,
        locale: voices.locale,
        country: voices.country,
        gender: voices.gender,
        avatarUrl: voices.avatarUrl,
      }).from(voices).where(inArray(voices.name, voiceNames))
    : [];

  // 创建 voice_name -> voice 的映射
  const voiceMap = new Map(voiceRows.map(v => [v.name, v]));

  return records.map((r) => {
    const voice = voiceMap.get(r.voiceName);
    return {
      id: r.id,
      user_id: r.userId,
      task_id: r.taskId,
      text: r.text,
      voice_name: r.voiceName,
      language: r.language,
      style: r.style,
      speed: r.speed,
      pitch: r.pitch,
      volume: r.volume,
      credits_cost: r.creditsCost,
      character_count: r.characterCount,
      status: r.status,
      progress: r.progress,
      audio_url: r.audioUrl,
      duration: r.duration,
      format: r.format,
      error_message: r.errorMessage,
      created_at: new Date(r.createdAt),
      completed_at: r.completedAt ? new Date(r.completedAt) : null,
      share_id: r.shareId,
      story_id: r.storyId,
      voice: voice ? {
        id: voice.id,
        name: voice.name,
        display_name: voice.displayName,
        provider: voice.provider,
        locale: voice.locale,
        country: voice.country,
        gender: voice.gender,
        avatar_url: voice.avatarUrl,
      } : null,
    };
  });
}

/**
 * 高级查询 TTS 记录（支持分页和过滤）
 */
export async function queryTtsRecords(params: {
  status?: string;
  start_date?: Date;
  end_date?: Date;
  page?: number;
  page_size?: number;
}): Promise<TtsRecordsQueryResponse> {
  const unifiedUser = await getUserOrAnonymous();
  const userId = unifiedUser.user_id;

  const {
    status,
    start_date,
    end_date,
    page = 1,
    page_size = 20,
  } = params;

  // 构建查询条件
  const conditions = [eq(ttsRecords.userId, userId)];

  if (status) {
    if (status.includes(',')) {
      conditions.push(inArray(ttsRecords.status, status.split(',')));
    } else {
      conditions.push(eq(ttsRecords.status, status));
    }
  }

  if (start_date) {
    conditions.push(gte(ttsRecords.createdAt, start_date.toISOString()));
  }
  if (end_date) {
    conditions.push(lte(ttsRecords.createdAt, end_date.toISOString()));
  }

  const whereClause = and(...conditions);

  // 查询总数
  const [{ total }] = await db.select({ total: count() }).from(ttsRecords).where(whereClause);

  // 查询记录
  const offset = (page - 1) * page_size;
  const records = await db.select().from(ttsRecords)
    .where(whereClause)
    .orderBy(desc(ttsRecords.createdAt))
    .offset(offset)
    .limit(page_size);

  // 关联语音信息
  const voiceNames = [...new Set(records.map((r) => r.voiceName))];
  const voiceRows = voiceNames.length > 0
    ? await db.select().from(voices).where(inArray(voices.name, voiceNames))
    : [];
  const voiceMap = new Map(voiceRows.map((v) => [v.name, v]));

  const recordsWithVoice = records.map((r) => {
    const voice = voiceMap.get(r.voiceName);
    return {
      id: r.id,
      user_id: r.userId,
      task_id: r.taskId,
      text: r.text,
      voice_name: r.voiceName,
      language: r.language,
      style: r.style,
      speed: r.speed,
      pitch: r.pitch,
      volume: r.volume,
      credits_cost: r.creditsCost,
      character_count: r.characterCount,
      status: r.status,
      progress: r.progress,
      audio_url: r.audioUrl,
      duration: r.duration,
      format: r.format,
      error_message: r.errorMessage,
      created_at: new Date(r.createdAt),
      completed_at: r.completedAt ? new Date(r.completedAt) : null,
      share_id: r.shareId,
      story_id: r.storyId,
      voice: voice ? {
        id: voice.id,
        name: voice.name,
        display_name: voice.displayName,
        provider: voice.provider,
        locale: voice.locale,
        country: voice.country,
        gender: voice.gender,
        avatar_url: voice.avatarUrl,
      } : null,
    };
  });

  const total_pages = Math.ceil(total / page_size);

  return {
    records: recordsWithVoice,
    total,
    page,
    page_size,
    total_pages,
  };
}

/**
 * 根据记录 ID 获取单条 TTS 记录
 */
export async function getTtsRecordById(recordId: number): Promise<TtsRecord> {
  const unifiedUser = await getUserOrAnonymous();
  const userId = unifiedUser.user_id;

  const [record] = await db.select().from(ttsRecords).where(eq(ttsRecords.id, recordId)).limit(1);

  if (!record) {
    throw new Error(`Record not found: ${recordId}`);
  }

  // 验证记录是否属于当前用户
  if (record.userId !== userId) {
    throw new Error('Not authorized to access this record');
  }

  // 关联查询语音信息
  const [voice] = await db.select().from(voices).where(eq(voices.name, record.voiceName)).limit(1);

  return {
    id: record.id,
    user_id: record.userId,
    task_id: record.taskId,
    text: record.text,
    voice_name: record.voiceName,
    language: record.language,
    style: record.style,
    speed: record.speed,
    pitch: record.pitch,
    volume: record.volume,
    credits_cost: record.creditsCost,
    character_count: record.characterCount,
    status: record.status,
    progress: record.progress,
    audio_url: record.audioUrl,
    duration: record.duration,
    format: record.format,
    error_message: record.errorMessage,
    created_at: new Date(record.createdAt),
    completed_at: record.completedAt ? new Date(record.completedAt) : null,
    share_id: record.shareId,
    story_id: record.storyId,
    voice: voice ? {
      id: voice.id,
      name: voice.name,
      display_name: voice.displayName,
      provider: voice.provider,
      locale: voice.locale,
      country: voice.country,
      gender: voice.gender,
      avatar_url: voice.avatarUrl,
    } : null,
  };
}

/**
 * 删除单个 TTS 记录
 */
export async function deleteTtsRecord(recordId: string): Promise<void> {
  const unifiedUser = await getUserOrAnonymous();
  const userId = unifiedUser.user_id;

  // 将 string ID 转换为 number（数据库使用 number ID）
  const numericId = parseInt(recordId, 10);
  if (isNaN(numericId)) {
    throw new Error(`Invalid record ID: ${recordId}`);
  }

  const [record] = await db.select().from(ttsRecords).where(eq(ttsRecords.id, numericId)).limit(1);

  if (!record) {
    throw new Error(`Record not found: ${recordId}`);
  }

  // 验证记录是否属于当前用户
  if (record.userId !== userId) {
    throw new Error('Not authorized to delete this record');
  }

  // 删除记录
  await db.delete(ttsRecords).where(eq(ttsRecords.id, numericId));

  console.log(`TTS 记录已删除: ${recordId}`);
}

/**
 * 批量删除 TTS 记录
 */
export async function batchDeleteTtsRecords(recordIds: string[]): Promise<{ deleted: number; failed: number }> {
  const unifiedUser = await getUserOrAnonymous();
  const userId = unifiedUser.user_id;

  let deleted = 0;
  let failed = 0;

  for (const recordId of recordIds) {
    try {
      const numericId = parseInt(recordId, 10);
      if (isNaN(numericId)) {
        failed++;
        continue;
      }

      const [record] = await db.select().from(ttsRecords).where(eq(ttsRecords.id, numericId)).limit(1);

      if (!record || record.userId !== userId) {
        failed++;
        continue;
      }

      await db.delete(ttsRecords).where(eq(ttsRecords.id, numericId));
      deleted++;
    } catch {
      failed++;
    }
  }

  console.log(`批量删除完成: 成功 ${deleted}, 失败 ${failed}`);
  return { deleted, failed };
}

/**
 * 根据 task_id 获取 TTS 记录
 */
export async function getTtsRecordByTaskId(taskId: string): Promise<TtsRecord> {
  const unifiedUser = await getUserOrAnonymous();
  const userId = unifiedUser.user_id;

  const [record] = await db.select().from(ttsRecords).where(eq(ttsRecords.taskId, taskId)).limit(1);

  if (!record) {
    throw new Error(`Record not found: ${taskId}`);
  }

  // 验证记录是否属于当前用户
  if (record.userId !== userId) {
    throw new Error('Not authorized to access this record');
  }

  // 获取语音信息
  const [voice] = await db.select().from(voices).where(eq(voices.name, record.voiceName)).limit(1);

  return {
    id: record.id,
    user_id: record.userId,
    task_id: record.taskId,
    text: record.text,
    voice_name: record.voiceName,
    language: record.language,
    style: record.style,
    speed: record.speed,
    pitch: record.pitch,
    volume: record.volume,
    credits_cost: record.creditsCost,
    character_count: record.characterCount,
    status: record.status,
    progress: record.progress,
    audio_url: record.audioUrl,
    duration: record.duration,
    format: record.format,
    error_message: record.errorMessage,
    created_at: new Date(record.createdAt),
    completed_at: record.completedAt ? new Date(record.completedAt) : null,
    share_id: record.shareId,
    story_id: record.storyId,
    voice: voice ? {
      id: voice.id,
      name: voice.name,
      display_name: voice.displayName,
      provider: voice.provider,
      locale: voice.locale,
      country: voice.country,
      gender: voice.gender,
      avatar_url: voice.avatarUrl,
    } : null,
  };
}

/**
 * 检查并处理超时的 TTS 任务
 *
 * 工作流程：
 * 1. 前端轮询超时后调用此函数
 * 2. 后端检查任务真实状态
 * 3. 如果任务卡住/异常，标记为失败并返还积分
 * 4. 如果任务正常，延长等待时间并返回最新状态
 */
export async function checkAndHandleStuckTask(
  recordId: number
): Promise<{
  handled: boolean;
  newStatus: 'FAILURE' | 'PROCESSING' | 'SUCCESS' | 'PENDING';
  message: string;
  record: TtsRecord;
}> {
  const unifiedUser = await getUserOrAnonymous();
  const userId = unifiedUser.user_id;

  // 1. 获取记录
  const [record] = await db.select().from(ttsRecords).where(eq(ttsRecords.id, recordId)).limit(1);

  if (!record) {
    throw new Error(`Record not found: ${recordId}`);
  }

  // 验证权限
  if (record.userId !== userId) {
    throw new Error('Not authorized to access this record');
  }

  // 2. 如果任务已经完成，直接返回
  if (record.status === 'SUCCESS' || record.status === 'FAILURE') {
    return {
      handled: false,
      newStatus: record.status as 'SUCCESS' | 'FAILURE',
      message: '任务已完成',
      record: {
        id: record.id,
        user_id: record.userId,
        task_id: record.taskId,
        text: record.text,
        voice_name: record.voiceName,
        language: record.language,
        style: record.style,
        speed: record.speed,
        pitch: record.pitch,
        volume: record.volume,
        credits_cost: record.creditsCost,
        character_count: record.characterCount,
        status: record.status,
        progress: record.progress,
        audio_url: record.audioUrl,
        duration: record.duration,
        format: record.format,
        error_message: record.errorMessage,
        created_at: new Date(record.createdAt),
        completed_at: record.completedAt ? new Date(record.completedAt) : null,
        share_id: record.shareId,
        story_id: record.storyId,
      },
    };
  }

  // 3. 检查任务创建时间，判断是否超时
  const now = new Date();
  const createdAt = new Date(record.createdAt);
  const elapsedMinutes = (now.getTime() - createdAt.getTime()) / 1000 / 60;

  // 超时阈值：5分钟
  const TIMEOUT_THRESHOLD_MINUTES = 5;

  if (elapsedMinutes > TIMEOUT_THRESHOLD_MINUTES) {
    console.error(`❌ [checkStuckTask] 任务 ${record.taskId} 已超时 ${elapsedMinutes.toFixed(1)} 分钟，标记为失败`);

    // 4. 标记为失败并返还积分（仅当积分已被扣减时）
    // 根据 Inngest worker 流程：progress >= 20 表示积分已扣减
    const creditsWereDeducted = (record.progress ?? 0) >= 20;

    // 更新任务状态
    const [updatedRecord] = await db.update(ttsRecords)
      .set({
        status: 'FAILURE',
        progress: 0,
        errorMessage: `任务超时（运行时间: ${elapsedMinutes.toFixed(1)} 分钟）`,
        completedAt: now.toISOString(),
      })
      .where(eq(ttsRecords.id, recordId))
      .returning();

    // 只有在积分已被扣减的情况下才返还
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

      console.log(`✅ [checkStuckTask] 已返还 ${record.creditsCost} 积分给用户 ${userId}`);
    } else {
      console.log(`ℹ️ [checkStuckTask] 积分未被扣减（progress: ${record.progress}），无需返还`);
    }

    return {
      handled: true,
      newStatus: 'FAILURE',
      message: creditsWereDeducted
        ? `任务超时已取消，已返还 ${record.creditsCost} 积分`
        : '任务超时已取消（积分未扣减）',
      record: {
        id: updatedRecord.id,
        user_id: updatedRecord.userId,
        task_id: updatedRecord.taskId,
        text: updatedRecord.text,
        voice_name: updatedRecord.voiceName,
        language: updatedRecord.language,
        style: updatedRecord.style,
        speed: updatedRecord.speed,
        pitch: updatedRecord.pitch,
        volume: updatedRecord.volume,
        credits_cost: updatedRecord.creditsCost,
        character_count: updatedRecord.characterCount,
        status: updatedRecord.status,
        progress: updatedRecord.progress,
        audio_url: updatedRecord.audioUrl,
        duration: updatedRecord.duration,
        format: updatedRecord.format,
        error_message: updatedRecord.errorMessage,
        created_at: new Date(updatedRecord.createdAt),
        completed_at: updatedRecord.completedAt ? new Date(updatedRecord.completedAt) : null,
        share_id: updatedRecord.shareId,
        story_id: updatedRecord.storyId,
      },
    };
  }

  // 5. 未超时，任务仍在处理中，延长等待
  console.log(`⏳ [checkStuckTask] 任务 ${record.taskId} 运行 ${elapsedMinutes.toFixed(1)} 分钟，继续等待`);

  return {
    handled: false,
    newStatus: record.status as 'PROCESSING' | 'PENDING',
    message: `任务仍在处理中（已运行 ${elapsedMinutes.toFixed(1)} 分钟）`,
    record: {
      id: record.id,
      user_id: record.userId,
      task_id: record.taskId,
      text: record.text,
      voice_name: record.voiceName,
      language: record.language,
      style: record.style,
      speed: record.speed,
      pitch: record.pitch,
      volume: record.volume,
      credits_cost: record.creditsCost,
      character_count: record.characterCount,
      status: record.status,
      progress: record.progress,
      audio_url: record.audioUrl,
      duration: record.duration,
      format: record.format,
      error_message: record.errorMessage,
      created_at: new Date(record.createdAt),
      completed_at: record.completedAt ? new Date(record.completedAt) : null,
      share_id: record.shareId,
      story_id: record.storyId,
    },
  };
}

/**
 * 更新故事段落的音频信息
 *
 * 在段落 TTS 生成成功后调用，将音频信息同步到 story_paragraphs 表
 */
export async function updateParagraphAudio(params: {
  paragraphId: string;
  audioUrl: string;
  audioDuration: number;
  voiceName: string;
}): Promise<{ success: boolean; error?: string }> {
  console.log('🎤 [updateParagraphAudio] 更新段落音频:', params.paragraphId);

  try {
    const unifiedUser = await getUserOrAnonymous();
    const userId = unifiedUser.user_id;

    // 验证段落归属 - 查询段落并通过 storyId 关联查询 story 的 user_id
    const [paragraph] = await db.select().from(storyParagraphs).where(eq(storyParagraphs.id, params.paragraphId)).limit(1);

    if (!paragraph) {
      return { success: false, error: 'Paragraph not found' };
    }

    // 通过 storyId 查询 story 的 user_id
    const [story] = await db.select({ userId: stories.userId }).from(stories).where(eq(stories.id, paragraph.storyId)).limit(1);

    if (!story || story.userId !== userId) {
      return { success: false, error: 'Paragraph not found' };
    }

    // 更新段落音频信息
    await db.update(storyParagraphs)
      .set({
        audioUrl: params.audioUrl,
        audioDuration: params.audioDuration,
        audioVoice: params.voiceName,
        audioStatus: 'completed',
      })
      .where(eq(storyParagraphs.id, params.paragraphId));

    console.log('✅ [updateParagraphAudio] 段落音频已更新:', params.paragraphId);

    return { success: true };
  } catch (error) {
    console.error('❌ [updateParagraphAudio] 更新失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update paragraph audio',
    };
  }
}

/**
 * 根据分享 ID 获取公开的 TTS 记录
 *
 * 这是一个公开 API，不需要用户认证
 * 只返回必要的公开信息，不包含用户 ID 等敏感数据
 */
export async function getSharedTtsRecord(shareId: string): Promise<SharedTtsRecord | null> {
  // 根据 share_id 查询记录
  const [record] = await db.select().from(ttsRecords).where(eq(ttsRecords.shareId, shareId)).limit(1);

  // 记录不存在或状态不是成功
  if (!record || record.status !== 'SUCCESS' || !record.audioUrl) {
    return null;
  }

  // 查询语音信息
  const [voice] = await db.select().from(voices).where(eq(voices.name, record.voiceName)).limit(1);

  return {
    share_id: shareId,
    text: record.text,
    audio_url: record.audioUrl,
    duration: record.duration || 0,
    character_count: record.characterCount,
    created_at: new Date(record.createdAt),
    voice: voice ? {
      name: voice.name,
      display_name: voice.displayName,
      avatar_url: voice.avatarUrl,
    } : null,
  };
}
