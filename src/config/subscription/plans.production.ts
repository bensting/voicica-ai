/**
 * 生产环境订阅计划配置
 *
 * 特点：
 * - 使用 Stripe 生产模式的 Product ID
 * - 正式价格
 * - 用于线上环境
 *
 * 重要：修改此文件前请确认价格和 Product ID 正确！
 */

import type { SubscriptionPlansConfig } from './types';

export const subscriptionPlans: SubscriptionPlansConfig = {
  stripe: {
    text_to_speech: [
      // Free 计划
      {
        id: 'stripe_tts_free',
        platform: 'stripe',
        product_type: 'text_to_speech',
        plan_name: 'Free',
        product_id: '', // Free 计划没有 Stripe Product ID
        display_name: {
          en: 'Free Plan',
          'zh-CN': '免费版',
          'zh-TW': '免費版',
          'th-TH': 'แผนฟรี',
        },
        features: {
          en: [
            '500 characters per generation',
            '50 free credits to start',
            'Standard voices',
            'MP3 format only',
            'Community support',
          ],
          'zh-CN': [
            '每次生成 500 字符',
            '新用户赠送 50 积分',
            '标准语音库',
            '仅支持 MP3 格式',
            '社区支持',
          ],
          'zh-TW': [
            '每次生成 500 字元',
            '新用戶贈送 50 積分',
            '標準語音庫',
            '僅支援 MP3 格式',
            '社群支援',
          ],
          'th-TH': [
            '500 ตัวอักษรต่อการสร้าง',
            '50 เครดิตฟรีเริ่มต้น',
            'เสียงมาตรฐาน',
            'รูปแบบ MP3 เท่านั้น',
            'การสนับสนุนชุมชน',
          ],
        },
        credits_per_cycle: 50,
        cycle_days: 0, // 一次性
        price: { USD: 0, CNY: 0, TWD: 0, THB: 0 },
        active: true,
        sort_order: 1,
      },

      // Basic 计划 (月付)
      {
        id: 'stripe_tts_basic_monthly',
        platform: 'stripe',
        product_type: 'text_to_speech',
        plan_name: 'Basic',
        product_id: 'prod_SQTKEFPeGUz3TA', // TODO: 替换为实际的 Stripe 生产 Product ID
        display_name: {
          en: 'Basic Plan',
          'zh-CN': '基础版',
          'zh-TW': '基礎版',
          'th-TH': 'แผนพื้นฐาน',
        },
        features: {
          en: [
            '500 characters per generation',
            '10,000 credits per month',
            'All standard voices',
            'MP3 & WAV formats',
            'Email support',
            'API access',
          ],
          'zh-CN': [
            '每次生成 500 字符',
            '每月 10,000 积分',
            '所有标准语音',
            'MP3 & WAV 格式',
            '邮件支持',
            'API 访问',
          ],
          'zh-TW': [
            '每次生成 500 字元',
            '每月 10,000 積分',
            '所有標準語音',
            'MP3 & WAV 格式',
            '郵件支援',
            'API 存取',
          ],
          'th-TH': [
            '500 ตัวอักษรต่อการสร้าง',
            '10,000 เครดิตต่อเดือน',
            'เสียงมาตรฐานทั้งหมด',
            'รูปแบบ MP3 & WAV',
            'การสนับสนุนทางอีเมล',
            'การเข้าถึง API',
          ],
        },
        credits_per_cycle: 10000,
        cycle_days: 30,
        price: { USD: 4.99, CNY: 34, TWD: 149, THB: 169 },
        billing_period: 'month',
        active: true,
        sort_order: 2,
      },

      // Premium 计划 (月付) - 推荐
      {
        id: 'stripe_tts_premium_monthly',
        platform: 'stripe',
        product_type: 'text_to_speech',
        plan_name: 'Premium',
        product_id: 'prod_SQTLdMaqyNSiNu', // TODO: 替换为实际的 Stripe 生产 Product ID
        display_name: {
          en: 'Premium Plan',
          'zh-CN': '高级版',
          'zh-TW': '進階版',
          'th-TH': 'แผนพรีเมียม',
        },
        features: {
          en: [
            '500 characters per generation',
            '50,000 credits per month',
            'All premium voices',
            'All audio formats',
            'Priority support',
            'API access',
            'Voice cloning (coming soon)',
          ],
          'zh-CN': [
            '每次生成 500 字符',
            '每月 50,000 积分',
            '所有高级语音',
            '所有音频格式',
            '优先支持',
            'API 访问',
            '语音克隆（即将推出）',
          ],
          'zh-TW': [
            '每次生成 500 字元',
            '每月 50,000 積分',
            '所有進階語音',
            '所有音訊格式',
            '優先支援',
            'API 存取',
            '語音克隆（即將推出）',
          ],
          'th-TH': [
            '500 ตัวอักษรต่อการสร้าง',
            '50,000 เครดิตต่อเดือน',
            'เสียงพรีเมียมทั้งหมด',
            'รูปแบบเสียงทั้งหมด',
            'การสนับสนุนลำดับแรก',
            'การเข้าถึง API',
            'การโคลนเสียง (เร็วๆ นี้)',
          ],
        },
        credits_per_cycle: 50000,
        cycle_days: 30,
        price: { USD: 14.99, CNY: 98, TWD: 449, THB: 499 },
        billing_period: 'month',
        active: true,
        sort_order: 3,
      },

      // Plus 计划 (月付)
      {
        id: 'stripe_tts_plus_monthly',
        platform: 'stripe',
        product_type: 'text_to_speech',
        plan_name: 'Plus',
        product_id: 'prod_SQTMPjT6NKY2IU', // TODO: 替换为实际的 Stripe 生产 Product ID
        display_name: {
          en: 'Plus Plan',
          'zh-CN': '专业版',
          'zh-TW': '專業版',
          'th-TH': 'แผนพลัส',
        },
        features: {
          en: [
            '500 characters per generation',
            '200,000 credits per month',
            'All premium voices',
            'All audio formats',
            'Dedicated support',
            'API access',
            'Voice cloning',
            'Custom voice training',
          ],
          'zh-CN': [
            '每次生成 500 字符',
            '每月 200,000 积分',
            '所有高级语音',
            '所有音频格式',
            '专属支持',
            'API 访问',
            '语音克隆',
            '自定义语音训练',
          ],
          'zh-TW': [
            '每次生成 500 字元',
            '每月 200,000 積分',
            '所有進階語音',
            '所有音訊格式',
            '專屬支援',
            'API 存取',
            '語音克隆',
            '自訂語音訓練',
          ],
          'th-TH': [
            '500 ตัวอักษรต่อการสร้าง',
            '200,000 เครดิตต่อเดือน',
            'เสียงพรีเมียมทั้งหมด',
            'รูปแบบเสียงทั้งหมด',
            'การสนับสนุนเฉพาะ',
            'การเข้าถึง API',
            'การโคลนเสียง',
            'การฝึกเสียงที่กำหนดเอง',
          ],
        },
        credits_per_cycle: 200000,
        cycle_days: 30,
        price: { USD: 49.99, CNY: 348, TWD: 1490, THB: 1690 },
        billing_period: 'month',
        active: true,
        sort_order: 4,
      },
    ],

    voice_cloning: [
      // Voice Cloning 计划可以在这里添加
    ],
  },
};
