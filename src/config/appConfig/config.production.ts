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
   * 月度福利配置
   */
  monthly_rewards: {
    anonymous_credits: 2000,
    login_credits: 50000,
    app_download_credits: 50000,
    popup_max_per_day: 2,
    enabled: true,
  },
};
