/**
 * 开发环境订阅计划配置
 *
 * 简化定价（与生产环境一致）：
 * - 入门计划: $4.99/周 → 100,000 字符
 * - 创作者版: $9.99/月 → 300,000 字符
 * - 专业版: $14.99/月 → 500,000 字符
 *
 * 1 字符 = 1 积分
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
          credits: 100000,
          price: { USD: 4.99 },
          product_id: 'prod_starter_100k_test',
          default: true,
          features: [
            {
              en: '100,000 characters per month',
              'zh-CN': '每月 100,000 字符',
              'zh-TW': '每月 100,000 字元',
              'th-TH': '100,000 ตัวอักษรต่อเดือน',
              'my-MM': 'တစ်လလျှင် စာလုံး ၁၀၀,၀၀၀',
              'id-ID': '100.000 karakter per bulan',
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
          credits: 300000,
          price: { USD: 9.99 },
          product_id: 'prod_creator_300k_test',
          default: true,
          features: [
            {
              en: '300,000 characters per month',
              'zh-CN': '每月 300,000 字符',
              'zh-TW': '每月 300,000 字元',
              'th-TH': '300,000 ตัวอักษรต่อเดือน',
              'my-MM': 'တစ်လလျှင် စာလုံး ၃၀၀,၀၀၀',
              'id-ID': '300.000 karakter per bulan',
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
          credits: 500000,
          price: { USD: 14.99 },
          product_id: 'prod_pro_500k_test',
          default: true,
          features: [
            {
              en: '500,000 characters per month',
              'zh-CN': '每月 500,000 字符',
              'zh-TW': '每月 500,000 字元',
              'th-TH': '500,000 ตัวอักษรต่อเดือน',
              'my-MM': 'တစ်လလျှင် စာလုံး ၅၀၀,၀၀၀',
              'id-ID': '500.000 karakter per bulan',
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
