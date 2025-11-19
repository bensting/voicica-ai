'use server';

/**
 * TTS 模块 Server Actions
 */
import { getDb, users, anonymousUsers, taskQueue, ttsRecords, voices } from '@/lib/db';
import { getUserOrAnonymous } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { inngest } from '@/lib/inngest/client';
import { eq, desc, and, gte, lte, inArray, count } from 'drizzle-orm';

// 类型定义
export interface TtsRequest {
  text: string;
  voice_name: string;
  language?: string;
  speed?: number;
  pitch?: number;
  volume?: number;
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
}

export interface TtsRecordVoice {
  id: number;
  name: string;
  display_name: string | null;
  provider: string;
  locale: string;
  country: string;
  avatar_url: string;
}

export interface TtsRecord {
  id: number;
  user_id: string;
  task_id: string;
  text: string;
  voice_name: string;
  language: string | null;
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
  voice?: TtsRecordVoice | null;
}

export interface TtsRecordsQueryResponse {
  records: TtsRecord[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// 积分计算（简化版，实际可能需要更复杂的逻辑）
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function calculateCreditsCost(text: string, _voiceName: string): Promise<number> {
  // 基础：每个字符 1 积分
  const baseCost = text.length;

  // TODO: 根据语音类型调整价格
  // 例如：Premium 语音可能需要更多积分

  return baseCost;
}

// 检查用户积分
async function checkCredits(
  userId: string,
  required: number,
  isAnonymous: boolean
): Promise<boolean> {
  const db = await getDb();

  if (isAnonymous) {
    const user = await db.query.anonymousUsers.findFirst({
      where: eq(anonymousUsers.userId, userId),
      columns: { credits: true },
    });
    return (user?.credits ?? 0) >= required;
  } else {
    const user = await db.query.users.findFirst({
      where: eq(users.userId, userId),
      columns: { credits: true },
    });
    return (user?.credits ?? 0) >= required;
  }
}

/**
 * 创建 TTS 任务（异步）
 *
 * 返回任务 ID，实际处理由后台 Worker 完成
 */
export async function createTtsTask(request: TtsRequest): Promise<TtsTaskStatus> {
  const db = await getDb();
  const unifiedUser = await getUserOrAnonymous();
  const userId = unifiedUser.user_id;
  const isAnonymous = unifiedUser.is_anonymous;

  // 1. 计算所需积分
  const requiredCredits = await calculateCreditsCost(request.text, request.voice_name);

  // 2. 检查积分是否足够
  const hasEnoughCredits = await checkCredits(userId, requiredCredits, isAnonymous);
  if (!hasEnoughCredits) {
    throw new Error(`积分不足，需要 ${requiredCredits} 积分`);
  }

  // 3. 生成任务 ID
  const taskId = uuidv4();

  // 4. 创建任务队列记录
  await db.insert(taskQueue).values({
    taskId: taskId,
    taskType: 'TTS',
    userId: userId,
    status: 'PENDING',
    priority: 5,
    payload: {
      text: request.text,
      voice_name: request.voice_name,
      language: request.language || null,
      speed: request.speed || 1.0,
      pitch: request.pitch || 1,
      volume: request.volume || 1,
      credits_cost: requiredCredits,
      is_anonymous: isAnonymous,
    },
    retryCount: 0,
    maxRetries: 3,
    timeoutSeconds: 300,
  });

  // 5. 创建 TTS 记录
  const characterCount = request.text.length;
  await db.insert(ttsRecords).values({
    userId: userId,
    taskId: taskId,
    text: request.text,
    voiceName: request.voice_name,
    language: request.language || null,
    speed: request.speed || 1.0,
    pitch: request.pitch || 1,
    volume: request.volume || 1,
    creditsCost: requiredCredits,
    characterCount: characterCount,
    status: 'PENDING',
    progress: 0,
    format: 'mp3',
  });

  console.log(`TTS 任务已创建: ${taskId}, 用户: ${userId}, 积分: ${requiredCredits}`);

  // 6. 触发 Inngest 处理任务
  await inngest.send({
    name: 'tts/task.created',
    data: {
      taskId,
      userId,
      text: request.text,
      voiceName: request.voice_name,
      language: request.language || undefined,
      speed: request.speed || 1.0,
      pitch: request.pitch || 1,
      volume: request.volume || 1,
      creditsCost: requiredCredits,
      isAnonymous,
    },
  });

  console.log(`📤 Inngest 事件已发送: ${taskId}`);

  return {
    task_id: taskId,
    status: 'PENDING',
    progress: 0,
    result: null,
    error: null,
  };
}

/**
 * 查询 TTS 任务状态
 */
export async function getTtsTaskStatus(taskId: string): Promise<TtsTaskStatus> {
  const db = await getDb();
  const record = await db.query.ttsRecords.findFirst({
    where: eq(ttsRecords.taskId, taskId),
  });

  if (!record) {
    throw new Error(`任务不存在: ${taskId}`);
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
      throw new Error(`未知任务状态: ${record.status}`);
  }
}

/**
 * 获取用户 TTS 历史记录
 */
export async function getTtsRecords(limit: number = 50): Promise<TtsRecord[]> {
  const db = await getDb();
  const unifiedUser = await getUserOrAnonymous();
  const userId = unifiedUser.user_id;

  const records = await db.query.ttsRecords.findMany({
    where: eq(ttsRecords.userId, userId),
    orderBy: [desc(ttsRecords.createdAt)],
    limit: limit,
  });

  return records.map((r) => ({
    id: r.id,
    user_id: r.userId,
    task_id: r.taskId,
    text: r.text,
    voice_name: r.voiceName,
    language: r.language,
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
    created_at: r.createdAt,
    completed_at: r.completedAt,
  }));
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
  const db = await getDb();
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
    conditions.push(gte(ttsRecords.createdAt, start_date));
  }

  if (end_date) {
    conditions.push(lte(ttsRecords.createdAt, end_date));
  }

  const whereClause = and(...conditions);

  // 查询总数
  const totalResult = await db.select({ count: count() })
    .from(ttsRecords)
    .where(whereClause);
  const total = totalResult[0]?.count ?? 0;

  // 查询记录
  const offset = (page - 1) * page_size;
  const records = await db.query.ttsRecords.findMany({
    where: whereClause,
    orderBy: [desc(ttsRecords.createdAt)],
    offset: offset,
    limit: page_size,
  });

  // 关联语音信息
  const voiceNames = [...new Set(records.map((r) => r.voiceName))];
  const voiceList = voiceNames.length > 0
    ? await db.query.voices.findMany({
        where: inArray(voices.name, voiceNames),
      })
    : [];
  const voiceMap = new Map(voiceList.map((v) => [v.name, v]));

  const recordsWithVoice = records.map((r) => {
    const voice = voiceMap.get(r.voiceName);
    return {
      id: r.id,
      user_id: r.userId,
      task_id: r.taskId,
      text: r.text,
      voice_name: r.voiceName,
      language: r.language,
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
      created_at: r.createdAt,
      completed_at: r.completedAt,
      voice: voice ? {
        id: voice.id,
        name: voice.name,
        display_name: voice.displayName,
        provider: voice.provider,
        locale: voice.locale,
        country: voice.country,
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
  const db = await getDb();
  const unifiedUser = await getUserOrAnonymous();
  const userId = unifiedUser.user_id;

  const record = await db.query.ttsRecords.findFirst({
    where: eq(ttsRecords.id, recordId),
  });

  if (!record) {
    throw new Error(`记录不存在: ${recordId}`);
  }

  // 验证记录是否属于当前用户
  if (record.userId !== userId) {
    throw new Error('无权访问此记录');
  }

  return {
    id: record.id,
    user_id: record.userId,
    task_id: record.taskId,
    text: record.text,
    voice_name: record.voiceName,
    language: record.language,
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
    created_at: record.createdAt,
    completed_at: record.completedAt,
  };
}

/**
 * 删除单个 TTS 记录
 */
export async function deleteTtsRecord(recordId: string): Promise<void> {
  const db = await getDb();
  const unifiedUser = await getUserOrAnonymous();
  const userId = unifiedUser.user_id;

  // 将 string ID 转换为 number（数据库使用 number ID）
  const numericId = parseInt(recordId, 10);
  if (isNaN(numericId)) {
    throw new Error(`无效的记录 ID: ${recordId}`);
  }

  const record = await db.query.ttsRecords.findFirst({
    where: eq(ttsRecords.id, numericId),
  });

  if (!record) {
    throw new Error(`记录不存在: ${recordId}`);
  }

  // 验证记录是否属于当前用户
  if (record.userId !== userId) {
    throw new Error('无权删除此记录');
  }

  // 删除记录
  await db.delete(ttsRecords).where(eq(ttsRecords.id, numericId));

  console.log(`TTS 记录已删除: ${recordId}`);
}

/**
 * 批量删除 TTS 记录
 */
export async function batchDeleteTtsRecords(recordIds: string[]): Promise<{ deleted: number; failed: number }> {
  const db = await getDb();
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

      const record = await db.query.ttsRecords.findFirst({
        where: eq(ttsRecords.id, numericId),
      });

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
  const db = await getDb();
  const unifiedUser = await getUserOrAnonymous();
  const userId = unifiedUser.user_id;

  const record = await db.query.ttsRecords.findFirst({
    where: eq(ttsRecords.taskId, taskId),
  });

  if (!record) {
    throw new Error(`记录不存在: ${taskId}`);
  }

  // 验证记录是否属于当前用户
  if (record.userId !== userId) {
    throw new Error('无权访问此记录');
  }

  return {
    id: record.id,
    user_id: record.userId,
    task_id: record.taskId,
    text: record.text,
    voice_name: record.voiceName,
    language: record.language,
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
    created_at: record.createdAt,
    completed_at: record.completedAt,
  };
}