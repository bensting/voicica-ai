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
};
