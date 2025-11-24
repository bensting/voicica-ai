/**
 * 订阅相关类型定义
 */

// 平台类型
export type Platform = 'google' | 'apple' | 'stripe';

// 计费周期类型
export type BillingPeriod = 'week' | 'month' | 'year';
export type BillingCycle = 'weekly' | 'monthly' | 'yearly';

// 积分档位配置
export interface CreditTier {
  credits: number;
  price: {
    USD: number;
    CNY?: number;
    TWD?: number;
    THB?: number;
  };
  discounted_price?: {
    USD: number;
    CNY?: number;
    TWD?: number;
    THB?: number;
  };
  product_id?: string;
  // 是否为默认选中的档位
  default?: boolean;
}

// 前端使用的计划展示类型
export interface PricingPlan {
  id: string;
  platform: string;
  plan_name: string; // 计划名称 (Starter, Creator, Pro)
  display_name: Record<string, string>;
  billing_period: BillingPeriod;
  cycle_days: number;
  credit_tiers: CreditTier[]; // 每个档位包含 product_id
  enable_first_month_coupon?: boolean;
  first_month_coupon_label?: Record<string, string>;
  is_popular?: boolean;
  active: boolean;
  sort_order: number;
}

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
