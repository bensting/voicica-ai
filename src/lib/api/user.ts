import { apiClient } from './client';
import type { UserProfile, UserUpdateRequest } from '@/types/user';

/**
 * 用户相关 API
 */

// 获取当前用户资料
export const getCurrentUser = (): Promise<UserProfile> => {
  return apiClient.get<UserProfile>('/api/v1/users/me');
};

// 更新用户资料
export const updateProfile = (data: UserUpdateRequest): Promise<UserProfile> => {
  return apiClient.put<UserProfile>('/api/v1/users/me', data);
};

// 获取用户积分
export const getCredits = (): Promise<{ credits: number }> => {
  return apiClient.get<{ credits: number }>('/api/v1/users/me/credits');
};