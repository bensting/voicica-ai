/**
 * Kie.ai Video Generation Service
 *
 * AI 视频生成服务，支持 Seedance 1.5 Pro 模型
 * 文档: https://kie.ai/seedance-1-5-pro
 */

const KIE_API_BASE_URL = 'https://api.kie.ai/api/v1';

/**
 * 视频生成参数
 */
export interface KieGenerateVideoParams {
  /** 正向提示词 (3-2500 字符) */
  prompt: string;
  /** 输入图片 URL 数组 (0-2 张) */
  inputUrls?: string[];
  /** 宽高比 */
  aspectRatio: '1:1' | '21:9' | '4:3' | '3:4' | '16:9' | '9:16';
  /** 分辨率 */
  resolution: '480p' | '720p';
  /** 时长 (秒) */
  duration: '4' | '8' | '12';
  /** 固定镜头 */
  fixedLens?: boolean;
  /** 生成音频 */
  generateAudio?: boolean;
}

/**
 * 创建任务响应
 */
export interface KieCreateTaskResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
  };
}

/**
 * 任务状态响应
 */
export interface KieTaskStatusResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
    model: string;
    state: 'waiting' | 'success' | 'fail';
    param: string;
    resultJson: string | null;
    failCode: string | null;
    failMsg: string | null;
    costTime: number | null;
    completeTime: number | null;
    createTime: number;
  };
}

/**
 * 视频生成结果
 */
export interface KieGeneratedVideo {
  /** 任务 ID */
  taskId: string;
  /** 视频 URL */
  videoURL?: string;
  /** 状态 */
  status: 'waiting' | 'success' | 'fail';
  /** 错误信息 */
  errorMessage?: string;
  /** 耗时 (毫秒) */
  costTime?: number;
}

/**
 * 获取 Kie API Key
 */
function getKieApiKey(): string {
  const apiKey = process.env.KIE_API_KEY;
  if (!apiKey) {
    throw new Error('KIE_API_KEY environment variable is not set');
  }
  return apiKey;
}

/**
 * 创建视频生成任务
 *
 * @param params 生成参数
 * @returns 任务 ID
 */
export async function createKieVideoTask(params: KieGenerateVideoParams): Promise<string> {
  const apiKey = getKieApiKey();

  console.log('🎬 [Kie Video] Creating task:', {
    prompt: params.prompt.substring(0, 100) + (params.prompt.length > 100 ? '...' : ''),
    aspectRatio: params.aspectRatio,
    resolution: params.resolution,
    duration: params.duration,
    hasImages: params.inputUrls?.length || 0,
  });

  const requestBody = {
    model: 'bytedance/seedance-1.5-pro',
    input: {
      prompt: params.prompt,
      input_urls: params.inputUrls || [],
      aspect_ratio: params.aspectRatio,
      resolution: params.resolution,
      duration: params.duration,
      fixed_lens: params.fixedLens ?? false,
      generate_audio: params.generateAudio ?? false,
    },
  };

  const response = await fetch(`${KIE_API_BASE_URL}/jobs/createTask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ [Kie Video] Create task failed:', response.status, errorText);

    if (response.status === 401) {
      throw new Error('Kie API authentication failed');
    }
    if (response.status === 402) {
      throw new Error('Kie API insufficient balance');
    }
    if (response.status === 422) {
      throw new Error('Kie API parameter validation failed');
    }
    if (response.status === 429) {
      throw new Error('Kie API rate limit exceeded');
    }

    throw new Error(`Kie API error: ${response.status} ${errorText}`);
  }

  const result: KieCreateTaskResponse = await response.json();

  if (result.code !== 200) {
    throw new Error(`Kie API error: ${result.msg}`);
  }

  console.log('✅ [Kie Video] Task created:', result.data.taskId);
  return result.data.taskId;
}

/**
 * 查询任务状态
 *
 * @param taskId 任务 ID
 * @returns 任务状态
 */
export async function getKieTaskStatus(taskId: string): Promise<KieGeneratedVideo> {
  const apiKey = getKieApiKey();

  const response = await fetch(`${KIE_API_BASE_URL}/jobs/recordInfo?taskId=${taskId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Kie API error: ${response.status}`);
  }

  const result: KieTaskStatusResponse = await response.json();

  if (result.code !== 200) {
    throw new Error(`Kie API error: ${result.msg}`);
  }

  const data = result.data;
  let videoURL: string | undefined;

  if (data.state === 'success' && data.resultJson) {
    try {
      const resultData = JSON.parse(data.resultJson);
      videoURL = resultData.resultUrls?.[0];
    } catch {
      console.error('❌ [Kie Video] Failed to parse resultJson:', data.resultJson);
    }
  }

  return {
    taskId: data.taskId,
    videoURL,
    status: data.state,
    errorMessage: data.failMsg || undefined,
    costTime: data.costTime || undefined,
  };
}

/**
 * 轮询等待视频生成完成
 *
 * @param taskId 任务 ID
 * @param maxWaitMs 最大等待时间（毫秒），默认 10 分钟
 * @param pollIntervalMs 轮询间隔（毫秒），默认 10 秒
 * @param onProgress 进度回调
 * @returns 完成的视频信息
 */
export async function waitForKieVideoCompletion(
  taskId: string,
  maxWaitMs: number = 600000,
  pollIntervalMs: number = 10000,
  onProgress?: (progress: number) => Promise<void>
): Promise<KieGeneratedVideo> {
  const startTime = Date.now();
  let pollCount = 0;

  while (Date.now() - startTime < maxWaitMs) {
    pollCount++;

    try {
      const status = await getKieTaskStatus(taskId);

      // 计算进度（30% 到 90%，基于轮询次数和时间）
      const elapsedRatio = Math.min((Date.now() - startTime) / maxWaitMs, 0.9);
      const progress = Math.floor(30 + elapsedRatio * 60);

      if (onProgress) {
        await onProgress(progress);
      }

      console.log(`🔄 [Kie Video] Poll #${pollCount}, status=${status.status}, progress=${progress}%`);

      if (status.status === 'success') {
        console.log('✅ [Kie Video] Video generation completed:', status.videoURL);
        return status;
      }

      if (status.status === 'fail') {
        throw new Error(status.errorMessage || 'Video generation failed');
      }
    } catch (error) {
      // 如果是轮询错误（非失败状态），继续轮询
      if (error instanceof Error && !error.message.includes('Video generation failed')) {
        console.warn(`⚠️ [Kie Video] Poll error (will retry):`, error);
      } else {
        throw error;
      }
    }

    // 等待下一次轮询
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Video generation timeout (exceeded ${maxWaitMs / 1000} seconds)`);
}

/**
 * 生成视频并等待完成
 *
 * @param params 生成参数
 * @param onProgress 进度回调
 * @returns 完成的视频信息
 */
export async function generateKieVideoAndWait(
  params: KieGenerateVideoParams,
  onProgress?: (progress: number) => Promise<void>
): Promise<KieGeneratedVideo> {
  // 1. 创建任务
  const taskId = await createKieVideoTask(params);

  // 2. 轮询等待完成
  return waitForKieVideoCompletion(
    taskId,
    600000, // 10 minutes max
    10000, // 10 seconds interval
    onProgress
  );
}
