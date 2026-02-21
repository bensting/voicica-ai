/**
 * 应用配置 - 开发环境
 */

import type { AppConfig } from './types';

export const appConfig: AppConfig = {
  /**
   * TTS 试听配置
   */
  tts_samples: {
    sample_locales: [
      'en-US',
      'zh-CN',
      'zh-TW',
      'th-TH',
      'ja-JP',
      'ko-KR',
    ],
    sample_text_max_length: 200,
  },

  /**
   * 新用户首次登录用户积分配置
   */
  credits: {
    // Web 端
    anonymous_user: 50,
    registered_user: 100,
    // Native App 端
    native: {
      anonymous_user: 0,    // Native 匿名用户不赠送积分
      registered_user: 100, // Native 登录用户赠送 100 积分
    },
  },

  /**
   * 匿名用户配置
   */
  anonymous_user: {
    expiry_days: 30,
    tts_daily_limit: 1, // 开发环境设大一点方便测试
  },

  /**
   * 版本检测配置
   */
  version_check: {
    check_interval_minutes: 1, // 开发环境设为 1 分钟，方便测试
  },

  /**
   * 每日任务配置 (Studio Web 端)
   */
  daily_tasks: {
    checkin_credits: 50,
    ad_reward_tiers: [1, 1, 2, 2, 3, 3],
    max_daily_ad_views: 10, // 开发环境 10 次，方便测试
    popup_interval_minutes: 5, // 开发环境 5 分钟，方便测试
    enabled: true, // 开发环境启用，方便测试挖矿经济
    // Native App 独立配置
    native: {
      checkin_credits: 50,
      ad_reward_tiers: [1, 1, 2, 2, 3, 3],
      max_daily_ad_views: 10, // 开发环境 10 次，方便测试
      popup_interval_minutes: 5, // 开发环境 5 分钟，方便测试
      enabled: true,
    },
  },

  /**
   * 挖矿经济配置（开发环境分成比例更高）
   */
  mining_economy: {
    token_value_usd: 0.0001,
    revenue_share_ratio: 0.8,
    random_multiplier: [0.8, 1.2],
    currency_to_usd: {
      USD: 1,
      THB: 0.030,
    },
    estimated_ecpm_by_country: {
      US: 25, CA: 22, AU: 20, GB: 18, DE: 17, FR: 16, JP: 20, KR: 18,
      TW: 12, HK: 14, SG: 12,
      TH: 6, MY: 5, PH: 4, ID: 3,
      IN: 2, VN: 3,
    },
    default_ecpm_usd: 5,
  },

  /**
   * Google Play 应用更新配置
   */
  app_update: {
    enabled: false, // 开发环境禁用
    check_interval_minutes: 1,
    install_prompt_delay_seconds: 3,
  },
};
