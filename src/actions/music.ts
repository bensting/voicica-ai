'use server';

/**
 * Music 模块 Server Actions
 * 使用 KIE API (Suno) 生成音乐
 */
import { getDb } from '@/lib/db';
import { musicRecords, anonymousUsers, users, creditHistory } from '@/db/schema';
import { eq, and, desc, isNotNull, sql } from 'drizzle-orm';
import { getUserOrAnonymous } from '@/lib/auth-firebase';
import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid';
import { InsufficientCreditsError, errorToResponse } from '@/lib/errors';
import { checkCredits, refundCreditsSimple } from '@/lib/credits';
import { getMusicModelById } from '@/config/native/musicModels';
import { downloadAndUploadToR2 } from '@/lib/services/r2-storage';
import { ProductType } from '@/config/productType';

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
  const db = await getDb();
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
    await db.insert(musicRecords).values({
      userId,
      taskId,
      model: request.model,
      prompt: request.prompt,
      style: request.style || null,
      title: request.title || null,
      isInstrumental: request.instrumental || false,
      isCustomMode: !!(request.style || request.title),
      isPublic: request.isPublic || false,
      creditsCost: requiredCredits,
      status: 'PENDING',
      progress: 0,
      shareId,
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

    // Check if response is OK before parsing JSON
    if (!response.ok) {
      console.error('❌ [createMusicTask] API error:', response.status, response.statusText);
      await db.update(musicRecords)
        .set({
          status: 'FAILURE',
          errorMessage: `API error: ${response.status} ${response.statusText}`,
        })
        .where(eq(musicRecords.taskId, taskId));
      return {
        task_id: taskId,
        status: 'FAILURE',
        progress: 0,
        result: null,
        error: `API error: ${response.status}`,
      };
    }

    // Check content type
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      console.error('❌ [createMusicTask] Invalid content type:', contentType);
      await db.update(musicRecords)
        .set({
          status: 'FAILURE',
          errorMessage: 'Invalid API response',
        })
        .where(eq(musicRecords.taskId, taskId));
      return {
        task_id: taskId,
        status: 'FAILURE',
        progress: 0,
        result: null,
        error: 'Invalid API response',
      };
    }

    const result = await response.json();
    console.log('🎵 [createMusicTask] KIE API 响应:', JSON.stringify(result, null, 2));

    if (result.code !== 200) {
      // API 调用失败，更新记录状态
      await db.update(musicRecords)
        .set({
          status: 'FAILURE',
          errorMessage: result.msg || 'KIE API call failed',
        })
        .where(eq(musicRecords.taskId, taskId));
      throw new Error(result.msg || 'KIE API call failed');
    }

    // 6. 更新记录，保存外部任务 ID
    await db.update(musicRecords)
      .set({
        externalTaskId: result.data?.taskId,
        status: 'PROCESSING',
        progress: 10,
      })
      .where(eq(musicRecords.taskId, taskId));

    // 7. 扣减积分
    if (isAnonymous) {
      await db.update(anonymousUsers)
        .set({ credits: sql`${anonymousUsers.credits} - ${requiredCredits}` })
        .where(eq(anonymousUsers.userId, userId));
    } else {
      await db.update(users)
        .set({ credits: sql`${users.credits} - ${requiredCredits}` })
        .where(eq(users.userId, userId));
    }

    // 记录积分变动
    await db.insert(creditHistory).values({
      userId,
      amount: -requiredCredits,
      taskId,
      description: `AI Music generation (${modelConfig.name})`,
      productType: 'ai_music',
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

    // Check if response is OK before parsing JSON
    if (!response.ok) {
      console.error('❌ [queryKieTaskStatus] API error:', response.status, response.statusText);
      return { status: 'PROCESSING', progress: 30 };
    }

    // Check content type to avoid parsing HTML as JSON
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      console.error('❌ [queryKieTaskStatus] Invalid content type:', contentType);
      return { status: 'PROCESSING', progress: 30 };
    }

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
  const db = await getDb();
  const [record] = await db.select().from(musicRecords).where(eq(musicRecords.taskId, taskId)).limit(1);

  if (!record) {
    throw new Error(`Task not found: ${taskId}`);
  }

  // 如果任务还在处理中，且有外部任务 ID，直接查询 KIE API
  // 生产环境和开发环境都直接查询，不完全依赖回调（回调可能失败）
  // 超时判断：只在任务创建后 30 分钟内查询，避免无限轮询
  const taskAgeMinutes = (Date.now() - new Date(record.createdAt).getTime()) / 1000 / 60;
  const isWithinTimeout = taskAgeMinutes < 30;

  if (record.externalTaskId && (record.status === 'PENDING' || record.status === 'PROCESSING') && isWithinTimeout) {
    console.log(`🎵 [getMusicTaskStatus] 直接查询 KIE API: ${record.externalTaskId}, 任务已创建 ${taskAgeMinutes.toFixed(1)} 分钟`);

    const kieStatus = await queryKieTaskStatus(record.externalTaskId);

    // 如果 KIE 返回成功，下载到 R2 并更新本地数据库
    if (kieStatus.status === 'SUCCESS' && kieStatus.data && kieStatus.data.length > 0) {
      // 原子抢占：将 progress 设为 99 表示"正在下载到 R2"，防止 Webhook 重复下载
      const claimResult = await db.update(musicRecords)
        .set({ progress: 99 })
        .where(and(
          eq(musicRecords.taskId, taskId),
          eq(musicRecords.status, 'PROCESSING'),
          sql`${musicRecords.progress} < 99`
        ))
        .returning();

      if (claimResult.length === 0) {
        console.log(`⚠️ [getMusicTaskStatus] 记录已被 Webhook 抢占或已完成，跳过下载: ${taskId}`);
        // 等一下让 Webhook 写完，再从数据库读取
        await new Promise(r => setTimeout(r, 3000));
        const [existingRecord] = await db.select().from(musicRecords).where(eq(musicRecords.taskId, taskId)).limit(1);
        return {
          task_id: taskId,
          status: existingRecord.status === 'SUCCESS' ? 'SUCCESS' : 'PROCESSING',
          progress: existingRecord.progress || 90,
          result: existingRecord.status === 'SUCCESS' ? {
            audio_url: existingRecord.audioUrl || '',
            audio_url_2: existingRecord.audioUrl2 || undefined,
            cover_url: existingRecord.coverUrl || undefined,
            cover_url_2: existingRecord.coverUrl2 || undefined,
            duration: existingRecord.duration || undefined,
            duration_2: existingRecord.duration2 || undefined,
            title: existingRecord.title || undefined,
            tags: existingRecord.tags || undefined,
            lyrics: existingRecord.lyrics || undefined,
          } : null,
          error: null,
        };
      }

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

      // 已抢占成功，直接写入最终结果
      await db.update(musicRecords)
        .set({
          status: 'SUCCESS',
          progress: 100,
          audioUrl: finalAudioUrl1,
          streamUrl: firstTrack.stream_audio_url || null,
          coverUrl: finalCoverUrl1 || null,
          duration: firstTrack.duration || null,
          title: firstTrack.title || record.title,
          tags: firstTrack.tags || null,
          lyrics: firstTrack.prompt || record.lyrics,
          audioUrl2: finalAudioUrl2 || null,
          streamUrl2: secondTrack?.stream_audio_url || null,
          coverUrl2: finalCoverUrl2 || null,
          duration2: secondTrack?.duration || null,
          completedAt: new Date().toISOString(),
        })
        .where(eq(musicRecords.taskId, taskId));

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

    // 如果 KIE 返回失败，更新数据库并返还积分（使用乐观锁防止重复处理）
    if (kieStatus.status === 'FAILURE') {
      const updateResult = await db.update(musicRecords)
        .set({
          status: 'FAILURE',
          progress: 0,
          errorMessage: kieStatus.error || 'Music generation failed',
        })
        .where(and(eq(musicRecords.taskId, taskId), eq(musicRecords.status, 'PROCESSING')))
        .returning();

      // 如果更新成功（返回了行），说明是第一个处理的，需要返还积分
      if (updateResult.length > 0 && record.creditsCost && record.creditsCost > 0) {
        try {
          await refundCreditsSimple(
            record.userId,
            record.creditsCost,
            ProductType.AI_MUSIC,
            `Music generation failed (KIE): ${kieStatus.error || 'Unknown error'}`,
            record.taskId
          );
          console.log(`💰 [getMusicTaskStatus] 积分已返还: ${record.creditsCost}`);
        } catch (refundError) {
          console.error(`❌ [getMusicTaskStatus] 积分返还失败:`, refundError);
        }
      } else if (updateResult.length === 0) {
        console.log(`⚠️ [getMusicTaskStatus] 任务已被其他请求处理，跳过积分返还: ${taskId}`);
      }

      return {
        task_id: taskId,
        status: 'FAILURE',
        progress: 0,
        result: null,
        error: kieStatus.error || null,
      };
    }

    // 更新进度
    if (kieStatus.progress !== record.progress) {
      await db.update(musicRecords)
        .set({ progress: kieStatus.progress })
        .where(eq(musicRecords.taskId, taskId));
    }

    return {
      task_id: taskId,
      status: 'PROCESSING',
      progress: kieStatus.progress,
      result: null,
      error: kieStatus.error || null,
    };
  }

  // 生产环境或任务已完成，直接从数据库读取
  // 如果已成功但 cover 还在第三方 CDN，尝试重新下载到 R2
  if (record.status === 'SUCCESS') {
    const r2PublicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || '';
    const needsReupload1 = record.coverUrl && !record.coverUrl.startsWith(r2PublicUrl);
    const needsReupload2 = record.coverUrl2 && !record.coverUrl2.startsWith(r2PublicUrl);

    if (needsReupload1 || needsReupload2) {
      console.log(`🎵 [getMusicTaskStatus] Cover 不在 R2，尝试重新下载: ${taskId}`);
      let updatedCoverUrl = record.coverUrl;
      let updatedCoverUrl2 = record.coverUrl2;

      if (needsReupload1 && record.coverUrl) {
        const r2Url = await downloadAndUploadToR2(record.coverUrl, taskId, 'cover', 1);
        if (r2Url) updatedCoverUrl = r2Url;
      }
      if (needsReupload2 && record.coverUrl2) {
        const r2Url = await downloadAndUploadToR2(record.coverUrl2, taskId, 'cover', 2);
        if (r2Url) updatedCoverUrl2 = r2Url;
      }

      if (updatedCoverUrl !== record.coverUrl || updatedCoverUrl2 !== record.coverUrl2) {
        await db.update(musicRecords)
          .set({
            coverUrl: updatedCoverUrl,
            coverUrl2: updatedCoverUrl2,
          })
          .where(eq(musicRecords.taskId, taskId));
        console.log(`✅ [getMusicTaskStatus] Cover 已更新到 R2: ${taskId}`);
      }

      return {
        task_id: taskId,
        status: 'SUCCESS',
        progress: 100,
        result: {
          audio_url: record.audioUrl || '',
          audio_url_2: record.audioUrl2 || undefined,
          cover_url: updatedCoverUrl || undefined,
          cover_url_2: updatedCoverUrl2 || undefined,
          duration: record.duration || undefined,
          duration_2: record.duration2 || undefined,
          title: record.title || undefined,
          tags: record.tags || undefined,
          lyrics: record.lyrics || undefined,
        },
        error: null,
      };
    }
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
          audio_url_2: record.audioUrl2 || undefined,
          cover_url: record.coverUrl || undefined,
          cover_url_2: record.coverUrl2 || undefined,
          duration: record.duration || undefined,
          duration_2: record.duration2 || undefined,
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
        error: record.errorMessage,
      };

    default:
      throw new Error(`Unknown task status: ${record.status}`);
  }
}

/**
 * 获取用户音乐历史记录
 */
export async function getMusicRecords(limit: number = 20, offset: number = 0): Promise<MusicRecord[]> {
  const db = await getDb();
  const unifiedUser = await getUserOrAnonymous();
  const userId = unifiedUser.user_id;

  const records = await db.select().from(musicRecords)
    .where(eq(musicRecords.userId, userId))
    .orderBy(desc(musicRecords.createdAt))
    .limit(limit)
    .offset(offset);

  return records.map((r) => ({
    id: r.id,
    user_id: r.userId,
    task_id: r.taskId,
    model: r.model,
    prompt: r.prompt,
    style: r.style,
    title: r.title,
    lyrics: r.lyrics,
    is_instrumental: r.isInstrumental,
    is_public: r.isPublic,
    credits_cost: r.creditsCost,
    status: r.status,
    progress: r.progress,
    audio_url: r.audioUrl,
    audio_url_2: r.audioUrl2,
    cover_url: r.coverUrl,
    cover_url_2: r.coverUrl2,
    duration: r.duration,
    duration_2: r.duration2,
    tags: r.tags,
    error_message: r.errorMessage,
    created_at: new Date(r.createdAt),
    completed_at: r.completedAt ? new Date(r.completedAt) : null,
    share_id: r.shareId,
  }));
}

/**
 * 删除音乐记录
 */
export async function deleteMusicRecord(recordId: number): Promise<void> {
  const db = await getDb();
  const unifiedUser = await getUserOrAnonymous();
  const userId = unifiedUser.user_id;

  const [record] = await db.select().from(musicRecords).where(eq(musicRecords.id, recordId)).limit(1);

  if (!record) {
    throw new Error(`Record not found: ${recordId}`);
  }

  if (record.userId !== userId) {
    throw new Error('Not authorized to delete this record');
  }

  await db.delete(musicRecords).where(eq(musicRecords.id, recordId));

  console.log(`🎵 音乐记录已删除: ${recordId}`);
}

/**
 * 根据 taskId 获取单条音乐记录
 */
export async function getMusicRecordByTaskId(taskId: string): Promise<MusicRecord | null> {
  const db = await getDb();
  try {
    const unifiedUser = await getUserOrAnonymous();
    const userId = unifiedUser.user_id;
    if (!userId) {
      return null;
    }

    const [record] = await db.select().from(musicRecords)
      .where(and(eq(musicRecords.taskId, taskId), eq(musicRecords.userId, userId)))
      .limit(1);

    if (!record) {
      return null;
    }

    return {
      id: record.id,
      user_id: record.userId,
      task_id: record.taskId,
      model: record.model,
      prompt: record.prompt,
      style: record.style,
      title: record.title,
      lyrics: record.lyrics,
      is_instrumental: record.isInstrumental,
      is_public: record.isPublic,
      credits_cost: record.creditsCost,
      status: record.status,
      progress: record.progress,
      audio_url: record.audioUrl,
      audio_url_2: record.audioUrl2,
      cover_url: record.coverUrl,
      cover_url_2: record.coverUrl2,
      duration: record.duration,
      duration_2: record.duration2,
      tags: record.tags,
      error_message: record.errorMessage,
      created_at: new Date(record.createdAt),
      completed_at: record.completedAt ? new Date(record.completedAt) : null,
      share_id: record.shareId,
    };
  } catch (error) {
    console.error('❌ [getMusicRecordByTaskId] Error:', error);
    return null;
  }
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
  const db = await getDb();
  const records = await db.select({
    id: musicRecords.id,
    taskId: musicRecords.taskId,
    title: musicRecords.title,
    coverUrl: musicRecords.coverUrl,
    audioUrl: musicRecords.audioUrl,
    duration: musicRecords.duration,
    tags: musicRecords.tags,
    lyrics: musicRecords.lyrics,
    prompt: musicRecords.prompt,
    model: musicRecords.model,
    createdAt: musicRecords.createdAt,
  })
    .from(musicRecords)
    .where(and(
      eq(musicRecords.isPublic, true),
      eq(musicRecords.status, 'SUCCESS'),
      isNotNull(musicRecords.audioUrl),
    ))
    .orderBy(desc(musicRecords.createdAt))
    .limit(limit);

  return records.map(r => ({
    id: r.id,
    task_id: r.taskId,
    title: r.title,
    cover_url: r.coverUrl,
    audio_url: r.audioUrl,
    duration: r.duration,
    tags: r.tags,
    lyrics: r.lyrics,
    prompt: r.prompt,
    model: r.model,
    created_at: new Date(r.createdAt),
  }));
}
