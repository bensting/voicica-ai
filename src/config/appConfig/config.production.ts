/**
 * 应用配置 - 生产环境
 */

import type { AppConfig } from './types';

export const appConfig: AppConfig = {
  /**
   * 语音成本配置
   * 计费规则：每 unit_chars 个字符消耗对应积分，不足也按一个单位计算
   */
  voice_cost: {
    unit_chars: 100,
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
};
