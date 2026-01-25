/**
 * Video 任务队列配置 - 使用 Upstash QStash
 */
import { Client } from '@upstash/qstash';
import type { VideoResolution, VideoDuration } from '@/config/creditsCost';

/** Video 任务队列负载 */
export interface VideoQueuePayload {
  taskId: string;
  userId: string;
  /** 视频描述提示词 */
  prompt: string;
  /** 负面提示词 */
  negativePrompt?: string;
  /** 分辨率 */
  resolution: VideoResolution;
  /** 时长（秒） */
  duration: VideoDuration;
  /** 宽高比 */
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3' | '3:4' | '21:9';
  /** 模型 */
  model: string;
  /** 随机种子 */
  seed?: number;
  /** 积分消耗 */
  creditsCost: number;
  /** 是否匿名用户 */
  isAnonymous: boolean;
  /** 起始帧图片 (base64 data URL 或 URL) */
  startFrame?: string;
  /** 结束帧图片 (base64 data URL) - 仅部分模型支持 */
  endFrame?: string;
  /** 多图模式下的参考图片数组 (base64 data URL) */
  images?: string[];
  /** 固定镜头 - Seedance 模型专用 */
  fixedLens?: boolean;
  /** 生成音频 - Seedance 模型专用 */
  generateAudio?: boolean;
}

// 初始化 QStash 客户端
const getQStashClient = () => {
  const token = process.env.QSTASH_TOKEN;
  if (!token) {
    console.warn('[VideoQueue] QSTASH_TOKEN 未配置，使用 fallback HTTP 调用');
    return null;
  }
  return new Client({ token });
};

/**
 * Video 任务队列实现
 * 生产环境：使用 Upstash QStash（真正的后台队列）
 * 开发环境：使用 HTTP 调用（方便本地测试）
 */
export const videoQueue = {
  async enqueue(payload: VideoQueuePayload): Promise<void> {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const qstashClient = getQStashClient();

    // 生产环境 + QStash 配置：使用 QStash
    if (!isDevelopment && qstashClient) {
      try {
        console.log('[VideoQueue] 📤 使用 QStash 提交任务:', payload.taskId);

        const callbackUrl = `https://${process.env.QSTASH_NEXT_CALL_BACK_URL || 'voicica.ai'}/api/queue/video`;

        const result = await qstashClient.publishJSON({
          url: callbackUrl,
          body: payload,
          retries: 2, // 失败重试 2 次
        });

        console.log('[VideoQueue] ✅ QStash 任务已提交:', {
          messageId: result.messageId,
          taskId: payload.taskId,
        });

        return;
      } catch (err) {
        console.error('[VideoQueue] ❌ QStash 提交失败:', err);
        throw err;
      }
    }

    // 开发环境或 QStash 未配置：使用 HTTP fallback
    console.log('[VideoQueue] 📤 使用 HTTP 调用提交任务:', payload.taskId);
    const baseUrl = isDevelopment ? 'http://localhost:3000' : 'https://voicica.ai';

    // 异步触发（不等待完成）
    setTimeout(() => {
      fetch(`${baseUrl}/api/queue/video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then((response) => {
          if (response.ok) {
            console.log('[VideoQueue] ✅ HTTP 队列请求成功:', payload.taskId);
          } else {
            console.error('[VideoQueue] ❌ HTTP 队列请求失败:', response.status);
          }
        })
        .catch((err) => {
          console.error('[VideoQueue] ❌ HTTP 队列调用异常:', err);
        });
    }, 0);

    console.log('[VideoQueue] ⚡ 任务已提交（HTTP fallback），立即返回');
  },
};