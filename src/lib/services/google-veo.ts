/**
 * Google Vertex AI Veo Video Generation Service
 * https://cloud.google.com/vertex-ai/generative-ai/docs/video/generate-videos-from-text
 *
 * 使用 Veo 3.1 模型生成视频
 */

import { VideoResolution } from '@/config/creditsCost';

/** Veo 支持的时长（秒） */
export type VeoDuration = 4 | 6 | 8;

/** Veo 支持的宽高比 */
export type VeoAspectRatio = '16:9' | '9:16';

/** Veo 支持的分辨率 */
export type VeoResolution = '720p' | '1080p';

/** Veo 模型 ID */
export type VeoModel =
  | 'veo-3.1-generate-001'
  | 'veo-3.1-fast-generate-001'
  | 'veo-3.0-generate-001'
  | 'veo-3.0-fast-generate-001'
  | 'veo-2.0-generate-001';

/** 文字转视频请求参数 */
export interface VeoTextToVideoRequest {
  /** 视频描述提示词 */
  prompt: string;
  /** 负面提示词（可选） */
  negativePrompt?: string;
  /** 视频时长（秒），Veo 3 支持 4, 6, 8 */
  duration?: VeoDuration;
  /** 宽高比，默认 16:9 */
  aspectRatio?: VeoAspectRatio;
  /** 分辨率，默认 720p，Veo 3 支持 1080p */
  resolution?: VeoResolution;
  /** 随机种子（0-4294967295） */
  seed?: number;
  /** 是否生成音频（Veo 3 支持） */
  generateAudio?: boolean;
  /** 模型 ID */
  model?: VeoModel;
}

/** 视频生成操作状态 */
export interface VeoOperationStatus {
  /** 操作名称 */
  name: string;
  /** 是否完成 */
  done: boolean;
  /** 错误信息（如果失败） */
  error?: {
    code: number;
    message: string;
    details?: unknown[];
  };
  /** 响应结果（如果成功） */
  response?: {
    videos: Array<{
      /** GCS 存储路径 */
      gcsUri?: string;
      /** Base64 编码的视频数据 */
      bytesBase64Encoded?: string;
      /** MIME 类型 */
      mimeType: string;
    }>;
  };
}

/** 视频生成结果 */
export interface VeoGenerationResult {
  /** 操作 ID */
  operationId: string;
  /** 操作完整名称 */
  operationName: string;
}

/** 视频完成结果 */
export interface VeoCompletedResult {
  /** 视频数据 Buffer */
  videoData: Buffer;
  /** MIME 类型 */
  mimeType: string;
  /** GCS URI（如果存储在 GCS） */
  gcsUri?: string;
}

// Google Cloud 配置
const VERTEX_AI_LOCATION = 'us-central1';
const DEFAULT_MODEL: VeoModel = 'veo-3.1-generate-001';

/**
 * 获取 Google Cloud Access Token
 * 使用 Service Account JSON 进行认证
 */
async function getAccessToken(): Promise<string> {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON 未配置');
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    const { client_email, private_key } = serviceAccount;

    if (!client_email || !private_key) {
      throw new Error('Service Account JSON 缺少必要字段');
    }

    // 创建 JWT
    const now = Math.floor(Date.now() / 1000);
    const header = {
      alg: 'RS256',
      typ: 'JWT',
    };
    const payload = {
      iss: client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    };

    // Base64URL 编码
    const base64UrlEncode = (obj: object) => {
      const json = JSON.stringify(obj);
      const base64 = Buffer.from(json).toString('base64');
      return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    };

    const headerEncoded = base64UrlEncode(header);
    const payloadEncoded = base64UrlEncode(payload);
    const signatureInput = `${headerEncoded}.${payloadEncoded}`;

    // 使用 crypto 签名
    const crypto = await import('crypto');
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(signatureInput);
    const signature = sign.sign(private_key, 'base64');
    const signatureEncoded = signature.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    const jwt = `${signatureInput}.${signatureEncoded}`;

    // 交换 access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`获取 access token 失败: ${tokenResponse.status} - ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON 格式无效');
    }
    throw error;
  }
}

/**
 * 获取 Vertex AI API 基础 URL
 */
function getVertexAiBaseUrl(projectId: string, model: VeoModel): string {
  return `https://${VERTEX_AI_LOCATION}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${VERTEX_AI_LOCATION}/publishers/google/models/${model}`;
}

/**
 * 提交视频生成任务（异步操作）
 *
 * @returns 操作 ID，用于后续轮询状态
 */
export async function submitVideoGeneration(
  request: VeoTextToVideoRequest
): Promise<VeoGenerationResult> {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;

  if (!projectId) {
    throw new Error('GOOGLE_CLOUD_PROJECT_ID 未配置');
  }

  const accessToken = await getAccessToken();
  const model = request.model || DEFAULT_MODEL;
  const baseUrl = getVertexAiBaseUrl(projectId, model);

  const requestBody = {
    instances: [
      {
        prompt: request.prompt,
      },
    ],
    parameters: {
      aspectRatio: request.aspectRatio || '16:9',
      durationSeconds: request.duration || 8,
      resolution: request.resolution || '720p',
      sampleCount: 1, // 每次只生成 1 个视频
      ...(request.negativePrompt && { negativePrompt: request.negativePrompt }),
      ...(request.seed !== undefined && { seed: request.seed }),
      ...(request.generateAudio !== undefined && { generateAudio: request.generateAudio }),
      personGeneration: 'allow_adult',
    },
  };

  console.log(`🎬 [Veo] 提交视频生成任务, model=${model}, prompt="${request.prompt.substring(0, 50)}..."`);

  const response = await fetch(`${baseUrl}:predictLongRunning`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ [Veo] 提交任务失败: ${response.status} - ${errorText}`);
    throw new Error(`Veo API 调用失败: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  // 从 operation name 中提取 operation ID
  // 格式: projects/PROJECT_ID/locations/LOCATION/publishers/google/models/MODEL_ID/operations/OPERATION_ID
  const operationName: string = data.name;
  const operationId = operationName.split('/').pop() || '';

  console.log(`✅ [Veo] 任务已提交, operationId=${operationId}`);

  return {
    operationId,
    operationName,
  };
}

/**
 * 查询视频生成操作状态
 */
export async function fetchOperationStatus(
  operationName: string,
  model?: VeoModel
): Promise<VeoOperationStatus> {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;

  if (!projectId) {
    throw new Error('GOOGLE_CLOUD_PROJECT_ID 未配置');
  }

  const accessToken = await getAccessToken();
  const modelId = model || DEFAULT_MODEL;
  const baseUrl = getVertexAiBaseUrl(projectId, modelId);

  const response = await fetch(`${baseUrl}:fetchPredictOperation`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      operationName,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`查询操作状态失败: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * 等待视频生成完成（轮询）
 *
 * @param operationName 操作名称
 * @param model 模型 ID
 * @param maxWaitMs 最大等待时间（毫秒），默认 10 分钟
 * @param pollIntervalMs 轮询间隔（毫秒），默认 10 秒
 * @param onProgress 进度回调
 */
export async function waitForCompletion(
  operationName: string,
  model?: VeoModel,
  maxWaitMs: number = 600000,
  pollIntervalMs: number = 10000,
  onProgress?: (progress: number) => Promise<void>
): Promise<VeoCompletedResult> {
  const startTime = Date.now();
  let pollCount = 0;

  while (Date.now() - startTime < maxWaitMs) {
    pollCount++;
    const status = await fetchOperationStatus(operationName, model);

    // 计算进度（30% 到 90%，基于轮询次数和时间）
    const elapsedRatio = Math.min((Date.now() - startTime) / maxWaitMs, 0.9);
    const progress = Math.floor(30 + elapsedRatio * 60);

    if (onProgress) {
      await onProgress(progress);
    }

    console.log(`🔄 [Veo] 轮询 #${pollCount}, done=${status.done}, progress=${progress}%`);

    if (status.done) {
      // 检查错误
      if (status.error) {
        throw new Error(`视频生成失败: ${status.error.message}`);
      }

      // 获取视频数据
      const videos = status.response?.videos;
      if (!videos || videos.length === 0) {
        throw new Error('视频生成完成但未返回视频数据');
      }

      const video = videos[0];

      // 如果返回的是 base64 编码的视频
      if (video.bytesBase64Encoded) {
        return {
          videoData: Buffer.from(video.bytesBase64Encoded, 'base64'),
          mimeType: video.mimeType,
        };
      }

      // 如果返回的是 GCS URI，需要下载视频
      if (video.gcsUri) {
        const videoData = await downloadFromGcs(video.gcsUri);
        return {
          videoData,
          mimeType: video.mimeType,
          gcsUri: video.gcsUri,
        };
      }

      throw new Error('视频响应格式无效');
    }

    // 等待下一次轮询
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`视频生成超时（超过 ${maxWaitMs / 1000} 秒）`);
}

/**
 * 从 GCS 下载视频
 */
async function downloadFromGcs(gcsUri: string): Promise<Buffer> {
  const accessToken = await getAccessToken();

  // 解析 GCS URI: gs://bucket/path/to/file
  const match = gcsUri.match(/^gs:\/\/([^/]+)\/(.+)$/);
  if (!match) {
    throw new Error(`无效的 GCS URI: ${gcsUri}`);
  }

  const [, bucket, objectPath] = match;
  const encodedPath = encodeURIComponent(objectPath);
  const downloadUrl = `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodedPath}?alt=media`;

  console.log(`📥 [Veo] 从 GCS 下载视频: ${gcsUri}`);

  const response = await fetch(downloadUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`从 GCS 下载失败: ${response.status} - ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * 将前端分辨率配置转换为 Veo 分辨率
 */
export function toVeoResolution(resolution: VideoResolution): VeoResolution {
  switch (resolution) {
    case '768p':
      return '720p'; // Veo 最低支持 720p
    case '1080p':
      return '1080p';
    default:
      return '720p';
  }
}

/**
 * 将前端时长配置转换为 Veo 时长
 * Veo 3 支持 4, 6, 8 秒
 */
export function toVeoDuration(duration: number): VeoDuration {
  if (duration <= 4) return 4;
  if (duration <= 6) return 6;
  return 8;
}