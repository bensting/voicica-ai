/**
 * 扩展 CloudflareEnv 接口，添加项目自定义的 Cloudflare 绑定
 */

interface TtsQueueMessage {
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

declare global {
  interface CloudflareEnv {
    DB: D1Database;
    TTS_QUEUE: Queue<TtsQueueMessage>;
    QUEUE_CONSUMER_SECRET: string;
  }
}

export {};
