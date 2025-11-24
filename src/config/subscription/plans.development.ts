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
          features: [
        {
          en: 'up to 180 videos per week',
          'zh-CN': '每周最多 180 个视频',
          'zh-TW': '每週最多 180 個影片',
          'th-TH': 'วิดีโอได้สูงสุด 180 รายการต่อสัปดาห์',
        },
        {
          en: 'up to 450 songs per week',
          'zh-CN': '每周最多 450 首歌曲',
          'zh-TW': '每週最多 450 首歌曲',
          'th-TH': 'เพลงได้สูงสุด 450 เพลงต่อสัปดาห์',
        },
        {
          en: 'up to 450,000 characters per week',
          'zh-CN': '每周最多 450,000 个字符',
          'zh-TW': '每週最多 450,000 個字元',
          'th-TH': 'อักขระได้สูงสุด 450,000 ตัวต่อสัปดาห์',
        },
        {
          en: 'Learn more on rules below',
          'zh-CN': '更多规则请见下方',
          'zh-TW': '更多規則請見下方',
          'th-TH': 'เรียนรู้เพิ่มเติมเกี่ยวกับกฎด้านล่าง',
        },
      ],
        },
        {
          credits: 3000,
          price: { USD: 19.99 },
          discounted_price: { USD: 9.99 },
          product_id: 'prod_starter_3000',
          features: [
        {
          en: 'up to 60 videos per week',
          'zh-CN': '每周最多 60 个视频',
          'zh-TW': '每週最多 60 個影片',
          'th-TH': 'วิดีโอได้สูงสุด 60 รายการต่อสัปดาห์',
        },
        {
          en: 'up to 150 songs per week',
          'zh-CN': '每周最多 150 首歌曲',
          'zh-TW': '每週最多 150 首歌曲',
          'th-TH': 'เพลงได้สูงสุด 150 เพลงต่อสัปดาห์',
        },
        {
          en: 'up to 150,000 characters per week',
          'zh-CN': '每周最多 150,000 个字符',
          'zh-TW': '每週最多 150,000 個字元',
          'th-TH': 'อักขระได้สูงสุด 150,000 ตัวต่อสัปดาห์',
        },
        {
          en: 'Learn more on rules below',
          'zh-CN': '更多规则请见下方',
          'zh-TW': '更多規則請見下方',
          'th-TH': 'เรียนรู้เพิ่มเติมเกี่ยวกับกฎด้านล่าง',
        },
      ],
          default: true,
        },
        {
          credits: 4500,
          price: { USD: 29.99 },
          discounted_price: { USD: 14.99 },
          product_id: 'prod_starter_4500',
          features: [
        {
          en: 'up to 180 videos per week',
          'zh-CN': '每周最多 180 个视频',
          'zh-TW': '每週最多 180 個影片',
          'th-TH': 'วิดีโอได้สูงสุด 180 รายการต่อสัปดาห์',
        },
        {
          en: 'up to 450 songs per week',
          'zh-CN': '每周最多 450 首歌曲',
          'zh-TW': '每週最多 450 首歌曲',
          'th-TH': 'เพลงได้สูงสุด 450 เพลงต่อสัปดาห์',
        },
        {
          en: 'up to 450,000 characters per week',
          'zh-CN': '每周最多 450,000 个字符',
          'zh-TW': '每週最多 450,000 個字元',
          'th-TH': 'อักขระได้สูงสุด 450,000 ตัวต่อสัปดาห์',
        },
        {
          en: 'Learn more on rules below',
          'zh-CN': '更多规则请见下方',
          'zh-TW': '更多規則請見下方',
          'th-TH': 'เรียนรู้เพิ่มเติมเกี่ยวกับกฎด้านล่าง',
        },
      ],
        },
      ],
      enable_first_month_coupon: true,
      first_month_coupon_label: {
        en: '50% OFF',
        'zh-CN': '5折',
        'zh-TW': '5折',
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
          product_id: 'prod_creator_3750',
          features: [
        {
          en: 'up to 180 videos per week',
          'zh-CN': '每周最多 180 个视频',
          'zh-TW': '每週最多 180 個影片',
          'th-TH': 'วิดีโอได้สูงสุด 180 รายการต่อสัปดาห์',
        },
        {
          en: 'up to 450 songs per week',
          'zh-CN': '每周最多 450 首歌曲',
          'zh-TW': '每週最多 450 首歌曲',
          'th-TH': 'เพลงได้สูงสุด 450 เพลงต่อสัปดาห์',
        },
        {
          en: 'up to 450,000 characters per week',
          'zh-CN': '每周最多 450,000 个字符',
          'zh-TW': '每週最多 450,000 個字元',
          'th-TH': 'อักขระได้สูงสุด 450,000 ตัวต่อสัปดาห์',
        },
        {
          en: 'Learn more on rules below',
          'zh-CN': '更多规则请见下方',
          'zh-TW': '更多規則請見下方',
          'th-TH': 'เรียนรู้เพิ่มเติมเกี่ยวกับกฎด้านล่าง',
        },
      ],
          default: true,
        },
        {
          credits: 7500,
          price: { USD: 35.99 },
          discounted_price: { USD: 17.99 },
          product_id: 'prod_creator_3750',
          features: [
        {
          en: 'up to 180 videos per week',
          'zh-CN': '每周最多 180 个视频',
          'zh-TW': '每週最多 180 個影片',
          'th-TH': 'วิดีโอได้สูงสุด 180 รายการต่อสัปดาห์',
        },
        {
          en: 'up to 450 songs per week',
          'zh-CN': '每周最多 450 首歌曲',
          'zh-TW': '每週最多 450 首歌曲',
          'th-TH': 'เพลงได้สูงสุด 450 เพลงต่อสัปดาห์',
        },
        {
          en: 'up to 450,000 characters per week',
          'zh-CN': '每周最多 450,000 个字符',
          'zh-TW': '每週最多 450,000 個字元',
          'th-TH': 'อักขระได้สูงสุด 450,000 ตัวต่อสัปดาห์',
        },
        {
          en: 'Learn more on rules below',
          'zh-CN': '更多规则请见下方',
          'zh-TW': '更多規則請見下方',
          'th-TH': 'เรียนรู้เพิ่มเติมเกี่ยวกับกฎด้านล่าง',
        },
      ],
        },
        {
          credits: 11250,
          price: { USD: 53.99 },
          discounted_price: { USD: 26.99 },
          product_id: 'prod_creator_11250',
          features: [
        {
          en: 'up to 180 videos per week',
          'zh-CN': '每周最多 180 个视频',
          'zh-TW': '每週最多 180 個影片',
          'th-TH': 'วิดีโอได้สูงสุด 180 รายการต่อสัปดาห์',
        },
        {
          en: 'up to 450 songs per week',
          'zh-CN': '每周最多 450 首歌曲',
          'zh-TW': '每週最多 450 首歌曲',
          'th-TH': 'เพลงได้สูงสุด 450 เพลงต่อสัปดาห์',
        },
        {
          en: 'up to 450,000 characters per week',
          'zh-CN': '每周最多 450,000 个字符',
          'zh-TW': '每週最多 450,000 個字元',
          'th-TH': 'อักขระได้สูงสุด 450,000 ตัวต่อสัปดาห์',
        },
        {
          en: 'Learn more on rules below',
          'zh-CN': '更多规则请见下方',
          'zh-TW': '更多規則請見下方',
          'th-TH': 'เรียนรู้เพิ่มเติมเกี่ยวกับกฎด้านล่าง',
        },
      ],
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
          features: [
        {
          en: 'up to 180 videos per week',
          'zh-CN': '每周最多 180 个视频',
          'zh-TW': '每週最多 180 個影片',
          'th-TH': 'วิดีโอได้สูงสุด 180 รายการต่อสัปดาห์',
        },
        {
          en: 'up to 450 songs per week',
          'zh-CN': '每周最多 450 首歌曲',
          'zh-TW': '每週最多 450 首歌曲',
          'th-TH': 'เพลงได้สูงสุด 450 เพลงต่อสัปดาห์',
        },
        {
          en: 'up to 450,000 characters per week',
          'zh-CN': '每周最多 450,000 个字符',
          'zh-TW': '每週最多 450,000 個字元',
          'th-TH': 'อักขระได้สูงสุด 450,000 ตัวต่อสัปดาห์',
        },
        {
          en: 'Learn more on rules below',
          'zh-CN': '更多规则请见下方',
          'zh-TW': '更多規則請見下方',
          'th-TH': 'เรียนรู้เพิ่มเติมเกี่ยวกับกฎด้านล่าง',
        },
      ],
          default: true,
        },
        {
          credits: 45000,
          price: { USD: 299.99 },
          discounted_price: { USD: 149.99 },
          product_id: 'prod_pro_45000',
          features: [
        {
          en: 'up to 180 videos per week',
          'zh-CN': '每周最多 180 个视频',
          'zh-TW': '每週最多 180 個影片',
          'th-TH': 'วิดีโอได้สูงสุด 180 รายการต่อสัปดาห์',
        },
        {
          en: 'up to 450 songs per week',
          'zh-CN': '每周最多 450 首歌曲',
          'zh-TW': '每週最多 450 首歌曲',
          'th-TH': 'เพลงได้สูงสุด 450 เพลงต่อสัปดาห์',
        },
        {
          en: 'up to 450,000 characters per week',
          'zh-CN': '每周最多 450,000 个字符',
          'zh-TW': '每週最多 450,000 個字元',
          'th-TH': 'อักขระได้สูงสุด 450,000 ตัวต่อสัปดาห์',
        },
        {
          en: 'Learn more on rules below',
          'zh-CN': '更多规则请见下方',
          'zh-TW': '更多規則請見下方',
          'th-TH': 'เรียนรู้เพิ่มเติมเกี่ยวกับกฎด้านล่าง',
        },
      ],
        },
        {
          credits: 60000,
          price: { USD: 399.99 },
          discounted_price: { USD: 199.99 },
          product_id: 'prod_pro_60000',
          features: [
        {
          en: 'up to 180 videos per week',
          'zh-CN': '每周最多 180 个视频',
          'zh-TW': '每週最多 180 個影片',
          'th-TH': 'วิดีโอได้สูงสุด 180 รายการต่อสัปดาห์',
        },
        {
          en: 'up to 450 songs per week',
          'zh-CN': '每周最多 450 首歌曲',
          'zh-TW': '每週最多 450 首歌曲',
          'th-TH': 'เพลงได้สูงสุด 450 เพลงต่อสัปดาห์',
        },
        {
          en: 'up to 450,000 characters per week',
          'zh-CN': '每周最多 450,000 个字符',
          'zh-TW': '每週最多 450,000 個字元',
          'th-TH': 'อักขระได้สูงสุด 450,000 ตัวต่อสัปดาห์',
        },
        {
          en: 'Learn more on rules below',
          'zh-CN': '更多规则请见下方',
          'zh-TW': '更多規則請見下方',
          'th-TH': 'เรียนรู้เพิ่มเติมเกี่ยวกับกฎด้านล่าง',
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
