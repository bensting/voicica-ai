/**
 * 开发环境订阅计划配置
 *
 * 定价（与 Native 端一致）：
 * - 入门计划: $4.99/月 → 1,000 积分
 * - 创作者版: $12.99/月 → 3,000 积分
 * - 专业版: $19.99/月 → 5,000 积分
 *
 * 注意：Product ID 是 Stripe 测试模式的 ID
 */

import type { SubscriptionPlansConfig } from './types';

export const subscriptionPlans: SubscriptionPlansConfig = {
  stripe: [
    // Starter Plan (月付)
    {
      id: 'stripe_starter_monthly',
      platform: 'stripe',
      plan_name: 'Starter',
      display_name: {
        en: 'Starter Plan',
        'zh-CN': '入门计划',
        'zh-TW': '入門計劃',
        'th-TH': 'แผนสตาร์ทเตอร์',
        'my-MM': 'စတင်အစီအစဉ်',
        'id-ID': 'Paket Pemula',
      },
      billing_period: 'month',
      cycle_days: 30,
      credit_tiers: [
        {
          credits: 1000,
          price: { USD: 4.99 },
          product_id: 'prod_starter_1k_test',
          default: true,
          features: [
            {
              en: '1,000 credits per month',
              'zh-CN': '每月 1,000 积分',
              'zh-TW': '每月 1,000 積分',
              'th-TH': '1,000 เครดิตต่อเดือน',
              'my-MM': 'တစ်လလျှင် အကြွေး ၁,၀၀၀',
              'id-ID': '1.000 kredit per bulan',
            },
          ],
        },
      ],
      enable_first_month_coupon: false,
      active: true,
      sort_order: 1,
    },

    // Creator (月付)
    {
      id: 'stripe_creator_monthly',
      platform: 'stripe',
      plan_name: 'Creator',
      display_name: {
        en: 'Creator Plan',
        'zh-CN': '创作者版',
        'zh-TW': '創作者版',
        'th-TH': 'ครีเอเตอร์',
        'my-MM': 'ဖန်တီးသူအစီအစဉ်',
        'id-ID': 'Paket Kreator',
      },
      billing_period: 'month',
      cycle_days: 30,
      credit_tiers: [
        {
          credits: 3000,
          price: { USD: 12.99 },
          product_id: 'prod_creator_3k_test',
          default: true,
          features: [
            {
              en: '3,000 credits per month',
              'zh-CN': '每月 3,000 积分',
              'zh-TW': '每月 3,000 積分',
              'th-TH': '3,000 เครดิตต่อเดือน',
              'my-MM': 'တစ်လလျှင် အကြွေး ၃,၀၀၀',
              'id-ID': '3.000 kredit per bulan',
            },
          ],
        },
      ],
      enable_first_month_coupon: false,
      active: true,
      sort_order: 2,
    },

    // Pro (月付)
    {
      id: 'stripe_pro_monthly',
      platform: 'stripe',
      plan_name: 'Pro',
      display_name: {
        en: 'Pro Plan',
        'zh-CN': '专业版',
        'zh-TW': '專業版',
        'th-TH': 'แผนโปร',
        'my-MM': 'ပရိုအစီအစဉ်',
        'id-ID': 'Paket Pro',
      },
      billing_period: 'month',
      cycle_days: 30,
      credit_tiers: [
        {
          credits: 5000,
          price: { USD: 19.99 },
          product_id: 'prod_pro_5k_test',
          default: true,
          features: [
            {
              en: '5,000 credits per month',
              'zh-CN': '每月 5,000 积分',
              'zh-TW': '每月 5,000 積分',
              'th-TH': '5,000 เครดิตต่อเดือน',
              'my-MM': 'တစ်လလျှင် အကြွေး ၅,၀၀၀',
              'id-ID': '5.000 kredit per bulan',
            },
          ],
        },
      ],
      enable_first_month_coupon: false,
      is_popular: true,
      active: true,
      sort_order: 3,
    },
  ],
};
