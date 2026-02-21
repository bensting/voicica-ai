/**
 * 应用配置 - 生产环境
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
    tts_daily_limit: 1, // 生产环境每日 1 次免费
  },

  /**
   * APK 版本检测配置
   */
  version_check: {
    check_interval_minutes: 5,
  },

  /**
   * 每日任务配置 (Studio Web 端)
   */
  daily_tasks: {
    checkin_credits: 1,
    ad_reward_tiers: [1, 1, 1, 1, 1, 1],
    popup_interval_minutes: 30, // 生产环境每 30 分钟最多弹出一次
    enabled: false,
    // Native App 独立配置
    native: {
      checkin_credits: 50,
      ad_reward_tiers: [1, 1, 2, 2, 3, 3],
      popup_interval_minutes: 30,
      enabled: true,
    },
  },

  /**
   * 挖矿经济配置
   */
  mining_economy: {
    token_value_usd: 0.0001,
    revenue_share_ratio: 0.7,
    random_multiplier: [0.8, 1.2],
    estimated_ecpm_by_country: {
      // T1 高收益国家
      US: 25, CA: 22, AU: 20, GB: 18, DE: 17, FR: 16, JP: 20, KR: 18,
      NZ: 16, CH: 20, NO: 18, SE: 16, DK: 16, AT: 15, NL: 15, BE: 14,
      // T2 中等收益
      TW: 12, HK: 14, SG: 12, IL: 12,
      BR: 8, MX: 7, AR: 6, CL: 7, CO: 6,
      TH: 6, MY: 5, PH: 4, ID: 3,
      SA: 10, AE: 12, TR: 5, PL: 7, CZ: 7, RO: 5,
      // T3 低收益国家
      IN: 2, PK: 1.5, BD: 1, LK: 2,
      VN: 3, MM: 1.5, KH: 2, LA: 1.5,
      NG: 2, KE: 2, EG: 3, ZA: 5,
    },
    default_ecpm_usd: 5,
  },

  /**
   * Google Play 应用更新配置
   */
  app_update: {
    enabled: true,
    check_interval_minutes: 60, // 每小时检查一次
    install_prompt_delay_seconds: 3, // 下载完成后 3 秒提示安装
  },
};
