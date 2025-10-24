/**
 * 订阅相关类型定义
 */

// 平台类型
export type Platform = 'google' | 'apple' | 'stripe' | 'creem';

// 订阅计划基础模型
export interface SubscriptionPlan {
  id?: string;
  platform: Platform;
  product_id: string;
  base_plan_id?: string;
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
}

// 价格信息
export interface PriceInfo {
  price: number; // 价格（分）
  currency: string; // 货币代码 (USD, CNY, EUR, GBP)
  billing_type: string; // 计费类型 (recurring, one-time)
  billing_period: string; // 计费周期 (every-month, every-year)
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

// Creem 支付验证请求
export interface CreemVerifyRequest {
  request_id?: string;      // 请求 ID (可选)
  checkout_id?: string;     // Checkout ID (可选)
  order_id?: string;        // 订单 ID (可选)
  customer_id?: string;     // 客户 ID (可选)
  subscription_id?: string; // 订阅 ID (可选)
  product_id?: string;      // 产品 ID (可选)
  signature: string;        // Creem 签名 (必填)
}

// Creem 支付验证响应
export interface CreemVerifyResponse {
  checkout_id: string;
  status: SubscriptionStatusType;
  amount: number;          // 金额（分）
  currency: string;        // 货币代码 (USD, EUR, CNY)
  product_id: string;
  created_at: string;
  activated_at?: string;
  verified: boolean;       // 签名验证结果
}

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
