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
   * AppLixir 广告配置（Web 端）
   * 从 AppLixir 后台 (https://www.applixir.com/) 的 GENERAL 页面获取 API Key
   */
  applixir: {
    api_key: '6efa877c-8828-4355-977a-fd57996ddcbf',
    enabled: true,  // 生产环境启用真实广告
  },

  /**
   * AdMob 广告配置（移动端）
   * 从 Google AdMob 后台获取
   */
  admob: {
    android_app_id: 'ca-app-pub-5946279989031789~1671706051',
    ios_app_id: '', // iOS 应用 ID（待创建）
    android_rewarded_ad_unit_id: 'ca-app-pub-5946279989031789/2057707104',
    ios_rewarded_ad_unit_id: '', // iOS 激励广告单元 ID（待创建）
    enabled: true,  // 生产环境启用真实广告
  },
};
