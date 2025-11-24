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
    // Starter Plan (周付)
    {
      id: 'stripe_starter_weekly',
      platform: 'stripe',
      plan_name: 'Starter',
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
          product_id: 'prod_starter_3000',
          default: true,
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
      sort_order: 1,
    },

    // Creator (月付)
    {
      id: 'stripe_creator_weekly',
      platform: 'stripe',
      plan_name: 'Creator',
      display_name: {
        en: 'Creator Plan',
        'zh-CN': '创作者版',
        'zh-TW': '創作者版',
        'th-TH': 'ครีเอเตอร์',
      },
      billing_period: 'month',
      cycle_days: 30,
      credit_tiers: [
        {
          credits: 3750,
          price: { USD: 17.99 },
          discounted_price: { USD: 8.99 },
          product_id: 'prod_creator_15000',
          default: true,
        },
        {
          credits: 30000,
          price: { USD: 35.99 },
          discounted_price: { USD: 17.99 },
          product_id: 'prod_creator_30000',
        },
        {
          credits: 50000,
          price: { USD: 53.99 },
          discounted_price: { USD: 26.99 },
          product_id: 'prod_creator_50000',
        },
      ],
      enable_first_month_coupon: true,
      first_month_coupon_label: {
        en: 'First Month 50% OFF',
        'zh-CN': '首月5折',
        'zh-TW': '首月5折',
        'th-TH': 'สัปดาห์แรก ลด 50%',
      },
      active: true,
      sort_order: 2,
    },

    // Pro (年付)
    {
      id: 'stripe_pro_yearly',
      platform: 'stripe',
      plan_name: 'Pro',
      display_name: {
        en: 'Pro Plan',
        'zh-CN': '专业版',
        'zh-TW': '專業版',
        'th-TH': 'แผนโปร',
      },
      billing_period: 'year',
      cycle_days: 365,
      credit_tiers: [
        {
          credits: 30000,
          price: { USD: 199.99 },
          discounted_price: { USD: 99.99 },
          product_id: 'prod_pro_30000',
        },
        {
          credits: 45000,
          price: { USD: 299.99 },
          discounted_price: { USD: 149.99 },
          product_id: 'prod_pro_45000',
          default: true,
        },
        {
          credits: 60000,
          price: { USD: 399.99 },
          discounted_price: { USD: 199.99 },
          product_id: 'prod_pro_60000',
        },
      ],
      enable_first_month_coupon: false,
      is_popular: true,
      active: true,
      sort_order: 3,
    },
  ],
};