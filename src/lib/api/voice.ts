import { apiClient } from './client';

/**
 * 语音相关 API
 */

// 获取语音列表
export const getVoices = (params?: {
  provider?: string;
  country?: string;
  language?: string;
  locale?: string;
  role?: string;
  gender?: string;
  is_active?: boolean;
  limit?: number;
}) => {
  return apiClient.get('/api/v1/voices', { params });
};

// 创建语音模型
export const createVoice = (data: unknown) => {
  return apiClient.post('/api/v1/voices', data);
};