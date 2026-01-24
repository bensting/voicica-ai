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
import { getMusicModelById } from '@/config/native/musicModels';
import { uploadAudio, uploadImage } from '@/lib/services/r2-storage';

// KIE API 配置
const KIE_API_BASE = 'https://api.kie.ai/api/v1';
const KIE_API_KEY = process.env.KIE_API_KEY || '';

/**
 * 从 URL 下载文件并上传到 R2
 */
async function downloadAndUploadToR2(
  url: string,
  taskId: string,
  type: 'audio' | 'cover',
  trackIndex: number = 1
): Promise<string | null> {
  try {
    console.log(`📥 [R2 Upload] 下载文件: ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
      console.error(`📥 [R2 Upload] 下载失败: ${response.status}`);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const suffix = trackIndex > 1 ? `_v${trackIndex}` : '';

    if (type === 'audio') {
      const fileName = `${taskId}${suffix}.mp3`;
      const r2Url = await uploadAudio(buffer, fileName, 'audio/mpeg', 'music_audio');
      console.log(`✅ [R2 Upload] 音频上传成功: ${r2Url}`);
      return r2Url;
    } else {
      const fileName = `${taskId}${suffix}.jpg`;
      const r2Url = await uploadImage(buffer, fileName, 'image/jpeg', 'music_covers');
      console.log(`✅ [R2 Upload] 封面上传成功: ${r2Url}`);
      return r2Url;
    }
  } catch (error) {
    console.error(`❌ [R2 Upload] 上传失败:`, error);
    return null;
  }
}

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
  /** 声音性别: 'm' 男声, 'f' 女声 (仅 customMode 有效) */
  vocalGender?: 'm' | 'f';
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
 * 注意：必须使用 www.voicica.ai，因为 voicica.ai 会 301 重定向，POST 请求不会跟随重定向
 */
function getCallbackUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.voicica.ai';
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
      throw new Error(`Unsupported model: ${request.model}`);
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
      // vocalGender 仅在 customMode 下有效
      if (request.vocalGender) {
        kiePayload.vocalGender = request.vocalGender;
      }
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
          error_message: result.msg || 'KIE API call failed',
        },
      });
      throw new Error(result.msg || 'KIE API call failed');
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
 * 查询 KIE API 任务状态（直接调用，不依赖回调）
 * 使用 GET /generate/record-info 端点查询任务详情
 * 文档: https://docs.kie.ai/suno-api/get-music-details
 */
async function queryKieTaskStatus(externalTaskId: string): Promise<{
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILURE';
  progress: number;
  data?: {
    audio_url?: string;
    stream_audio_url?: string;
    image_url?: string;
    title?: string;
    tags?: string;
    prompt?: string;
    duration?: number;
  }[];
  error?: string;
}> {
  try {
    // 使用 GET /generate/record-info 端点查询任务状态
    const response = await fetch(`${KIE_API_BASE}/generate/record-info?taskId=${externalTaskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${KIE_API_KEY}`,
      },
    });

    const result = await response.json();
    console.log('🎵 [queryKieTaskStatus] KIE API 响应:', JSON.stringify(result, null, 2));

    if (result.code !== 200) {
      // 如果是任务还在队列中，返回处理中状态
      if (result.code === 400 || result.msg?.includes('queue') || result.msg?.includes('pending')) {
        return {
          status: 'PROCESSING',
          progress: 30,
        };
      }
      return {
        status: 'PROCESSING',
        progress: 30,
        error: result.msg,
      };
    }

    const data = result.data;

    // KIE API 返回的状态: PENDING, TEXT_SUCCESS, FIRST_SUCCESS, SUCCESS
    // 映射到我们的状态
    const kieStatus = data?.status;
    const sunoData = data?.response?.sunoData;

    if (kieStatus === 'SUCCESS' && sunoData && Array.isArray(sunoData) && sunoData.length > 0) {
      // 转换 sunoData 格式
      const tracks = sunoData.map((track: {
        audioUrl?: string;
        streamAudioUrl?: string;
        imageUrl?: string;
        title?: string;
        tags?: string;
        prompt?: string;
        duration?: number;
      }) => ({
        audio_url: track.audioUrl,
        stream_audio_url: track.streamAudioUrl,
        image_url: track.imageUrl,
        title: track.title,
        tags: track.tags,
        prompt: track.prompt,
        duration: track.duration,
      }));

      return {
        status: 'SUCCESS',
        progress: 100,
        data: tracks,
      };
    }

    // FIRST_SUCCESS 表示第一首歌完成
    if (kieStatus === 'FIRST_SUCCESS') {
      return {
        status: 'PROCESSING',
        progress: 70,
      };
    }

    // TEXT_SUCCESS 表示歌词生成完成
    if (kieStatus === 'TEXT_SUCCESS') {
      return {
        status: 'PROCESSING',
        progress: 40,
      };
    }

    // PENDING 或其他状态
    return {
      status: 'PROCESSING',
      progress: 30,
    };
  } catch (error) {
    console.error('🎵 [queryKieTaskStatus] 查询失败:', error);
    return {
      status: 'PROCESSING',
      progress: 30,
    };
  }
}

/**
 * 查询音乐任务状态
 * 任务创建后 30 分钟内会直接查询 KIE API 获取最新状态（不完全依赖回调）
 */
export async function getMusicTaskStatus(taskId: string): Promise<MusicTaskStatus> {
  const record = await prisma.music_records.findUnique({
    where: { task_id: taskId },
  });

  if (!record) {
    throw new Error(`Task not found: ${taskId}`);
  }

  // 如果任务还在处理中，且有外部任务 ID，直接查询 KIE API
  // 生产环境和开发环境都直接查询，不完全依赖回调（回调可能失败）
  // 超时判断：只在任务创建后 30 分钟内查询，避免无限轮询
  const taskAgeMinutes = (Date.now() - new Date(record.created_at).getTime()) / 1000 / 60;
  const isWithinTimeout = taskAgeMinutes < 30;

  if (record.external_task_id && (record.status === 'PENDING' || record.status === 'PROCESSING') && isWithinTimeout) {
    console.log(`🎵 [getMusicTaskStatus] 直接查询 KIE API: ${record.external_task_id}, 任务已创建 ${taskAgeMinutes.toFixed(1)} 分钟`);

    const kieStatus = await queryKieTaskStatus(record.external_task_id);

    // 如果 KIE 返回成功，下载到 R2 并更新本地数据库
    if (kieStatus.status === 'SUCCESS' && kieStatus.data && kieStatus.data.length > 0) {
      const firstTrack = kieStatus.data[0];
      const secondTrack = kieStatus.data.length > 1 ? kieStatus.data[1] : null;

      console.log('🎵 [getMusicTaskStatus] 开始下载文件到 R2...');

      // 下载第一首歌的音频和封面到 R2
      const r2AudioUrl1 = firstTrack.audio_url
        ? await downloadAndUploadToR2(firstTrack.audio_url, taskId, 'audio', 1)
        : null;
      const r2CoverUrl1 = firstTrack.image_url
        ? await downloadAndUploadToR2(firstTrack.image_url, taskId, 'cover', 1)
        : null;

      // 下载第二首歌的音频和封面到 R2（如果有）
      let r2AudioUrl2: string | null = null;
      let r2CoverUrl2: string | null = null;
      if (secondTrack) {
        r2AudioUrl2 = secondTrack.audio_url
          ? await downloadAndUploadToR2(secondTrack.audio_url, taskId, 'audio', 2)
          : null;
        r2CoverUrl2 = secondTrack.image_url
          ? await downloadAndUploadToR2(secondTrack.image_url, taskId, 'cover', 2)
          : null;
      }

      // 使用 R2 URL（如果上传成功），否则保留原始 URL
      const finalAudioUrl1 = r2AudioUrl1 || firstTrack.audio_url;
      const finalCoverUrl1 = r2CoverUrl1 || firstTrack.image_url;
      const finalAudioUrl2 = r2AudioUrl2 || secondTrack?.audio_url;
      const finalCoverUrl2 = r2CoverUrl2 || secondTrack?.image_url;

      await prisma.music_records.update({
        where: { task_id: taskId },
        data: {
          status: 'SUCCESS',
          progress: 100,
          audio_url: finalAudioUrl1,
          stream_url: firstTrack.stream_audio_url || null,
          cover_url: finalCoverUrl1 || null,
          duration: firstTrack.duration || null,
          title: firstTrack.title || record.title,
          tags: firstTrack.tags || null,
          lyrics: firstTrack.prompt || record.lyrics,
          audio_url_2: finalAudioUrl2 || null,
          stream_url_2: secondTrack?.stream_audio_url || null,
          cover_url_2: finalCoverUrl2 || null,
          duration_2: secondTrack?.duration || null,
          completed_at: new Date(),
        },
      });

      console.log('🎵 [getMusicTaskStatus] 文件下载到 R2 完成');

      return {
        task_id: taskId,
        status: 'SUCCESS',
        progress: 100,
        result: {
          audio_url: finalAudioUrl1 || '',
          audio_url_2: finalAudioUrl2 || undefined,
          cover_url: finalCoverUrl1 || undefined,
          cover_url_2: finalCoverUrl2 || undefined,
          duration: firstTrack.duration || undefined,
          duration_2: secondTrack?.duration || undefined,
          title: firstTrack.title || undefined,
          tags: firstTrack.tags || undefined,
          lyrics: firstTrack.prompt || undefined,
        },
        error: null,
      };
    }

    // 更新进度
    if (kieStatus.progress !== record.progress) {
      await prisma.music_records.update({
        where: { task_id: taskId },
        data: { progress: kieStatus.progress },
      });
    }

    return {
      task_id: taskId,
      status: kieStatus.status === 'FAILURE' ? 'FAILURE' : 'PROCESSING',
      progress: kieStatus.progress,
      result: null,
      error: kieStatus.error || null,
    };
  }

  // 生产环境或任务已完成，直接从数据库读取
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
      throw new Error(`Unknown task status: ${record.status}`);
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
    throw new Error(`Record not found: ${recordId}`);
  }

  if (record.user_id !== userId) {
    throw new Error('Not authorized to delete this record');
  }

  await prisma.music_records.delete({
    where: { id: recordId },
  });

  console.log(`🎵 音乐记录已删除: ${recordId}`);
}

/**
 * 公开音乐记录类型（用于 Explore 展示）
 */
export interface PublicMusicRecord {
  id: number;
  task_id: string;
  title: string | null;
  cover_url: string | null;
  audio_url: string | null;
  duration: number | null;
  tags: string | null;
  lyrics: string | null;
  prompt: string | null;
  model: string;
  created_at: Date;
}

/**
 * 获取公开的音乐记录（用于 Explore 页面）
 */
export async function getPublicMusicRecords(limit: number = 20): Promise<PublicMusicRecord[]> {
  const records = await prisma.music_records.findMany({
    where: {
      is_public: true,
      status: 'SUCCESS',
      audio_url: { not: null },
    },
    orderBy: { created_at: 'desc' },
    take: limit,
    select: {
      id: true,
      task_id: true,
      title: true,
      cover_url: true,
      audio_url: true,
      duration: true,
      tags: true,
      lyrics: true,
      prompt: true,
      model: true,
      created_at: true,
    },
  });

  return records;
}
