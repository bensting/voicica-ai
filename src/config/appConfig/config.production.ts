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
   * 用户积分配置
   */
  credits: {
    anonymous_user: 5,
    registered_user: 20,
  },

  /**
   * 匿名用户配置
   */
  anonymous_user: {
    expiry_days: 30,
  },

  /**
   * 版本检测配置
   */
  version_check: {
    check_interval_minutes: 5,
  },

  /**
   * 每日任务配置
   */
  daily_tasks: {
    checkin_credits: 100,
    ad_reward_tiers: [200, 300, 400, 500, 800, 1000],
    popup_interval_minutes: 30, // 生产环境每 30 分钟最多弹出一次
    enabled: true,
  },

  /**
   * AppLixir 广告配置
   * 生产环境需要配置正确的 ID
   * 从 AppLixir 后台 (https://www.applixir.com/) 的 API Data 页面获取
   */
  applixir: {
    dev_id: 8990,   // Account ID - 从 API Data 页面获取
    zone_id: 2050,  // Zone ID - 生产环境可能需要创建单独的 Zone
    game_id: 9561,  // Site ID - 从 API Data 页面获取
    enabled: true,  // 生产环境启用真实广告
  },
};
