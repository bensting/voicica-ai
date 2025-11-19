'use server';

/**
 * TTS 模块 Server Actions
 */
import prisma from '@/lib/prisma';
import { getUserOrAnonymous } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { inngest } from '@/lib/inngest/client';

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
  voice?: Record<string, unknown> | null;
}

export interface TtsRecordsQueryResponse {
  records: TtsRecord[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// 积分计算（简化版，实际可能需要更复杂的逻辑）
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
  if (isAnonymous) {
    const user = await prisma.anonymous_users.findUnique({
      where: { user_id: userId },
      select: { credits: true },
    });
    return (user?.credits ?? 0) >= required;
  } else {
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      select: { credits: true },
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
  await prisma.task_queue.create({
    data: {
      task_id: taskId,
      task_type: 'TTS',
      user_id: userId,
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
      retry_count: 0,
      max_retries: 3,
      timeout_seconds: 300,
    },
  });

  // 5. 创建 TTS 记录
  const characterCount = request.text.length;
  await prisma.tts_records.create({
    data: {
      user_id: userId,
      task_id: taskId,
      text: request.text,
      voice_name: request.voice_name,
      language: request.language || null,
      speed: request.speed || 1.0,
      pitch: request.pitch || 1,
      volume: request.volume || 1,
      credits_cost: requiredCredits,
      character_count: characterCount,
      status: 'PENDING',
      progress: 0,
      format: 'mp3',
    },
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
  const record = await prisma.tts_records.findUnique({
    where: { task_id: taskId },
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
          audio_url: record.audio_url || '',
          duration: record.duration || 0,
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
      throw new Error(`未知任务状态: ${record.status}`);
  }
}

/**
 * 获取用户 TTS 历史记录
 */
export async function getTtsRecords(limit: number = 50): Promise<TtsRecord[]> {
  const unifiedUser = await getUserOrAnonymous();
  const userId = unifiedUser.user_id;

  const records = await prisma.tts_records.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
    take: limit,
  });

  return records.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    task_id: r.task_id,
    text: r.text,
    voice_name: r.voice_name,
    language: r.language,
    speed: r.speed,
    pitch: r.pitch,
    volume: r.volume,
    credits_cost: r.credits_cost,
    character_count: r.character_count,
    status: r.status,
    progress: r.progress,
    audio_url: r.audio_url,
    duration: r.duration,
    format: r.format,
    error_message: r.error_message,
    created_at: r.created_at,
    completed_at: r.completed_at,
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
  const where: Record<string, unknown> = {
    user_id: userId,
  };

  if (status) {
    where.status = status;
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
  const total = await prisma.tts_records.count({ where });

  // 查询记录
  const offset = (page - 1) * page_size;
  const records = await prisma.tts_records.findMany({
    where,
    orderBy: { created_at: 'desc' },
    skip: offset,
    take: page_size,
  });

  // 关联语音信息
  const voiceNames = [...new Set(records.map((r) => r.voice_name))];
  const voices = await prisma.voices.findMany({
    where: { name: { in: voiceNames } },
  });
  const voiceMap = new Map(voices.map((v) => [v.name, v]));

  const recordsWithVoice = records.map((r) => {
    const voice = voiceMap.get(r.voice_name);
    return {
      id: r.id,
      user_id: r.user_id,
      task_id: r.task_id,
      text: r.text,
      voice_name: r.voice_name,
      language: r.language,
      speed: r.speed,
      pitch: r.pitch,
      volume: r.volume,
      credits_cost: r.credits_cost,
      character_count: r.character_count,
      status: r.status,
      progress: r.progress,
      audio_url: r.audio_url,
      duration: r.duration,
      format: r.format,
      error_message: r.error_message,
      created_at: r.created_at,
      completed_at: r.completed_at,
      voice: voice ? {
        id: voice.id,
        name: voice.name,
        display_name: voice.display_name,
        provider: voice.provider,
        locale: voice.locale,
        country: voice.country,
        avatar_url: voice.avatar_url,
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

  const record = await prisma.tts_records.findUnique({
    where: { id: recordId },
  });

  if (!record) {
    throw new Error(`记录不存在: ${recordId}`);
  }

  // 验证记录是否属于当前用户
  if (record.user_id !== userId) {
    throw new Error('无权访问此记录');
  }

  return {
    id: record.id,
    user_id: record.user_id,
    task_id: record.task_id,
    text: record.text,
    voice_name: record.voice_name,
    language: record.language,
    speed: record.speed,
    pitch: record.pitch,
    volume: record.volume,
    credits_cost: record.credits_cost,
    character_count: record.character_count,
    status: record.status,
    progress: record.progress,
    audio_url: record.audio_url,
    duration: record.duration,
    format: record.format,
    error_message: record.error_message,
    created_at: record.created_at,
    completed_at: record.completed_at,
  };
}
