/**
 * 订阅计划配置类型定义
 */

// 支持的平台
export type Platform = 'stripe' | 'google' | 'apple';

// 产品类型
export type ProductType = 'text_to_speech' | 'voice_cloning';

// 计费周期
export type BillingPeriod = 'month' | 'year';

// 计划名称
export type PlanName = 'Free' | 'Basic' | 'Premium' | 'Plus';

/**
 * 订阅计划配置
 */
export interface SubscriptionPlanConfig {
  // 基础信息
  id: string; // 唯一标识符，格式: {platform}_{product_type}_{plan_name}
  platform: Platform;
  product_type: ProductType;
  plan_name: PlanName;

  // Stripe/Google/Apple 产品标识
  product_id: string; // Stripe Product ID 或 Google/Apple 产品 ID
  base_plan_id?: string | null; // Google Play 基础计划 ID

  // 显示信息（多语言）
  display_name: {
    en: string;
    'zh-CN': string;
    'zh-TW': string;
    'th-TH'?: string;
  };

  // 功能列表（多语言）
  features: {
    en: string[];
    'zh-CN': string[];
    'zh-TW': string[];
    'th-TH'?: string[];
  };

  // 积分和周期
  credits_per_cycle: number; // 每周期给予的积分
  cycle_days: number; // 周期天数 (30 = 月, 365 = 年)

  // 价格（多币种）
  price: {
    USD: number;
    CNY: number;
    TWD: number;
    THB?: number;
  };

  // 折扣价格（可选）
  discounted_price?: {
    USD: number;
    CNY: number;
    TWD: number;
    THB?: number;
  };

  // 计费周期
  billing_period?: BillingPeriod;

  // 首月优惠
  enable_first_month_coupon?: boolean;
  first_month_coupon_id?: string | null;

  // 状态
  active: boolean;
  sort_order: number;
}

/**
 * 按平台和产品类型组织的计划配置
 */
export interface SubscriptionPlansConfig {
  stripe: {
    text_to_speech: SubscriptionPlanConfig[];
    voice_cloning: SubscriptionPlanConfig[];
  };
  google?: {
    text_to_speech: SubscriptionPlanConfig[];
    voice_cloning: SubscriptionPlanConfig[];
  };
  apple?: {
    text_to_speech: SubscriptionPlanConfig[];
    voice_cloning: SubscriptionPlanConfig[];
  };
}
