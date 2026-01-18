/**
 * Runware Video Generation Service
 *
 * AI 视频生成服务，支持文字生成视频
 * 文档: https://runware.ai/docs/video-inference/api-reference
 */

import { Runware } from '@runware/sdk-js';

// Runware 客户端实例（懒加载）
let runwareClient: InstanceType<typeof Runware> | null = null;

/**
 * 获取 Runware 客户端实例
 */
function getRunwareClient(): InstanceType<typeof Runware> {
  if (!runwareClient) {
    const apiKey = process.env.RUNWARE_API_KEY;
    if (!apiKey) {
      throw new Error('RUNWARE_API_KEY environment variable is not set');
    }
    runwareClient = new Runware({
      apiKey,
      shouldReconnect: true,
      globalMaxRetries: 3,
      timeoutDuration: 600000, // 10 minutes timeout for video generation
    });
  }
  return runwareClient;
}

/**
 * 视频生成参数
 */
export interface GenerateVideoParams {
  /** 正向提示词 */
  prompt: string;
  /** 负向提示词（可选） */
  negativePrompt?: string;
  /** 模型 ID（如 google:3@2） */
  model: string;
  /** 视频时长（秒） */
  duration?: number;
  /** 视频宽度 */
  width?: number;
  /** 视频高度 */
  height?: number;
  /** 宽高比 */
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3' | '3:4';
  /** 随机种子 */
  seed?: number;
  /** 输入图片（用于 image-to-video） */
  inputImage?: string;
}

/**
 * 视频生成结果
 */
export interface GeneratedVideo {
  /** 任务 UUID */
  taskUUID: string;
  /** 视频 UUID */
  videoUUID?: string;
  /** 视频 URL */
  videoURL?: string;
  /** 状态 */
  status: string;
  /** 消耗的积分 */
  cost?: number;
  /** 随机种子 */
  seed?: number;
}

/**
 * 根据宽高比计算视频尺寸
 * Veo 3.1 支持的分辨率
 */
function getVideoDimensions(
  aspectRatio: string,
  quality: string
): { width: number; height: number } {
  // 基于质量确定基础分辨率
  const baseResolutions: Record<string, number> = {
    '512p': 512,
    '540p': 540,
    '720p': 720,
    '768p': 768,
    '1080p': 1080,
  };

  const baseHeight = baseResolutions[quality] || 720;

  // 根据宽高比计算宽度和高度
  switch (aspectRatio) {
    case '16:9':
      return { width: Math.round((baseHeight * 16) / 9), height: baseHeight };
    case '9:16':
      return { width: baseHeight, height: Math.round((baseHeight * 16) / 9) };
    case '1:1':
      return { width: baseHeight, height: baseHeight };
    case '4:3':
      return { width: Math.round((baseHeight * 4) / 3), height: baseHeight };
    case '3:4':
      return { width: baseHeight, height: Math.round((baseHeight * 4) / 3) };
    default:
      return { width: Math.round((baseHeight * 16) / 9), height: baseHeight };
  }
}

/**
 * 生成视频（异步）
 *
 * @param params 生成参数
 * @returns 生成的视频信息
 */
export async function generateVideo(params: GenerateVideoParams): Promise<GeneratedVideo> {
  const client = getRunwareClient();

  const {
    prompt,
    negativePrompt,
    model,
    duration = 8,
    aspectRatio = '16:9',
    seed,
    inputImage,
  } = params;

  // 计算视频尺寸（使用默认 720p）
  const { width, height } = params.width && params.height
    ? { width: params.width, height: params.height }
    : getVideoDimensions(aspectRatio, '720p');

  console.log('🎬 [Runware Video] Generating video:', {
    prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
    model,
    duration,
    width,
    height,
    aspectRatio,
  });

  try {
    // 构建请求参数
    const requestParams: Record<string, unknown> = {
      positivePrompt: prompt,
      model,
      duration,
      width,
      height,
      outputType: 'URL',
      outputFormat: 'MP4',
      includeCost: true,
      deliveryMethod: 'async', // 使用异步模式
    };

    if (negativePrompt) {
      requestParams.negativePrompt = negativePrompt;
    }

    if (seed !== undefined) {
      requestParams.seed = seed;
    }

    // 如果有输入图片（image-to-video）
    if (inputImage) {
      requestParams.inputs = {
        image: inputImage,
      };
    }

    const result = await client.videoInference(requestParams as Parameters<typeof client.videoInference>[0]);

    // 处理结果（可能是数组或单个对象）
    const videoResult = Array.isArray(result) ? result[0] : result;

    if (!videoResult) {
      throw new Error('No video generated');
    }

    console.log('✅ [Runware Video] Video generation initiated:', {
      taskUUID: videoResult.taskUUID,
      status: videoResult.status,
    });

    return {
      taskUUID: videoResult.taskUUID,
      videoUUID: videoResult.videoUUID,
      videoURL: videoResult.videoURL,
      status: videoResult.status,
      cost: videoResult.cost,
      seed: videoResult.seed,
    };
  } catch (error) {
    console.error('❌ [Runware Video] Video generation failed:', error);
    throw error;
  }
}

/**
 * 轮询获取异步视频生成结果
 *
 * @param taskUUID 任务 UUID
 * @param maxWaitMs 最大等待时间（毫秒），默认 10 分钟
 * @param pollIntervalMs 轮询间隔（毫秒），默认 10 秒
 * @param onProgress 进度回调
 * @returns 完成的视频信息
 */
export async function waitForVideoCompletion(
  taskUUID: string,
  maxWaitMs: number = 600000,
  pollIntervalMs: number = 10000,
  onProgress?: (progress: number) => Promise<void>
): Promise<GeneratedVideo> {
  const client = getRunwareClient();
  const startTime = Date.now();
  let pollCount = 0;

  while (Date.now() - startTime < maxWaitMs) {
    pollCount++;

    try {
      // 使用 getResponse 获取异步结果
      const results = await client.getResponse<{
        taskUUID: string;
        taskType: string;
        status: string;
        videoUUID?: string;
        videoURL?: string;
        cost?: number;
        seed?: number;
      }>({
        taskUUID,
      });

      const result = results[0];

      // 计算进度（30% 到 90%，基于轮询次数和时间）
      const elapsedRatio = Math.min((Date.now() - startTime) / maxWaitMs, 0.9);
      const progress = Math.floor(30 + elapsedRatio * 60);

      if (onProgress) {
        await onProgress(progress);
      }

      console.log(`🔄 [Runware Video] Poll #${pollCount}, status=${result?.status}, progress=${progress}%`);

      // 检查是否完成
      if (result && result.videoURL) {
        console.log('✅ [Runware Video] Video generation completed:', result.videoURL);
        return {
          taskUUID: result.taskUUID,
          videoUUID: result.videoUUID,
          videoURL: result.videoURL,
          status: 'completed',
          cost: result.cost,
          seed: result.seed,
        };
      }

      // 检查是否失败
      if (result && result.status === 'failed') {
        throw new Error('Video generation failed');
      }
    } catch (error) {
      // 如果是超时或网络错误，继续轮询
      console.warn(`⚠️ [Runware Video] Poll error (will retry):`, error);
    }

    // 等待下一次轮询
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Video generation timeout (exceeded ${maxWaitMs / 1000} seconds)`);
}

/**
 * 生成视频并等待完成（同步方式）
 *
 * @param params 生成参数
 * @param onProgress 进度回调
 * @returns 完成的视频信息
 */
export async function generateVideoAndWait(
  params: GenerateVideoParams,
  onProgress?: (progress: number) => Promise<void>
): Promise<GeneratedVideo> {
  // 1. 提交视频生成任务
  const initialResult = await generateVideo(params);

  // 如果直接返回了视频 URL，说明是同步完成的
  if (initialResult.videoURL) {
    return initialResult;
  }

  // 2. 轮询等待完成
  return waitForVideoCompletion(
    initialResult.taskUUID,
    600000, // 10 minutes max
    10000, // 10 seconds interval
    onProgress
  );
}

/**
 * 断开 Runware 连接
 */
export async function disconnectRunwareVideo(): Promise<void> {
  if (runwareClient) {
    await runwareClient.disconnect();
    runwareClient = null;
    console.log('🔌 [Runware Video] Disconnected');
  }
}
