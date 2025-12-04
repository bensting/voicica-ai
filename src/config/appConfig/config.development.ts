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
    anonymous_user: 5,
    registered_user: 10,
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
};
