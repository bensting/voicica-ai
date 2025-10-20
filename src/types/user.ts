/**
 * 用户相关类型定义
 */

// 用户资料 - 与后端 UserProfileResponse 保持一致
export interface UserProfile {
  id: string;
  email: string | null;
  name: string | null;
  photo_url: string | null;
  credits: number;
  total_credits_used: number;
  subscription_status: string;
  active_subscription_id: string | null;
}

// 用户更新请求
export interface UserUpdateRequest {
  name?: string;
  photo_url?: string;
}