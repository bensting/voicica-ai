/**
 * 订阅计划配置统一入口
 *
 * 根据环境变量自动选择开发或生产配置
 */

import { subscriptionPlans as devPlans } from './plans.development';
import { subscriptionPlans as prodPlans } from './plans.production';
import type { SubscriptionPlanConfig, SubscriptionPlansConfig, Platform, ProductType } from './types';

// 根据环境选择配置
const isProduction = process.env.NODE_ENV === 'production';
export const subscriptionPlans: SubscriptionPlansConfig = isProduction ? prodPlans : devPlans;

// 导出类型
export type { SubscriptionPlanConfig, SubscriptionPlansConfig, Platform, ProductType };
export type { PlanName, BillingPeriod } from './types';

/**
 * 获取指定平台和产品类型的订阅计划列表
 */
export function getPlans(
  platform: Platform,
  productType: ProductType,
  activeOnly: boolean = true
): SubscriptionPlanConfig[] {
  const platformPlans = subscriptionPlans[platform];
  if (!platformPlans) {
    return [];
  }

  const plans = platformPlans[productType] || [];

  if (activeOnly) {
    return plans.filter((plan) => plan.active);
  }

  return plans;
}

/**
 * 根据 Product ID 获取订阅计划
 */
export function getPlanByProductId(productId: string): SubscriptionPlanConfig | null {
  // 遍历所有平台和产品类型
  for (const platform of Object.keys(subscriptionPlans) as Platform[]) {
    const platformPlans = subscriptionPlans[platform];
    if (!platformPlans) continue;

    for (const productType of Object.keys(platformPlans) as ProductType[]) {
      const plans = platformPlans[productType];
      const found = plans.find((plan) => plan.product_id === productId);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

/**
 * 根据计划 ID 获取订阅计划
 */
export function getPlanById(planId: string): SubscriptionPlanConfig | null {
  // 遍历所有平台和产品类型
  for (const platform of Object.keys(subscriptionPlans) as Platform[]) {
    const platformPlans = subscriptionPlans[platform];
    if (!platformPlans) continue;

    for (const productType of Object.keys(platformPlans) as ProductType[]) {
      const plans = platformPlans[productType];
      const found = plans.find((plan) => plan.id === planId);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

/**
 * 获取所有活跃的订阅计划（扁平化列表）
 */
export function getAllActivePlans(): SubscriptionPlanConfig[] {
  const allPlans: SubscriptionPlanConfig[] = [];

  for (const platform of Object.keys(subscriptionPlans) as Platform[]) {
    const platformPlans = subscriptionPlans[platform];
    if (!platformPlans) continue;

    for (const productType of Object.keys(platformPlans) as ProductType[]) {
      const plans = platformPlans[productType];
      allPlans.push(...plans.filter((plan) => plan.active));
    }
  }

  return allPlans.sort((a, b) => a.sort_order - b.sort_order);
}

/**
 * 将配置转换为与原数据库格式兼容的格式
 * 用于保持向后兼容性
 */
export function convertToLegacyFormat(plan: SubscriptionPlanConfig): {
  id: number | string;
  platform: string;
  product_type: string;
  product_id: string;
  base_plan_id: string | null;
  plan_name: string;
  display_name: Record<string, string>;
  features: Record<string, string[]>;
  credits_per_cycle: number;
  cycle_days: number;
  active: boolean;
  sort_order: number;
  price: Record<string, number>;
  discounted_price?: Record<string, number>;
  billing_period?: string;
  enable_first_month_coupon?: boolean;
  first_month_coupon_id?: string | null;
} {
  return {
    id: plan.id,
    platform: plan.platform,
    product_type: plan.product_type,
    product_id: plan.product_id,
    base_plan_id: plan.base_plan_id ?? null,
    plan_name: plan.plan_name,
    display_name: plan.display_name,
    features: plan.features,
    credits_per_cycle: plan.credits_per_cycle,
    cycle_days: plan.cycle_days,
    active: plan.active,
    sort_order: plan.sort_order,
    price: plan.price,
    discounted_price: plan.discounted_price,
    billing_period: plan.billing_period,
    enable_first_month_coupon: plan.enable_first_month_coupon,
    first_month_coupon_id: plan.first_month_coupon_id,
  };
}
