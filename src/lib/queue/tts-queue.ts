/**
 * TTS 任务队列配置 - 使用 Upstash QStash
 */
import { Client } from '@upstash/qstash';

// TTS 任务队列负载
export interface TtsQueuePayload {
  taskId: string;
  userId: string;
  text: string;
  voiceName: string;
  language?: string;
  style?: string;
  speed?: number;
  pitch?: number;
  volume?: number;
  creditsCost: number;
  isAnonymous: boolean;
}

// 初始化 QStash 客户端
const getQStashClient = () => {
  const token = process.env.QSTASH_TOKEN;
  if (!token) {
    console.warn('[Queue] QSTASH_TOKEN 未配置，使用 fallback HTTP 调用');
    return null;
  }
  return new Client({ token });
};

/**
 * TTS 任务队列实现
 * 生产环境：使用 Upstash QStash（真正的后台队列）
 * 开发环境：使用 HTTP 调用（方便本地测试）
 */
export const ttsQueue = {
  async enqueue(payload: TtsQueuePayload): Promise<void> {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const qstashClient = getQStashClient();

    // 生产环境 + QStash 配置：使用 QStash
    if (!isDevelopment && qstashClient) {
      try {
        console.log('[Queue] 📤 使用 QStash 提交任务:', payload.taskId);

        const callbackUrl = `https://${process.env.VERCEL_URL || 'voicica.ai'}/api/queue/tts`;

        const result = await qstashClient.publishJSON({
          url: callbackUrl,
          body: payload,
          retries: 2, // 失败重试 2 次
        });

        console.log('[Queue] ✅ QStash 任务已提交:', {
          messageId: result.messageId,
          taskId: payload.taskId,
        });

        return;
      } catch (err) {
        console.error('[Queue] ❌ QStash 提交失败:', err);
        throw err;
      }
    }

    // 开发环境或 QStash 未配置：使用 HTTP fallback
    console.log('[Queue] 📤 使用 HTTP 调用提交任务:', payload.taskId);
    const baseUrl = isDevelopment ? 'http://localhost:3000' : 'https://voicica.ai';

    // 异步触发（不等待完成）
    setTimeout(() => {
      fetch(`${baseUrl}/api/queue/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then((response) => {
          if (response.ok) {
            console.log('[Queue] ✅ HTTP 队列请求成功:', payload.taskId);
          } else {
            console.error('[Queue] ❌ HTTP 队列请求失败:', response.status);
          }
        })
        .catch((err) => {
          console.error('[Queue] ❌ HTTP 队列调用异常:', err);
        });
    }, 0);

    console.log('[Queue] ⚡ 任务已提交（HTTP fallback），立即返回');
  }
};