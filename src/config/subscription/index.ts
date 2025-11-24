/**
 * 订阅计划配置统一入口
 *
 * 根据环境变量自动选择开发或生产配置
 * 统一订阅方案，不区分产品类型
 */

import { subscriptionPlans as devPlans } from './plans.development';
import { subscriptionPlans as prodPlans } from './plans.production';
import type { SubscriptionPlanConfig, SubscriptionPlansConfig, Platform, CreditTier } from './types';

// 根据环境选择配置
const isProduction = process.env.NODE_ENV === 'production';
export const subscriptionPlans: SubscriptionPlansConfig = isProduction ? prodPlans : devPlans;

// 导出类型
export type { SubscriptionPlanConfig, SubscriptionPlansConfig, Platform, CreditTier };
export type { PlanName, BillingPeriod } from './types';

/**
 * 获取指定平台的订阅计划列表
 */
export function getPlans(
  platform: Platform,
  activeOnly: boolean = true
): SubscriptionPlanConfig[] {
  const plans = subscriptionPlans[platform];
  if (!plans) {
    return [];
  }

  if (activeOnly) {
    return plans.filter((plan) => plan.active);
  }

  return plans;
}

/**
 * 根据 Product ID 获取订阅计划
 * 在 credit_tiers 中查找匹配的 product_id
 */
export function getPlanByProductId(productId: string): SubscriptionPlanConfig | null {
  for (const platform of Object.keys(subscriptionPlans) as Platform[]) {
    const plans = subscriptionPlans[platform];
    if (!plans) continue;

    for (const plan of plans) {
      const tierMatch = plan.credit_tiers.find((tier) => tier.product_id === productId);
      if (tierMatch) {
        return plan;
      }
    }
  }

  return null;
}

/**
 * 根据计划 ID 获取订阅计划
 */
export function getPlanById(planId: string): SubscriptionPlanConfig | null {
  for (const platform of Object.keys(subscriptionPlans) as Platform[]) {
    const plans = subscriptionPlans[platform];
    if (!plans) continue;

    const found = plans.find((plan) => plan.id === planId);
    if (found) {
      return found;
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
    const plans = subscriptionPlans[platform];
    if (!plans) continue;

    allPlans.push(...plans.filter((plan) => plan.active));
  }

  return allPlans.sort((a, b) => a.sort_order - b.sort_order);
}

/**
 * 根据 Product ID 获取对应的 CreditTier
 */
export function getCreditTierByProductId(productId: string): {
  plan: SubscriptionPlanConfig;
  tier: CreditTier;
} | null {
  for (const platform of Object.keys(subscriptionPlans) as Platform[]) {
    const plans = subscriptionPlans[platform];
    if (!plans) continue;

    for (const plan of plans) {
      const tier = plan.credit_tiers.find((t) => t.product_id === productId);
      if (tier) {
        return { plan, tier };
      }
    }
  }

  return null;
}