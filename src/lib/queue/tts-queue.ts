/**
 * TTS 任务队列配置 (Vercel Queue)
 */
import { Queue } from '@vercel/blob';

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

// 创建 TTS 处理队列
export const ttsQueue = new Queue<TtsQueuePayload>({
  name: 'tts-processing',
});