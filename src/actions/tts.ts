'use server';

/**
 * TTS 模块 Server Actions
 */
import prisma from '@/lib/prisma';
import { getUserOrAnonymous } from '@/lib/auth-firebase';
import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid';
import { inngest } from '@/lib/inngest/client';
import { InsufficientCreditsError, errorToResponse } from '@/lib/errors';
import { calculateVoiceCost} from '@/config/appConfig';

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
 * 计算 TTS 积分消耗
 *
 * 计费规则：每 100 个字符消耗对应积分，不足 100 也按一个单位计算
 * 例如：100 字符消耗 1 积分，101 字符消耗 2 积分
 *
 * @param text 待转换文本
 * @param _voiceName 语音名称（预留，用于未来支持不同语音类型）
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function calculateCreditsCost(text: string, _voiceName: string): number {
  // 目前 TTS 统一使用 standard 类型计费
  // TODO: 未来可根据 voiceName 查询语音类型（standard/professional/special/clone）
  return calculateVoiceCost(text.length, 'standard');
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
  console.log('🎤 [createTtsTask] 开始创建 TTS 任务');

  try {
    const unifiedUser = await getUserOrAnonymous();
    const userId = unifiedUser.user_id;
    const isAnonymous = unifiedUser.is_anonymous;

    console.log('🎤 [createTtsTask] 用户认证成功:', { userId, isAnonymous });

    // 1. 计算所需积分
    const requiredCredits = await calculateCreditsCost(request.text, request.voice_name);

    // 2. 检查积分是否足够
    const hasEnoughCredits = await checkCredits(userId, requiredCredits, isAnonymous);
    if (!hasEnoughCredits) {
      const currentCredits = isAnonymous
        ? (await prisma.anonymous_users.findUnique({ where: { user_id: userId }, select: { credits: true } }))?.credits ?? 0
        : (await prisma.users.findUnique({ where: { user_id: userId }, select: { credits: true } }))?.credits ?? 0;

      console.log(`⚠️ [createTtsTask] 积分不足: 需要 ${requiredCredits}, 当前 ${currentCredits}`);

      // 抛出业务错误，由 catch 块统一处理
      throw new InsufficientCreditsError(requiredCredits, currentCredits);
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
          style: request.style || null,     // 语音风格
          speed: request.speed ?? 1.0,      // 0.5 - 2.0，默认 1.0 倍速
          pitch: request.pitch ?? 50,       // 1 - 100，默认 50（中间值）
          volume: request.volume ?? 50,     // 1 - 100，默认 50（中间值）
          credits_cost: requiredCredits,
          is_anonymous: isAnonymous,
        },
        retry_count: 0,
        max_retries: 3,
        timeout_seconds: 300,
      },
    });

    // 5. 创建 TTS 记录（同时生成分享短码）
    const characterCount = request.text.length;
    const shareId = generateShareId();
    await prisma.tts_records.create({
      data: {
        user_id: userId,
        task_id: taskId,
        text: request.text,
        voice_name: request.voice_name,
        language: request.language || null,
        style: request.style || null,     // 语音风格
        speed: request.speed ?? 1.0,      // 0.5 - 2.0，默认 1.0 倍速
        pitch: request.pitch ?? 50,       // 1 - 100，默认 50（中间值）
        volume: request.volume ?? 50,     // 1 - 100，默认 50（中间值）
        credits_cost: requiredCredits,
        character_count: characterCount,
        status: 'PENDING',
        progress: 0,
        format: 'mp3',
        share_id: shareId,
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
        style: request.style || undefined, // 语音风格
        speed: request.speed ?? 1.0,      // 0.5 - 2.0，默认 1.0 倍速
        pitch: request.pitch ?? 50,       // 1 - 100，默认 50（中间值）
        volume: request.volume ?? 50,     // 1 - 100，默认 50（中间值）
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
    style: r.style,
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
    share_id: r.share_id,
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
    // 支持逗号分隔的多状态查询
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
      style: r.style,
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
      share_id: r.share_id,
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

  // 关联查询语音信息
  const voice = await prisma.voices.findFirst({
    where: { name: record.voice_name },
  });

  return {
    id: record.id,
    user_id: record.user_id,
    task_id: record.task_id,
    text: record.text,
    voice_name: record.voice_name,
    language: record.language,
    style: record.style,
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
    share_id: record.share_id,
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
    throw new Error(`无效的记录 ID: ${recordId}`);
  }

  const record = await prisma.tts_records.findUnique({
    where: { id: numericId },
  });

  if (!record) {
    throw new Error(`记录不存在: ${recordId}`);
  }

  // 验证记录是否属于当前用户
  if (record.user_id !== userId) {
    throw new Error('无权删除此记录');
  }

  // 删除记录
  await prisma.tts_records.delete({
    where: { id: numericId },
  });

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

      const record = await prisma.tts_records.findUnique({
        where: { id: numericId },
      });

      if (!record || record.user_id !== userId) {
        failed++;
        continue;
      }

      await prisma.tts_records.delete({
        where: { id: numericId },
      });
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

  const record = await prisma.tts_records.findUnique({
    where: { task_id: taskId },
  });

  if (!record) {
    throw new Error(`记录不存在: ${taskId}`);
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
    style: record.style,
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
    share_id: record.share_id,
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
  const record = await prisma.tts_records.findUnique({
    where: { id: recordId },
  });

  if (!record) {
    throw new Error(`记录不存在: ${recordId}`);
  }

  // 验证权限
  if (record.user_id !== userId) {
    throw new Error('无权访问此记录');
  }

  // 2. 如果任务已经完成，直接返回
  if (record.status === 'SUCCESS' || record.status === 'FAILURE') {
    return {
      handled: false,
      newStatus: record.status as 'SUCCESS' | 'FAILURE',
      message: '任务已完成',
      record: {
        id: record.id,
        user_id: record.user_id,
        task_id: record.task_id,
        text: record.text,
        voice_name: record.voice_name,
        language: record.language,
        style: record.style,
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
        share_id: record.share_id,
      },
    };
  }

  // 3. 检查任务创建时间，判断是否超时
  const now = new Date();
  const createdAt = new Date(record.created_at);
  const elapsedMinutes = (now.getTime() - createdAt.getTime()) / 1000 / 60;

  // 超时阈值：5分钟
  const TIMEOUT_THRESHOLD_MINUTES = 5;

  if (elapsedMinutes > TIMEOUT_THRESHOLD_MINUTES) {
    console.error(`❌ [checkStuckTask] 任务 ${record.task_id} 已超时 ${elapsedMinutes.toFixed(1)} 分钟，标记为失败`);

    // 4. 标记为失败并返还积分（仅当积分已被扣减时）
    // 根据 Inngest worker 流程：progress >= 20 表示积分已扣减
    const creditsWereDeducted = (record.progress ?? 0) >= 20;

    const updatedRecord = await prisma.$transaction(async (tx) => {
      // 更新任务状态
      const updated = await tx.tts_records.update({
        where: { id: recordId },
        data: {
          status: 'FAILURE',
          progress: 0,
          error_message: `任务超时（运行时间: ${elapsedMinutes.toFixed(1)} 分钟）`,
          completed_at: now,
        },
      });

      // 只有在积分已被扣减的情况下才返还
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

        console.log(`✅ [checkStuckTask] 已返还 ${record.credits_cost} 积分给用户 ${userId}`);
      } else {
        console.log(`ℹ️ [checkStuckTask] 积分未被扣减（progress: ${record.progress}），无需返还`);
      }

      return updated;
    });

    return {
      handled: true,
      newStatus: 'FAILURE',
      message: creditsWereDeducted
        ? `任务超时已取消，已返还 ${record.credits_cost} 积分`
        : '任务超时已取消（积分未扣减）',
      record: {
        id: updatedRecord.id,
        user_id: updatedRecord.user_id,
        task_id: updatedRecord.task_id,
        text: updatedRecord.text,
        voice_name: updatedRecord.voice_name,
        language: updatedRecord.language,
        style: updatedRecord.style,
        speed: updatedRecord.speed,
        pitch: updatedRecord.pitch,
        volume: updatedRecord.volume,
        credits_cost: updatedRecord.credits_cost,
        character_count: updatedRecord.character_count,
        status: updatedRecord.status,
        progress: updatedRecord.progress,
        audio_url: updatedRecord.audio_url,
        duration: updatedRecord.duration,
        format: updatedRecord.format,
        error_message: updatedRecord.error_message,
        created_at: updatedRecord.created_at,
        completed_at: updatedRecord.completed_at,
        share_id: updatedRecord.share_id,
      },
    };
  }

  // 5. 未超时，任务仍在处理中，延长等待
  console.log(`⏳ [checkStuckTask] 任务 ${record.task_id} 运行 ${elapsedMinutes.toFixed(1)} 分钟，继续等待`);

  return {
    handled: false,
    newStatus: record.status as 'PROCESSING' | 'PENDING',
    message: `任务仍在处理中（已运行 ${elapsedMinutes.toFixed(1)} 分钟）`,
    record: {
      id: record.id,
      user_id: record.user_id,
      task_id: record.task_id,
      text: record.text,
      voice_name: record.voice_name,
      language: record.language,
      style: record.style,
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
      share_id: record.share_id,
    },
  };
}

/**
 * 根据分享 ID 获取公开的 TTS 记录
 *
 * 这是一个公开 API，不需要用户认证
 * 只返回必要的公开信息，不包含用户 ID 等敏感数据
 */
export async function getSharedTtsRecord(shareId: string): Promise<SharedTtsRecord | null> {
  // 根据 share_id 查询记录
  const record = await prisma.tts_records.findUnique({
    where: { share_id: shareId },
  });

  // 记录不存在或状态不是成功
  if (!record || record.status !== 'SUCCESS' || !record.audio_url) {
    return null;
  }

  // 查询语音信息
  const voice = await prisma.voices.findFirst({
    where: { name: record.voice_name },
  });

  return {
    share_id: shareId,
    text: record.text,
    audio_url: record.audio_url,
    duration: record.duration || 0,
    character_count: record.character_count,
    created_at: record.created_at,
    voice: voice ? {
      name: voice.name,
      display_name: voice.display_name,
      avatar_url: voice.avatar_url,
    } : null,
  };
}
