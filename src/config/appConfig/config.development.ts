/**
 * 应用配置 - 开发环境
 */

import type { AppConfig } from './types';

export const appConfig: AppConfig = {
  /**
   * 语音成本配置 - 不同语音类型每字符扣除的积分
   */
  voice_cost: {
    standard: 1,
    professional: 1,
    special: 2,
    clone: 3,
  },

  /**
   * TTS 试听配置
   */
  tts_samples: {
    sample_locales: [
      'zh-CN',
      'zh-TW',
      'en-US',
      'ja-JP',
      'ko-KR',
    ],
    sample_text_max_length: 200,
  },
};
