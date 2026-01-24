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
   * 每日任务配置
   */
  daily_tasks: {
    checkin_credits: 1,
    ad_reward_tiers: [1, 1, 2, 2, 3, 3],
    popup_interval_minutes: 5, // 开发环境 1 分钟，方便测试
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
