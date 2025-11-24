/**
 * 开发环境订阅计划配置
 *
 * 特点：
 * - 使用 Stripe 测试模式的 Product ID
 * - 与生产环境相同的配置（便于测试）
 * - 用于本地开发和测试环境
 *
 * 注意：Product ID 是 Stripe 测试模式的 ID
 */

import type { SubscriptionPlansConfig, ProductTypeTabsConfig } from './types';

/**
 * 产品类型 Tab 配置 - 开发环境
 * 开发环境显示所有产品类型（包括未上线的）
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
    enabled: true, // 开发环境启用，便于测试
  },
];

export const subscriptionPlans: SubscriptionPlansConfig = {
  stripe: {
    text_to_speech: [
      // Mini Plan (周付) - 测试模式
      {
        id: 'stripe_tts_mini_weekly',
        platform: 'stripe',
        product_type: null,
        plan_name: 'Mini',
        product_id: 'prod_SQTKEFPeGUz3TA', // Stripe 测试模式 Product ID
        display_name: {
          en: 'Mini Plan',
          'zh-CN': '迷你计划',
          'zh-TW': '迷你計劃',
          'th-TH': 'แผนมินิ',
        },
        tagline: {
          en: 'Perfect for short-term exploration and trying out our TTS services',
          'zh-CN': '适合短期体验和试用我们的 TTS 服务',
          'zh-TW': '適合短期體驗和試用我們的 TTS 服務',
          'th-TH': 'เหมาะสำหรับการสำรวจระยะสั้นและทดลองใช้บริการ TTS ของเรา',
        },
        features: {
          en: [
            '1,500 credits per week (Support for 150,000 characters)',
            '3200+ voices',
            '130+ languages',
            '24/7 customer support',
            'All included in the Premium program',
            'All functions of all subsequent upgraded versions',
          ],
          'zh-CN': [
            '每周 1,500 积分（支持 15 万字符）',
            '3200+ 语音',
            '130+ 语言',
            '24/7 客户支持',
            '包含高级版所有功能',
            '后续升级版本的所有功能',
          ],
          'zh-TW': [
            '每週 1,500 積分（支援 15 萬字元）',
            '3200+ 語音',
            '130+ 語言',
            '24/7 客戶支援',
            '包含高級版所有功能',
            '後續升級版本的所有功能',
          ],
          'th-TH': [
            '1,500 เครดิตต่อสัปดาห์ (รองรับ 150,000 ตัวอักษร)',
            '3200+ เสียง',
            '130+ ภาษา',
            'การสนับสนุนลูกค้า 24/7',
            'รวมทุกอย่างในโปรแกรมพรีเมียม',
            'ฟังก์ชันทั้งหมดของเวอร์ชันอัปเกรดถัดไป',
          ],
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

      // Starter (月付) - 测试模式
      {
        id: 'stripe_tts_starter_monthly',
        platform: 'stripe',
        product_type: null,
        plan_name: 'Starter',
        product_id: 'prod_SQTLdMaqyNSiNu', // Stripe 测试模式 Product ID
        display_name: {
          en: 'Starter',
          'zh-CN': '入门版',
          'zh-TW': '入門版',
          'th-TH': 'สตาร์ทเตอร์',
        },
        tagline: {
          en: 'For beginners who are exploring artificial intelligence speech synthesis for the first time',
          'zh-CN': '适合首次探索人工智能语音合成的初学者',
          'zh-TW': '適合首次探索人工智慧語音合成的初學者',
          'th-TH': 'สำหรับผู้เริ่มต้นที่สำรวจการสังเคราะห์เสียงด้วย AI เป็นครั้งแรก',
        },
        features: {
          en: [
            '3,750 credits per month (Support for 375,000 characters)',
            '3200+ voices',
            '130+ languages',
            '24/7 customer support',
            'All included in the Premium program',
            'All functions of all subsequent upgraded versions',
          ],
          'zh-CN': [
            '每月 3,750 积分（支持 37.5 万字符）',
            '3200+ 语音',
            '130+ 语言',
            '24/7 客户支持',
            '包含高级版所有功能',
            '后续升级版本的所有功能',
          ],
          'zh-TW': [
            '每月 3,750 積分（支援 37.5 萬字元）',
            '3200+ 語音',
            '130+ 語言',
            '24/7 客戶支援',
            '包含高級版所有功能',
            '後續升級版本的所有功能',
          ],
          'th-TH': [
            '3,750 เครดิตต่อเดือน (รองรับ 375,000 ตัวอักษร)',
            '3200+ เสียง',
            '130+ ภาษา',
            'การสนับสนุนลูกค้า 24/7',
            'รวมทุกอย่างในโปรแกรมพรีเมียม',
            'ฟังก์ชันทั้งหมดของเวอร์ชันอัปเกรดถัดไป',
          ],
        },
        credits_per_cycle: 3750,
        cycle_days: 30,
        price: { USD: 17.99 },
        discounted_price: { USD: 8.99 },
        discount_label: '40% OFF',
        billing_period: 'month',
        enable_first_month_coupon: false,
        first_month_coupon_id: null,
        active: true,
        sort_order: 2,
      },

      // Creator (年付) - 测试模式
      {
        id: 'stripe_tts_creator_yearly',
        platform: 'stripe',
        product_type: null,
        plan_name: 'Creator',
        product_id: 'prod_SQTMPjT6NKY2IU', // Stripe 测试模式 Product ID
        display_name: {
          en: 'Creator',
          'zh-CN': '创作者版',
          'zh-TW': '創作者版',
          'th-TH': 'ครีเอเตอร์',
        },
        tagline: {
          en: 'Perfect for regular project creators',
          'zh-CN': '适合常规项目创作者',
          'zh-TW': '適合常規專案創作者',
          'th-TH': 'เหมาะสำหรับผู้สร้างโปรเจกต์ประจำ',
        },
        features: {
          en: [
            '30,000 credits per year (Support for 3,000,000 characters)',
            'All included in the Starter program',
            'More sound parameter adjustment functions',
          ],
          'zh-CN': [
            '每年 30,000 积分（支持 300 万字符）',
            '包含入门版所有功能',
            '更多声音参数调节功能',
          ],
          'zh-TW': [
            '每年 30,000 積分（支援 300 萬字元）',
            '包含入門版所有功能',
            '更多聲音參數調節功能',
          ],
          'th-TH': [
            '30,000 เครดิตต่อปี (รองรับ 3,000,000 ตัวอักษร)',
            'รวมทุกอย่างในโปรแกรมสตาร์ทเตอร์',
            'ฟังก์ชันปรับแต่งพารามิเตอร์เสียงเพิ่มเติม',
          ],
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

    voice_cloning: [
      // Voice Cloning 计划可以在这里添加
    ],
  },
};
