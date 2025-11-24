/**
 * 开发环境订阅计划配置
 *
 * 特点：
 * - 使用 Stripe 测试模式的 Product ID
 * - 与生产环境相同的配置（便于测试）
 * - 用于本地开发和测试环境
 * - 统一订阅方案，不区分产品类型
 *
 * 注意：Product ID 是 Stripe 测试模式的 ID
 */

import type { SubscriptionPlansConfig } from './types';

export const subscriptionPlans: SubscriptionPlansConfig = {
  stripe: [
    // Mini Plan (周付) - 测试模式
    {
      id: 'stripe_mini_weekly',
      platform: 'stripe',
      plan_name: 'Mini',
      product_id: 'prod_SQTKEFPeGUz3TA',
      display_name: {
        en: 'Mini Plan',
        'zh-CN': '迷你计划',
        'zh-TW': '迷你計劃',
        'th-TH': 'แผนมินิ',
      },
      credits_per_cycle: 1500,
      cycle_days: 7,
      price: { USD: 9.99 },
      discounted_price: { USD: 4.99 },
      billing_period: 'week',
      enable_first_month_coupon: false,
      first_month_coupon_id: null,
      active: true,
      sort_order: 1,
    },

    // Starter (周付) - 测试模式，带积分档位滑块
    {
      id: 'stripe_starter_weekly',
      platform: 'stripe',
      plan_name: 'Starter',
      product_id: 'prod_SQTLdMaqyNSiNu',
      display_name: {
        en: 'Starter Plan',
        'zh-CN': '入门计划',
        'zh-TW': '入門計劃',
        'th-TH': 'แผนสตาร์ทเตอร์',
      },
      credits_per_cycle: 3000,
      cycle_days: 7,
      price: { USD: 19.99 },
      discounted_price: { USD: 9.99 },
      billing_period: 'week',
      enable_first_month_coupon: true,
      first_month_coupon_id: null,
      first_month_coupon_label: {
        en: 'First Week 50% OFF',
        'zh-CN': '首周5折',
        'zh-TW': '首週5折',
        'th-TH': 'สัปดาห์แรก ลด 50%',
      },
      credit_tiers: [
        {
          credits: 1500,
          price: { USD: 9.99 },
          discounted_price: { USD: 4.99 },
          product_id: 'prod_starter_1500',
        },
        {
          credits: 3000,
          price: { USD: 19.99 },
          discounted_price: { USD: 9.99 },
          product_id: 'prod_SQTLdMaqyNSiNu',
        },
        {
          credits: 4500,
          price: { USD: 29.99 },
          discounted_price: { USD: 14.99 },
          product_id: 'prod_starter_4500',
        },
      ],
      active: true,
      sort_order: 2,
    },

    // Creator (年付) - 测试模式
    {
      id: 'stripe_creator_yearly',
      platform: 'stripe',
      plan_name: 'Creator',
      product_id: 'prod_SQTMPjT6NKY2IU',
      display_name: {
        en: 'Creator',
        'zh-CN': '创作者版',
        'zh-TW': '創作者版',
        'th-TH': 'ครีเอเตอร์',
      },
      credits_per_cycle: 30000,
      cycle_days: 365,
      price: { USD: 199.99 },
      discounted_price: { USD: 99.99 },
      billing_period: 'year',
      enable_first_month_coupon: false,
      first_month_coupon_id: null,
      active: true,
      sort_order: 3,
      is_popular: true,
    },
  ],
};
