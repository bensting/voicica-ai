/**
 * TTS 任务队列配置
 */

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

/**
 * 简化的队列实现
 * 本地开发：直接 HTTP 调用
 * 生产环境：通过 Vercel 后台任务
 */
export const ttsQueue = {
  async enqueue(payload: TtsQueuePayload): Promise<void> {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const baseUrl = isDevelopment
      ? 'http://localhost:3000'
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'https://voicica.ai';

    // 异步调用处理函数（不等待结果）
    fetch(`${baseUrl}/api/queue/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch((err) => {
      console.error('[Queue] 调用失败:', err);
    });
  }
};