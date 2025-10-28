import { apiClient } from './client';
import type { Voice } from '@/types/voice';

/**
 * 语音相关 API
 */

// 获取语音列表
export const getVoices = async (params?: {
  provider?: string;
  country?: string;
  language?: string;
  locale?: string;
  role?: string;
  gender?: string;
  is_active?: boolean;
  limit?: number;
}): Promise<Voice[]> => {
  return await apiClient.get<Voice[]>('/api/v1/voices', { params }) as Voice[];
};

// 创建语音模型
export const createVoice = (data: unknown) => {
  return apiClient.post('/api/v1/voices', data);
};