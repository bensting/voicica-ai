/**
 * 用户相关类型定义
 */

// 用户资料 - 与后端 UserProfileResponse 保持一致
export interface UserProfile {
  id: number | string; // 数据库主键（int）或业务主键（str）
  user_id: string; // 业务主键（Firebase UID 或 anonymous_xxx）
  email: string | null;
  name: string | null;
  photo_url: string | null;
  phone: string | null; // 电话号码（含国家代码）
  credits: number; // 永久积分（购买、注册赠送，永不过期）
  monthly_credits: number; // 当月积分（每日任务，月初重置）
  // 总可用积分 = credits + monthly_credits
  total_credits_used: number;

  // 用户类型标识
  is_anonymous: boolean; // 是否为匿名用户

  // 匿名用户专属字段
  expires_at: string | null; // 过期时间（仅匿名用户，ISO 8601 格式）
}

// 用户更新请求
export interface UserUpdateRequest {
  name?: string;
  photo_url?: string;
}

// 积分信息
export interface CreditsInfo {
  credits: number; // 永久积分（购买、注册赠送）
  monthly_credits: number; // 当月积分（每日任务）
  // 总可用积分 = credits + monthly_credits
  total_used: number;
  is_anonymous: boolean;
  expires_at: string | null;
}

// 积分历史记录
export interface CreditHistoryItem {
  id: number;
  amount: number;
  description: string;
  product_type: string | null;
  task_id: string | null;
  created_at: string;
}

// 积分历史响应
export interface CreditHistoryResponse {
  items: CreditHistoryItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}