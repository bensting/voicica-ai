/**
 * 订阅相关类型定义
 */

// 平台类型
export type Platform = 'google' | 'apple' | 'stripe';

// 订阅计划基础模型
export interface SubscriptionPlan {
  id: number | string;
  platform: string;
  product_type?: string;
  product_id: string;
  base_plan_id?: string | null;
  plan_name: string; // 计划名称 (Free, Basic, Premium, Plus)
  payment_link?: string;
  display_name: Record<string, string>;
  features: Record<string, string[]>;
  credits_per_cycle: number;
  cycle_days: number;
  active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
  // 价格字段（后端直接返回，key 为货币代码，value 为价格）
  price?: Record<string, number>; // 例如: { "CNY": 34, "TWD": 149, "USD": 4.99 }
  discounted_price?: Record<string, number>; // 折扣价格
  billing_period?: string; // 计费周期
  enable_first_month_coupon?: boolean;
  first_month_coupon_id?: string | null;
}

// 计费周期枚举（与后端保持一致）
export type BillingPeriod = 'month' | 'year' | 'one_time';

// 价格信息
export interface PriceInfo {
  price: number; // 价格（分）
  currency: string; // 货币代码 (USD, CNY, EUR, GBP)
  billing_type: string; // 计费类型 (recurring, one-time)
  billing_period: BillingPeriod; // 计费周期 (month, year, one_time)
}

// 前端使用的计划展示类型（包含价格信息）
export interface PricingPlan extends SubscriptionPlan {
  priceInfo?: PriceInfo; // 价格信息（可选，Free 计划没有价格）
}

// 计费周期类型
export type BillingCycle = 'monthly' | 'yearly';

// 订阅状态枚举 - 与后端保持一致
export enum SubscriptionStatus {
  PENDING = 'pending',     // 待激活 (支付中)
  ACTIVE = 'active',       // 活跃中
  EXPIRED = 'expired',     // 已过期
  CANCELLED = 'cancelled', // 已取消
  REFUNDED = 'refunded',   // 已退款
}

// 订阅状态类型
export type SubscriptionStatusType =
  | SubscriptionStatus.PENDING
  | SubscriptionStatus.ACTIVE
  | SubscriptionStatus.EXPIRED
  | SubscriptionStatus.CANCELLED
  | SubscriptionStatus.REFUNDED;

// Stripe 支付验证请求
export interface StripeVerifyRequest {
  request_id: string;      // Stripe Checkout Request ID（必填）
}

// Stripe 支付验证响应
export interface StripeVerifyResponse {
  success: boolean;        // 验证是否成功
  payment_status: string;  // 支付状态 (paid, unpaid, pending, no_payment_required)
  subscription_id?: string; // 订阅记录 ID（如果已创建）
  message: string;         // 验证消息
}

// 用户订阅信息
export interface UserSubscription {
  id: string;
  user_id: string;
  subscription_plan_id?: string;
  product_id: string;
  product_type: string | null;
  platform: string | null;
  status: string;
  start_date: string;
  end_date: string;
  credits_allocated: number;
  amount?: number;
  currency?: string;
  auto_renew: boolean;
  created_at: string;
  display_name?: Record<string, string> | null; // 多语言显示名称 { "en": "Basic Plan", "zh-CN": "基础套餐" }
  is_active: boolean;
  days_remaining?: number | null;
  external_subscription_id?: string | null; // Stripe 订阅 ID
}

// 用户订阅列表响应
export interface UserSubscriptionListResponse {
  subscriptions: UserSubscription[];
  total: number;
  active_subscription: UserSubscription | null;
}
