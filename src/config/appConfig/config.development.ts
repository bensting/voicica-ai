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
    anonymous_user: 500,
    registered_user: 1000,
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
   * 每日任务配置
   */
  daily_tasks: {
    checkin_credits: 100,
    ad_reward_tiers: [200, 300, 400, 500, 800, 1000],
    popup_interval_minutes: 1, // 开发环境 1 分钟，方便测试
    enabled: true,
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
