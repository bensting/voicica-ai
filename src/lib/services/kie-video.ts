/**
 * Kie.ai Video Generation Service
 *
 * AI 视频生成服务，支持 Seedance 1.5 Pro 模型
 * 采用和 Music 相同的异步模式：提交任务 -> Webhook回调/前端轮询
 *
 * 文档: https://kie.ai/seedance-1-5-pro
 */

const KIE_API_BASE_URL = 'https://api.kie.ai/api/v1';

/**
 * KIE API 错误码定义
 *
 * 致命错误（任务失败）:
 * - 401: Unauthorized - 认证失败
 * - 402: Insufficient Credits - 余额不足
 * - 404: Not Found - 资源不存在
 * - 422: Validation Error - 参数验证失败
 * - 501: Generation Failed - 生成失败
 * - 505: Feature Disabled - 功能禁用
 *
 * 可重试错误（继续等待）:
 * - 429: Rate Limited - 限流
 * - 455: Service Unavailable - 服务维护中
 * - 500: Server Error - 服务器错误
 */
const FATAL_ERROR_CODES = [401, 402, 404, 422, 501, 505];

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
  /** 回调 URL (可选) */
  callBackUrl?: string;
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
 * 视频任务状态结果（不抛异常，返回状态对象）
 */
export interface KieVideoTaskStatus {
  /** 状态 */
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILURE';
  /** 进度 0-100 */
  progress: number;
  /** 视频 URL（成功时） */
  videoUrl?: string;
  /** 错误信息 */
  error?: string;
  /** 耗时（毫秒） */
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
 * @returns 外部任务 ID
 * @throws Error 如果创建失败
 */
export async function createKieVideoTask(params: KieGenerateVideoParams): Promise<string> {
  const apiKey = getKieApiKey();

  console.log('🎬 [Kie Video] Creating task:', {
    prompt: params.prompt.substring(0, 100) + (params.prompt.length > 100 ? '...' : ''),
    aspectRatio: params.aspectRatio,
    resolution: params.resolution,
    duration: params.duration,
    hasImages: params.inputUrls?.length || 0,
    hasCallbackUrl: !!params.callBackUrl,
  });

  // 构建 input 对象，只有在有图片时才包含 input_urls
  const inputParams: Record<string, unknown> = {
    prompt: params.prompt,
    aspect_ratio: params.aspectRatio,
    resolution: params.resolution,
    duration: params.duration,
    fixed_lens: params.fixedLens ?? false,
    generate_audio: params.generateAudio ?? false,
  };

  // 只有在有图片 URL 时才添加 input_urls 参数
  if (params.inputUrls && params.inputUrls.length > 0) {
    inputParams.input_urls = params.inputUrls;
  }

  const requestBody: Record<string, unknown> = {
    model: 'bytedance/seedance-1.5-pro',
    input: inputParams,
  };

  // 添加回调 URL（如果提供）
  if (params.callBackUrl) {
    requestBody.callBackUrl = params.callBackUrl;
  }

  const response = await fetch(`${KIE_API_BASE_URL}/jobs/createTask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  // 解析响应
  const result: KieCreateTaskResponse = await response.json().catch(() => ({
    code: response.status,
    msg: `HTTP ${response.status}`,
    data: { taskId: '' },
  }));

  console.log(`🎬 [Kie Video] Create task response: code=${result.code}, msg=${result.msg}`);

  if (result.code !== 200) {
    const errorMsg = result.msg || `Error code: ${result.code}`;
    console.error(`❌ [Kie Video] Create task failed: ${errorMsg}`);
    throw new Error(errorMsg);
  }

  console.log('✅ [Kie Video] Task created:', result.data.taskId);
  return result.data.taskId;
}

/**
 * 查询 KIE API 视频任务状态（不抛异常，返回状态对象）
 *
 * 和 Music 的 queryKieTaskStatus 保持一致的模式
 *
 * @param externalTaskId KIE 外部任务 ID
 * @returns 任务状态对象
 */
export async function queryKieVideoTaskStatus(externalTaskId: string): Promise<KieVideoTaskStatus> {
  try {
    const apiKey = getKieApiKey();

    const response = await fetch(`${KIE_API_BASE_URL}/jobs/recordInfo?taskId=${externalTaskId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const result: KieTaskStatusResponse = await response.json().catch(() => ({
      code: response.status,
      msg: `HTTP ${response.status}`,
      data: null as unknown as KieTaskStatusResponse['data'],
    }));

    console.log(`🎬 [Kie Video] Task status response: code=${result.code}, state=${result.data?.state}`);

    // 处理非 200 状态码
    if (result.code !== 200) {
      const errorMsg = result.msg || `Error code: ${result.code}`;

      // 致命错误 - 返回失败状态
      if (FATAL_ERROR_CODES.includes(result.code)) {
        console.error(`❌ [Kie Video] Fatal error (${result.code}): ${errorMsg}`);
        return {
          status: 'FAILURE',
          progress: 0,
          error: errorMsg,
        };
      }

      // 可重试错误 - 返回处理中状态（继续等待）
      console.warn(`⚠️ [Kie Video] Retryable error (${result.code}): ${errorMsg}`);
      return {
        status: 'PROCESSING',
        progress: 30,
        error: errorMsg,
      };
    }

    const data = result.data;

    // 成功状态
    if (data.state === 'success') {
      let videoUrl: string | undefined;
      if (data.resultJson) {
        try {
          const resultData = JSON.parse(data.resultJson);
          videoUrl = resultData.resultUrls?.[0];
        } catch {
          console.error('❌ [Kie Video] Failed to parse resultJson:', data.resultJson);
        }
      }

      return {
        status: 'SUCCESS',
        progress: 100,
        videoUrl,
        costTime: data.costTime || undefined,
      };
    }

    // 失败状态
    if (data.state === 'fail') {
      return {
        status: 'FAILURE',
        progress: 0,
        error: data.failMsg || 'Video generation failed',
      };
    }

    // 等待中（waiting）
    return {
      status: 'PROCESSING',
      progress: 50, // KIE 没有返回具体进度，给一个中间值
    };
  } catch (error) {
    console.error('❌ [Kie Video] Query task status error:', error);
    // 网络错误等，返回处理中状态（让前端继续轮询）
    return {
      status: 'PROCESSING',
      progress: 30,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
