/**
 * 生产环境订阅计划配置
 *
 * 特点：
 * - 使用 Stripe 生产模式的 Product ID
 * - 正式价格
 * - 用于线上环境
 * - 统一订阅方案，不区分产品类型
 *
 * 重要：修改此文件前请确认价格和 Product ID 正确！
 */

import type { SubscriptionPlansConfig } from './types';

export const subscriptionPlans: SubscriptionPlansConfig = {
  stripe: [
    // Mini Plan (周付)
    {
      id: 'stripe_mini_weekly',
      platform: 'stripe',
      plan_name: 'Mini',
      product_id: 'prod_mini_weekly', // TODO: 替换为实际的 Stripe Product ID
      display_name: {
        en: 'Mini Plan',
        'zh-CN': '迷你计划',
        'zh-TW': '迷你計劃',
        'th-TH': 'แผนมินิ',
      },
      billing_period: 'week',
      cycle_days: 7,
      credit_tiers: [
        {
          credits: 500,
          price: { USD: 4.99 },
          discounted_price: { USD: 2.49 },
          product_id: 'prod_mini_500',
        },
        {
          credits: 1000,
          price: { USD: 7.99 },
          discounted_price: { USD: 3.99 },
          product_id: 'prod_mini_1000',
        },
        {
          credits: 1500,
          price: { USD: 9.99 },
          discounted_price: { USD: 4.99 },
          product_id: 'prod_mini_weekly',
        },
      ],
      enable_first_month_coupon: false,
      active: true,
      sort_order: 1,
    },

    // Starter (周付)
    {
      id: 'stripe_starter_weekly',
      platform: 'stripe',
      plan_name: 'Starter',
      product_id: 'prod_starter_weekly', // TODO: 替换为实际的 Stripe Product ID
      display_name: {
        en: 'Starter Plan',
        'zh-CN': '入门计划',
        'zh-TW': '入門計劃',
        'th-TH': 'แผนสตาร์ทเตอร์',
      },
      billing_period: 'week',
      cycle_days: 7,
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
          product_id: 'prod_starter_weekly',
        },
        {
          credits: 4500,
          price: { USD: 29.99 },
          discounted_price: { USD: 14.99 },
          product_id: 'prod_starter_4500',
        },
      ],
      enable_first_month_coupon: true,
      first_month_coupon_label: {
        en: 'First Week 50% OFF',
        'zh-CN': '首周5折',
        'zh-TW': '首週5折',
        'th-TH': 'สัปดาห์แรก ลด 50%',
      },
      active: true,
      sort_order: 2,
    },

    // Creator (年付)
    {
      id: 'stripe_creator_yearly',
      platform: 'stripe',
      plan_name: 'Creator',
      product_id: 'prod_creator_yearly', // TODO: 替换为实际的 Stripe Product ID
      display_name: {
        en: 'Creator',
        'zh-CN': '创作者版',
        'zh-TW': '創作者版',
        'th-TH': 'ครีเอเตอร์',
      },
      billing_period: 'year',
      cycle_days: 365,
      credit_tiers: [
        {
          credits: 15000,
          price: { USD: 99.99 },
          discounted_price: { USD: 49.99 },
          product_id: 'prod_creator_15000',
        },
        {
          credits: 30000,
          price: { USD: 199.99 },
          discounted_price: { USD: 99.99 },
          product_id: 'prod_creator_yearly',
        },
        {
          credits: 50000,
          price: { USD: 299.99 },
          discounted_price: { USD: 149.99 },
          product_id: 'prod_creator_50000',
        },
      ],
      enable_first_month_coupon: false,
      is_popular: true,
      active: true,
      sort_order: 3,
    },
  ],
};