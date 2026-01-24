'use server';

/**
 * Cover 模块 Server Actions
 * 使用 Replicate API 实现 AI 翻唱功能
 * 使用 zsxkib/realistic-voice-cloning 模型一步完成
 */
import prisma from '@/lib/prisma';
import { getUserOrAnonymous } from '@/lib/auth-firebase';
import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid';
import { InsufficientCreditsError, errorToResponse } from '@/lib/errors';
import { checkCredits } from '@/lib/credits';
import { uploadAudio } from '@/lib/services/r2-storage';

// Replicate API 配置
const REPLICATE_API_BASE = 'https://api.replicate.com/v1';
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN || '';

/**
 * 从 Replicate URL 下载并上传到 R2
 */
async function downloadAndUploadToR2(
  url: string,
  taskId: string
): Promise<string | null> {
  try {
    console.log(`📥 [R2 Upload] 下载 Cover 文件: ${url.substring(0, 80)}...`);

    const response = await fetch(url);
    if (!response.ok) {
      console.error(`📥 [R2 Upload] 下载失败: ${response.status}`);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const fileName = `${taskId}.mp3`;
    const r2Url = await uploadAudio(buffer, fileName, 'audio/mpeg', 'cover_audio');

    console.log(`✅ [R2 Upload] Cover 上传成功: ${r2Url}`);
    return r2Url;
  } catch (error) {
    console.error(`❌ [R2 Upload] Cover 上传失败:`, error);
    return null;
  }
}

// 模型版本 - zsxkib/realistic-voice-cloning
const VOICE_CLONING_VERSION = '0a9c7c558af4c0f20667c1bd1260ce32a2879944a0b9e44e1398660c077b1550';

// Cover 功能积分消耗
const COVER_CREDITS_COST = 50;

/**
 * 构建 Webhook 回调 URL
 * 注意：必须使用 www.voicica.ai，因为 voicica.ai 会 301 重定向，POST 请求不会跟随重定向
 */
function getWebhookUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.voicica.ai';
  return `${baseUrl}/api/webhooks/replicate-cover`;
}

/**
 * 生成分享短码
 */
function generateShareId(): string {
  return nanoid(8);
}

// 类型定义
export interface RvcVoiceModel {
  id: number;
  name: string;
  slug: string;
  category: string;
  avatar_url: string | null;
  sample_url: string | null;
  uses_count: number;
  is_builtin: boolean;
  builtin_name: string | null;
}

export interface CoverGenerationRequest {
  /** 原始音频 URL */
  originalAudioUrl: string;
  /** 声音模型 ID */
  voiceModelId: number;
  /** 音高调整（半音） */
  pitchChange?: number;
  /** 是否公开 */
  isPublic?: boolean;
}

export interface CoverTaskStatus {
  task_id: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILURE';
  progress: number;
  result?: {
    output_url: string;
    duration?: number;
  } | null;
  error?: string | null;
}

export interface CoverRecord {
  id: number;
  user_id: string;
  task_id: string;
  original_audio_url: string;
  voice_model_id: number;
  voice_model_name: string;
  status: string;
  progress: number;
  output_url: string | null;
  duration: number | null;
  credits_cost: number;
  is_public: boolean;
  created_at: Date;
  completed_at: Date | null;
  share_id: string | null;
}

/**
 * 获取可用的 RVC 声音模型列表
 */
export async function getRvcVoiceModels(category?: string): Promise<RvcVoiceModel[]> {
  const where: { is_active: boolean; category?: string } = { is_active: true };
  if (category && category !== 'all') {
    where.category = category;
  }

  const models = await prisma.rvc_voice_models.findMany({
    where,
    orderBy: [
      { sort_order: 'asc' },
      { uses_count: 'desc' },
    ],
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      avatar_url: true,
      sample_url: true,
      uses_count: true,
      is_builtin: true,
      builtin_name: true,
    },
  });

  return models;
}

/**
 * 调用 Replicate API 创建预测
 */
async function createReplicatePrediction(
  version: string,
  input: Record<string, unknown>,
  taskId?: string
): Promise<{ id: string; status: string; output?: unknown; error?: string }> {
  const webhookUrl = getWebhookUrl();

  // 构建请求体
  const requestBody: Record<string, unknown> = {
    version,
    input,
  };

  // 添加 webhook 配置
  if (taskId) {
    requestBody.webhook = `${webhookUrl}?task_id=${taskId}`;
    requestBody.webhook_events_filter = ['completed'];
  }

  console.log('🎤 [createReplicatePrediction] 调用 Replicate API:', {
    version: version.substring(0, 16) + '...',
    webhook: requestBody.webhook,
  });

  const response = await fetch(`${REPLICATE_API_BASE}/predictions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.detail || 'Replicate API error');
  }

  return result;
}

/**
 * 查询 Replicate 预测状态
 */
async function getReplicatePrediction(predictionId: string): Promise<{
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: unknown;
  error?: string;
}> {
  const response = await fetch(`${REPLICATE_API_BASE}/predictions/${predictionId}`, {
    headers: {
      'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.detail || 'Failed to get prediction status');
  }

  return result;
}

/**
 * 创建 AI Cover 任务
 */
export async function createCoverTask(request: CoverGenerationRequest): Promise<CoverTaskStatus> {
  console.log('🎤 [createCoverTask] 开始创建翻唱任务');

  try {
    const unifiedUser = await getUserOrAnonymous();
    const userId = unifiedUser.user_id;
    const isAnonymous = unifiedUser.is_anonymous;

    console.log('🎤 [createCoverTask] 用户认证成功:', { userId, isAnonymous });

    // 1. 检查积分是否足够
    const { hasEnough, current } = await checkCredits(userId, COVER_CREDITS_COST, isAnonymous);
    if (!hasEnough) {
      console.log(`⚠️ [createCoverTask] 积分不足: 需要 ${COVER_CREDITS_COST}, 当前 ${current}`);
      throw new InsufficientCreditsError(COVER_CREDITS_COST, current);
    }

    // 2. 获取声音模型信息
    const voiceModel = await prisma.rvc_voice_models.findUnique({
      where: { id: request.voiceModelId },
    });

    if (!voiceModel || !voiceModel.is_active) {
      throw new Error('Voice model not found or disabled');
    }

    // 3. 生成任务 ID
    const taskId = uuidv4();
    const shareId = generateShareId();

    // 4. 创建 Cover 记录（状态为 PENDING）
    await prisma.cover_records.create({
      data: {
        user_id: userId,
        task_id: taskId,
        original_audio_url: request.originalAudioUrl,
        voice_model_id: request.voiceModelId,
        voice_model_name: voiceModel.name,
        pitch_change: request.pitchChange || 0,
        credits_cost: COVER_CREDITS_COST,
        is_public: request.isPublic || false,
        status: 'PENDING',
        progress: 0,
        share_id: shareId,
      },
    });

    console.log(`🎤 [createCoverTask] Cover 记录已创建: ${taskId}`);

    // 5. 构建模型输入参数
    const modelInput: Record<string, unknown> = {
      song_input: request.originalAudioUrl,
      pitch_change: getPitchChangeValue(request.pitchChange),
      index_rate: 0.5,
      filter_radius: 3,
      rms_mix_rate: 0.25,
      pitch_detection_algorithm: 'rmvpe',
      crepe_hop_length: 128,
      protect: 0.33,
      main_vocals_volume_change: 0,
      backup_vocals_volume_change: 0,
      instrumental_volume_change: 0,
      pitch_change_all: request.pitchChange || 0,
      reverb_size: 0.15,
      reverb_wetness: 0.2,
      reverb_dryness: 0.8,
      reverb_damping: 0.7,
      output_format: 'mp3',
    };

    // 设置声音模型
    if (voiceModel.is_builtin && voiceModel.builtin_name) {
      // 内置模型：Squidward, MrKrabs, Plankton, Drake, Vader, Trump, Biden, Obama, Guitar, Voilin
      modelInput.rvc_model = voiceModel.builtin_name;
    } else {
      // 自定义模型
      modelInput.rvc_model = 'CUSTOM';
      modelInput.custom_rvc_model_download_url = voiceModel.model_url;
      modelInput.custom_rvc_model_download_name = voiceModel.slug;
    }

    // 6. 调用 Replicate API
    console.log('🎤 [createCoverTask] 调用 realistic-voice-cloning 模型');
    const prediction = await createReplicatePrediction(
      VOICE_CLONING_VERSION,
      modelInput,
      taskId
    );

    // 更新状态为 PROCESSING
    await prisma.cover_records.update({
      where: { task_id: taskId },
      data: {
        status: 'PROCESSING',
        progress: 10,
        rvc_task_id: prediction.id,
      },
    });

    // 7. 扣减积分
    if (isAnonymous) {
      await prisma.anonymous_users.update({
        where: { user_id: userId },
        data: { credits: { decrement: COVER_CREDITS_COST } },
      });
    } else {
      await prisma.users.update({
        where: { user_id: userId },
        data: { credits: { decrement: COVER_CREDITS_COST } },
      });
    }

    // 记录积分变动
    await prisma.credit_history.create({
      data: {
        user_id: userId,
        amount: -COVER_CREDITS_COST,
        task_id: taskId,
        description: `AI Cover (${voiceModel.name})`,
        product_type: 'ai_cover',
      },
    });

    // 8. 增加声音模型使用次数
    await prisma.rvc_voice_models.update({
      where: { id: request.voiceModelId },
      data: { uses_count: { increment: 1 } },
    });

    console.log(`🎤 [createCoverTask] 任务创建成功: ${taskId}`);

    return {
      task_id: taskId,
      status: 'PROCESSING',
      progress: 10,
      result: null,
      error: null,
    };
  } catch (error) {
    console.error('❌ [createCoverTask] 创建任务失败:', error);

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
 * 转换音高调整值
 */
function getPitchChangeValue(pitchChange?: number): string {
  if (!pitchChange || pitchChange === 0) {
    return 'no-change';
  }
  // 根据音高变化判断是男声转女声还是女声转男声
  if (pitchChange > 0) {
    return 'male-to-female';
  }
  return 'female-to-male';
}

/**
 * 处理 Cover 任务状态查询
 */
export async function processCoverTask(taskId: string): Promise<CoverTaskStatus> {
  const record = await prisma.cover_records.findUnique({
    where: { task_id: taskId },
  });

  if (!record) {
    throw new Error(`Task not found: ${taskId}`);
  }

  try {
    // 根据当前状态处理
    switch (record.status) {
      case 'PROCESSING': {
        // 检查 Replicate 任务状态
        if (!record.rvc_task_id) {
          throw new Error('Replicate task ID missing');
        }

        const predictionStatus = await getReplicatePrediction(record.rvc_task_id);
        console.log('🎤 [processCoverTask] 任务状态:', predictionStatus.status);

        if (predictionStatus.status === 'succeeded') {
          // 成功，获取输出 URL 并下载到 R2
          const replicateOutputUrl = predictionStatus.output as string;

          console.log('🎤 [processCoverTask] 任务成功，开始下载到 R2...');

          // 下载到 R2
          const r2Url = await downloadAndUploadToR2(replicateOutputUrl, taskId);
          const finalUrl = r2Url || replicateOutputUrl; // 如果 R2 上传失败，保留原始 URL

          await prisma.cover_records.update({
            where: { task_id: taskId },
            data: {
              status: 'SUCCESS',
              progress: 100,
              output_url: finalUrl,
              completed_at: new Date(),
            },
          });

          console.log(`🎤 [processCoverTask] Cover 完成: ${taskId}`);

          return {
            task_id: taskId,
            status: 'SUCCESS',
            progress: 100,
            result: {
              output_url: finalUrl,
            },
            error: null,
          };
        } else if (predictionStatus.status === 'failed') {
          await prisma.cover_records.update({
            where: { task_id: taskId },
            data: {
              status: 'FAILURE',
              error_message: predictionStatus.error || 'AI Cover 处理失败',
            },
          });

          return {
            task_id: taskId,
            status: 'FAILURE',
            progress: 0,
            result: null,
            error: predictionStatus.error || 'AI Cover 处理失败',
          };
        }

        // 仍在处理中，根据时间估计进度
        const createdAt = record.created_at.getTime();
        const elapsed = Date.now() - createdAt;
        const estimatedProgress = Math.min(90, 10 + Math.floor(elapsed / 3000)); // 每3秒增加1%

        return {
          task_id: taskId,
          status: 'PROCESSING',
          progress: estimatedProgress,
          result: null,
          error: null,
        };
      }

      case 'SUCCESS':
        return {
          task_id: taskId,
          status: 'SUCCESS',
          progress: 100,
          result: {
            output_url: record.output_url || '',
            duration: record.duration || undefined,
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
        return {
          task_id: taskId,
          status: record.status as CoverTaskStatus['status'],
          progress: record.progress,
          result: null,
          error: null,
        };
    }
  } catch (error) {
    console.error('❌ [processCoverTask] 处理任务失败:', error);

    await prisma.cover_records.update({
      where: { task_id: taskId },
      data: {
        status: 'FAILURE',
        error_message: error instanceof Error ? error.message : '处理失败',
      },
    });

    return {
      task_id: taskId,
      status: 'FAILURE',
      progress: 0,
      result: null,
      error: error instanceof Error ? error.message : '处理失败',
    };
  }
}

/**
 * 查询 Cover 任务状态
 */
export async function getCoverTaskStatus(taskId: string): Promise<CoverTaskStatus> {
  return processCoverTask(taskId);
}

/**
 * 获取用户 Cover 历史记录
 */
export async function getCoverRecords(limit: number = 50): Promise<CoverRecord[]> {
  const unifiedUser = await getUserOrAnonymous();
  const userId = unifiedUser.user_id;

  const records = await prisma.cover_records.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
    take: limit,
  });

  return records.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    task_id: r.task_id,
    original_audio_url: r.original_audio_url,
    voice_model_id: r.voice_model_id,
    voice_model_name: r.voice_model_name,
    status: r.status,
    progress: r.progress,
    output_url: r.output_url,
    duration: r.duration,
    credits_cost: r.credits_cost,
    is_public: r.is_public,
    created_at: r.created_at,
    completed_at: r.completed_at,
    share_id: r.share_id,
  }));
}

/**
 * 删除 Cover 记录
 */
export async function deleteCoverRecord(recordId: number): Promise<void> {
  const unifiedUser = await getUserOrAnonymous();
  const userId = unifiedUser.user_id;

  const record = await prisma.cover_records.findUnique({
    where: { id: recordId },
  });

  if (!record) {
    throw new Error(`Record not found: ${recordId}`);
  }

  if (record.user_id !== userId) {
    throw new Error('Not authorized to delete this record');
  }

  await prisma.cover_records.delete({
    where: { id: recordId },
  });

  console.log(`🎤 Cover 记录已删除: ${recordId}`);
}
