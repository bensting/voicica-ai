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

    // 调用队列处理函数
    try {
      const response = await fetch(`${baseUrl}/api/queue/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[Queue] 队列调用失败:', response.status, error);
        throw new Error(`Queue call failed: ${response.status}`);
      }

      console.log('[Queue] ✅ 任务已提交到队列:', payload.taskId);
    } catch (err) {
      console.error('[Queue] ❌ 调用失败:', err);
      throw err; // 向上抛出错误，让调用方知道失败了
    }
  }
};