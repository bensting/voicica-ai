/**
 * 订阅计划配置类型定义
 */

// 支持的平台
export type Platform = 'stripe' | 'google' | 'apple';

// 计费周期
export type BillingPeriod = 'week' | 'month' | 'year';

// 计划名称
export type PlanName = 'Mini' | 'Starter' | 'Creator' | 'Pro';

/**
 * 积分档位配置
 */
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
  // 每个档位可以有不同的 Stripe Product ID
  product_id?: string;
  // 是否为默认选中的档位
  default?: boolean;
  // 功能列表（多语言）- 每个档位可以有不同的功能
  features?: Array<{
    en: string;
    'zh-CN': string;
    'zh-TW': string;
    'th-TH'?: string;
    'my-MM'?: string;
    'id-ID'?: string;
  }>;
}

/**
 * 订阅计划配置
 */
export interface SubscriptionPlanConfig {
  // 基础信息
  id: string; // 唯一标识符，格式: {platform}_{plan_name}
  platform: Platform;
  plan_name: PlanName;

  // 显示信息（多语言）
  display_name: {
    en: string;
    'zh-CN': string;
    'zh-TW': string;
    'th-TH'?: string;
    'my-MM'?: string;
    'id-ID'?: string;
  };

  // 计费周期
  billing_period: BillingPeriod;
  cycle_days: number; // 周期天数 (7 = 周, 30 = 月, 365 = 年)

  // 积分档位（必填，每个档位包含积分数、价格和 product_id）
  credit_tiers: CreditTier[];

  // 首月优惠
  enable_first_month_coupon?: boolean;
  first_month_coupon_label?: {
    en: string;
    'zh-CN': string;
    'zh-TW': string;
    'th-TH'?: string;
    'my-MM'?: string;
    'id-ID'?: string;
  };

  // 状态
  active: boolean;
  sort_order: number;

  // 推荐标签（如 "最受欢迎"）
  is_popular?: boolean;

  // 功能列表（多语言）
  features?: Array<{
    en: string;
    'zh-CN': string;
    'zh-TW': string;
    'th-TH'?: string;
    'my-MM'?: string;
  }>;
}

/**
 * 按平台组织的计划配置（统一订阅方案）
 */
export interface SubscriptionPlansConfig {
  stripe: SubscriptionPlanConfig[];
  google?: SubscriptionPlanConfig[];
  apple?: SubscriptionPlanConfig[];
}
