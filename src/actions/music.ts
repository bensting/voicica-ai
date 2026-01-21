'use server';

/**
 * Music 模块 Server Actions
 * 使用 KIE API (Suno) 生成音乐
 */
import prisma from '@/lib/prisma';
import { getUserOrAnonymous } from '@/lib/auth-firebase';
import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid';
import { InsufficientCreditsError, errorToResponse } from '@/lib/errors';
import { checkCredits } from '@/lib/credits';
import { getMusicModelById, musicModelsConfig } from '@/config/native/musicModels';

// KIE API 配置
const KIE_API_BASE = 'https://api.kie.ai/api/v1';
const KIE_API_KEY = process.env.KIE_API_KEY || '';

// 模型映射：内部模型 ID -> KIE API 模型枚举
const MODEL_MAP: Record<string, string> = {
  'music-5.0': 'V5',
  'music-4.5-plus': 'V4_5PLUS',
  'music-4.5': 'V4_5',
};

/**
 * 生成分享短码
 */
function generateShareId(): string {
  return nanoid(8);
}

// 类型定义
export interface MusicGenerationRequest {
  /** 音乐描述提示词 */
  prompt: string;
  /** 模型 ID */
  model: string;
  /** 是否公开 */
  isPublic?: boolean;
  /** 音乐风格（自定义模式） */
  style?: string;
  /** 歌曲标题（自定义模式） */
  title?: string;
  /** 是否纯音乐 */
  instrumental?: boolean;
  /** 是否自定义模式（歌词模式） */
  customMode?: boolean;
}

export interface MusicTaskStatus {
  task_id: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILURE';
  progress: number;
  result?: {
    audio_url: string;
    audio_url_2?: string;
    cover_url?: string;
    cover_url_2?: string;
    duration?: number;
    duration_2?: number;
    title?: string;
    tags?: string;
    lyrics?: string;
  } | null;
  error?: string | null;
  errorCode?: string;
}

export interface MusicRecord {
  id: number;
  user_id: string;
  task_id: string;
  model: string;
  prompt: string;
  style: string | null;
  title: string | null;
  lyrics: string | null;
  is_instrumental: boolean;
  is_public: boolean;
  credits_cost: number;
  status: string;
  progress: number;
  audio_url: string | null;
  audio_url_2: string | null;
  cover_url: string | null;
  cover_url_2: string | null;
  duration: number | null;
  duration_2: number | null;
  tags: string | null;
  error_message: string | null;
  created_at: Date;
  completed_at: Date | null;
  share_id: string | null;
}

/**
 * 构建回调 URL
 */
function getCallbackUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://voicica.ai';
  return `${baseUrl}/api/webhooks/kie-music`;
}

/**
 * 创建音乐生成任务
 */
export async function createMusicTask(request: MusicGenerationRequest): Promise<MusicTaskStatus> {
  console.log('🎵 [createMusicTask] 开始创建音乐任务');

  try {
    const unifiedUser = await getUserOrAnonymous();
    const userId = unifiedUser.user_id;
    const isAnonymous = unifiedUser.is_anonymous;

    console.log('🎵 [createMusicTask] 用户认证成功:', { userId, isAnonymous });

    // 1. 获取模型配置并计算积分
    const modelConfig = getMusicModelById(request.model);
    if (!modelConfig) {
      throw new Error(`不支持的模型: ${request.model}`);
    }
    const requiredCredits = modelConfig.credits;

    // 2. 检查积分是否足够
    const { hasEnough, current } = await checkCredits(userId, requiredCredits, isAnonymous);
    if (!hasEnough) {
      console.log(`⚠️ [createMusicTask] 积分不足: 需要 ${requiredCredits}, 当前 ${current}`);
      throw new InsufficientCreditsError(requiredCredits, current);
    }

    // 3. 生成任务 ID
    const taskId = uuidv4();
    const shareId = generateShareId();

    // 4. 创建音乐记录（状态为 PENDING）
    await prisma.music_records.create({
      data: {
        user_id: userId,
        task_id: taskId,
        model: request.model,
        prompt: request.prompt,
        style: request.style || null,
        title: request.title || null,
        is_instrumental: request.instrumental || false,
        is_custom_mode: !!(request.style || request.title),
        is_public: request.isPublic || false,
        credits_cost: requiredCredits,
        status: 'PENDING',
        progress: 0,
        share_id: shareId,
      },
    });

    console.log(`🎵 [createMusicTask] 音乐记录已创建: ${taskId}`);

    // 5. 调用 KIE API
    const kieModel = MODEL_MAP[request.model] || 'V4_5';
    // 自定义模式：明确传入 customMode=true，或者有 style/title，或者 prompt 超过 500 字符
    const isCustomMode = request.customMode || !!(request.style || request.title) || request.prompt.length > 500;

    const kiePayload: Record<string, unknown> = {
      prompt: request.prompt,
      customMode: isCustomMode,
      instrumental: request.instrumental || false,
      model: kieModel,
      callBackUrl: getCallbackUrl(),
    };

    // 自定义模式需要额外参数
    if (isCustomMode) {
      kiePayload.style = request.style || '';
      kiePayload.title = request.title || 'Untitled';
    }

    console.log('🎵 [createMusicTask] 调用 KIE API:', JSON.stringify(kiePayload, null, 2));

    const response = await fetch(`${KIE_API_BASE}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIE_API_KEY}`,
      },
      body: JSON.stringify(kiePayload),
    });

    const result = await response.json();
    console.log('🎵 [createMusicTask] KIE API 响应:', JSON.stringify(result, null, 2));

    if (result.code !== 200) {
      // API 调用失败，更新记录状态
      await prisma.music_records.update({
        where: { task_id: taskId },
        data: {
          status: 'FAILURE',
          error_message: result.msg || 'KIE API 调用失败',
        },
      });
      throw new Error(result.msg || 'KIE API 调用失败');
    }

    // 6. 更新记录，保存外部任务 ID
    await prisma.music_records.update({
      where: { task_id: taskId },
      data: {
        external_task_id: result.data?.taskId,
        status: 'PROCESSING',
        progress: 10,
      },
    });

    // 7. 扣减积分
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

    // 记录积分变动
    await prisma.credit_history.create({
      data: {
        user_id: userId,
        amount: -requiredCredits,
        task_id: taskId,
        description: `AI Music generation (${modelConfig.name})`,
        product_type: 'ai_music',
      },
    });

    console.log(`🎵 [createMusicTask] 任务创建成功: ${taskId}, 外部ID: ${result.data?.taskId}`);

    return {
      task_id: taskId,
      status: 'PROCESSING',
      progress: 10,
      result: null,
      error: null,
    };
  } catch (error) {
    console.error('❌ [createMusicTask] 创建任务失败:', error);

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
 * 查询音乐任务状态
 */
export async function getMusicTaskStatus(taskId: string): Promise<MusicTaskStatus> {
  const record = await prisma.music_records.findUnique({
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
          audio_url_2: record.audio_url_2 || undefined,
          cover_url: record.cover_url || undefined,
          cover_url_2: record.cover_url_2 || undefined,
          duration: record.duration || undefined,
          duration_2: record.duration_2 || undefined,
          title: record.title || undefined,
          tags: record.tags || undefined,
          lyrics: record.lyrics || undefined,
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
 * 获取用户音乐历史记录
 */
export async function getMusicRecords(limit: number = 50): Promise<MusicRecord[]> {
  const unifiedUser = await getUserOrAnonymous();
  const userId = unifiedUser.user_id;

  const records = await prisma.music_records.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
    take: limit,
  });

  return records.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    task_id: r.task_id,
    model: r.model,
    prompt: r.prompt,
    style: r.style,
    title: r.title,
    lyrics: r.lyrics,
    is_instrumental: r.is_instrumental,
    is_public: r.is_public,
    credits_cost: r.credits_cost,
    status: r.status,
    progress: r.progress,
    audio_url: r.audio_url,
    audio_url_2: r.audio_url_2,
    cover_url: r.cover_url,
    cover_url_2: r.cover_url_2,
    duration: r.duration,
    duration_2: r.duration_2,
    tags: r.tags,
    error_message: r.error_message,
    created_at: r.created_at,
    completed_at: r.completed_at,
    share_id: r.share_id,
  }));
}

/**
 * 删除音乐记录
 */
export async function deleteMusicRecord(recordId: number): Promise<void> {
  const unifiedUser = await getUserOrAnonymous();
  const userId = unifiedUser.user_id;

  const record = await prisma.music_records.findUnique({
    where: { id: recordId },
  });

  if (!record) {
    throw new Error(`记录不存在: ${recordId}`);
  }

  if (record.user_id !== userId) {
    throw new Error('无权删除此记录');
  }

  await prisma.music_records.delete({
    where: { id: recordId },
  });

  console.log(`🎵 音乐记录已删除: ${recordId}`);
}
