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
   * 用户积分配置
   */
  credits: {
    anonymous_user: 0,
    registered_user: 0,
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
   * AppLixir 广告配置（Web 端）
   */
  applixir: {
    api_key: '6efa877c-8828-4355-977a-fd57996ddcbf',
    enabled: true,  // 开发环境也启用，方便测试
  },

  /**
   * AdMob 广告配置（移动端）
   * 开发环境使用 Google 提供的测试广告 ID
   * https://developers.google.com/admob/android/test-ads
   */
  admob: {
    android_app_id: 'ca-app-pub-3940256099942544~3347511713', // Google 测试应用 ID
    ios_app_id: 'ca-app-pub-3940256099942544~1458002511', // Google 测试应用 ID
    android_rewarded_ad_unit_id: 'ca-app-pub-3940256099942544/5224354917', // Google 测试激励广告
    ios_rewarded_ad_unit_id: 'ca-app-pub-3940256099942544/1712485313', // Google 测试激励广告
    enabled: false,  // 开发环境使用测试广告
  },
};
