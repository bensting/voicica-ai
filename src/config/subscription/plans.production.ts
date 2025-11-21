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

import type { SubscriptionPlansConfig, ProductTypeTabsConfig } from './types';

/**
 * 产品类型 Tab 配置 - 生产环境
 * 生产环境只显示已上线的产品类型
 */
export const productTypeTabs: ProductTypeTabsConfig = [
  {
    type: 'text_to_speech',
    labelKey: 'upgrade.tabs.textToVoice',
    enabled: true,
  },
  {
    type: 'voice_cloning',
    labelKey: 'upgrade.tabs.voiceClone',
    enabled: false, // 生产环境暂未上线
  },
];

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
            '500 free credits to start',
            'Standard voices',
            'MP3 format only',
            'Community support',
          ],
          'zh-CN': [
            '每次生成 500 字符',
            '免费赠送 500 积分',
            '标准语音库',
            '仅支持 MP3 格式',
            '社区支持',
          ],
          'zh-TW': [
            '每次生成 500 字元',
            '免费贈送 500 積分',
            '標準語音庫',
            '僅支援 MP3 格式',
            '社群支援',
          ],
          'th-TH': [
            '500 ตัวอักษรต่อการสร้าง',
            '500 เครดิตฟรีเริ่มต้น',
            'เสียงมาตรฐาน',
            'รูปแบบ MP3 เท่านั้น',
            'การสนับสนุนชุมชน',
          ],
        },
        credits_per_cycle: 50,
        cycle_days: 0, // 一次性
        price: { USD: 0, CNY: 0, TWD: 0, THB: 0 },
        active: true,
        sort_order: 0,
      },

      // Basic 计划 (月付)
      {
        id: 'stripe_tts_basic_monthly',
        platform: 'stripe',
        product_type: 'text_to_speech',
        plan_name: 'Basic',
        product_id: 'prod_TID71xsEIJNzNm',
        display_name: {
          en: 'Basic Plan',
          'zh-CN': '基础计划',
          'zh-TW': '基礎計劃',
          'th-TH': 'แผนพื้นฐาน',
        },
        features: {
          en: [
            '500,000 characters',
            'Up to 2,000 characters at a time',
            '3200 ai voices & 70+ languages',
            'Advanced audio noise reduction processing',
            'Unlimited audio downloads',
            '24/7 customer support',
          ],
          'zh-CN': [
            '50万个字符',
            '一次最多 2,000 个字符',
            '3200 个 AI 语音和 70+ 种语言',
            '高级音频降噪处理',
            '无限音频下载',
            '24/7 客户支持',
          ],
          'zh-TW': [
            '50萬個字元',
            '一次最多 2,000 個字元',
            '3200 個 AI 語音和 70+ 種語言',
            '高級音訊降噪處理',
            '無限音訊下載',
            '24/7 客戶支援',
          ],
          'th-TH': [
            '500,000 ตัวอักษร',
            'สูงสุด 2,000 ตัวอักษรต่อครั้ง',
            '3200 เสียง AI และ 70+ ภาษา',
            'การประมวลผลลดเสียงรบกวนขั้นสูง',
            'ดาวน์โหลดเสียงไม่จำกัด',
            'การสนับสนุนลูกค้า 24/7',
          ],
        },
        credits_per_cycle: 500000,
        cycle_days: 30,
        price: { USD: 14.99, CNY: 99, TWD: 450, THB: 499 },
        discounted_price: { USD: 9.99, CNY: 68, TWD: 299, THB: 349 },
        billing_period: 'month',
        enable_first_month_coupon: false,
        first_month_coupon_id: null,
        active: true,
        sort_order: 1,
      },

      // Premium 计划 (月付)
      {
        id: 'stripe_tts_premium_monthly',
        platform: 'stripe',
        product_type: 'text_to_speech',
        plan_name: 'Premium',
        product_id: 'prod_TIDAVzmTPX2CyU',
        display_name: {
          en: 'Premium Plan',
          'zh-CN': '高级计划',
          'zh-TW': '高級計劃',
          'th-TH': 'แผนพรีเมียม',
        },
        features: {
          en: [
            '1,000,000 characters',
            'Up to 2,000 characters at a time',
            '3200 ai voices & 70+ languages',
            'Advanced audio noise reduction processing',
            'Unlimited audio downloads',
            '24/7 customer support',
          ],
          'zh-CN': [
            '100万个字符',
            '一次最多 2,000 个字符',
            '3200 个 AI 语音和 70+ 种语言',
            '高级音频降噪处理',
            '无限音频下载',
            '24/7 客户支持',
          ],
          'zh-TW': [
            '100萬個字元',
            '一次最多 2,000 個字元',
            '3200 個 AI 語音和 70+ 種語言',
            '高級音訊降噪處理',
            '無限音訊下載',
            '24/7 客戶支援',
          ],
          'th-TH': [
            '1,000,000 ตัวอักษร',
            'สูงสุด 2,000 ตัวอักษรต่อครั้ง',
            '3200 เสียง AI และ 70+ ภาษา',
            'การประมวลผลลดเสียงรบกวนขั้นสูง',
            'ดาวน์โหลดเสียงไม่จำกัด',
            'การสนับสนุนลูกค้า 24/7',
          ],
        },
        credits_per_cycle: 1000000,
        cycle_days: 30,
        price: { USD: 24.99, CNY: 168, TWD: 749, THB: 849 },
        discounted_price: { USD: 14.99, CNY: 99, TWD: 450, THB: 499 },
        billing_period: 'month',
        enable_first_month_coupon: false,
        first_month_coupon_id: null,
        active: true,
        sort_order: 2,
        is_popular: true,
      },

      // Plus 计划 (月付)
      {
        id: 'stripe_tts_plus_monthly',
        platform: 'stripe',
        product_type: 'text_to_speech',
        plan_name: 'Plus',
        product_id: 'prod_TIDgRn7TQbk9Qn',
        display_name: {
          en: 'Plus Plan',
          'zh-CN': '增强计划',
          'zh-TW': '增強計劃',
          'th-TH': 'แผนพลัส',
        },
        features: {
          en: [
            '2,000,000 characters',
            '2 voice clones (complimentary)',
            'Up to 2,000 characters at a time',
            '3200 ai voices & 70+ languages',
            'Advanced audio noise reduction processing',
            'Unlimited audio downloads',
            '24/7 customer support',
          ],
          'zh-CN': [
            '200万个字符',
            '2 个免费语音克隆',
            '一次最多 2,000 个字符',
            '3200 个 AI 语音和 70+ 种语言',
            '高级音频降噪处理',
            '无限音频下载',
            '24/7 客户支持',
          ],
          'zh-TW': [
            '200萬個字元',
            '2 個免費語音克隆',
            '一次最多 2,000 個字元',
            '3200 個 AI 語音和 70+ 種語言',
            '高級音訊降噪處理',
            '無限音訊下載',
            '24/7 客戶支援',
          ],
          'th-TH': [
            '2,000,000 ตัวอักษร',
            '2 โคลนเสียง (ฟรี)',
            'สูงสุด 2,000 ตัวอักษรต่อครั้ง',
            '3200 เสียง AI และ 70+ ภาษา',
            'การประมวลผลลดเสียงรบกวนขั้นสูง',
            'ดาวน์โหลดเสียงไม่จำกัด',
            'การสนับสนุนลูกค้า 24/7',
          ],
        },
        credits_per_cycle: 2000000,
        cycle_days: 30,
        price: { USD: 34.99, CNY: 238, TWD: 1049, THB: 1199 },
        discounted_price: { USD: 19.99, CNY: 138, TWD: 599, THB: 699 },
        billing_period: 'month',
        enable_first_month_coupon: false,
        first_month_coupon_id: null,
        active: true,
        sort_order: 3,
      },
    ],

    voice_cloning: [
      // Voice Cloning 计划可以在这里添加
    ],
  },
};
