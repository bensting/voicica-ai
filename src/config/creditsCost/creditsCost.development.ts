/**
 * 积分消耗配置 - 开发环境
 *
 * 开发环境不消耗积分，方便测试
 */

import { ProductType } from '../productType';
import type { CreditsCostConfig, VoiceCostConfig } from './types';

export const creditsCostConfig: CreditsCostConfig = {
  [ProductType.TEXT_TO_SPEECH]: 0, // TTS 按字符数计费，由 calculateVoiceCost 计算
  [ProductType.VOICE_CLONING]: 0, // 语音克隆待定
  [ProductType.YOUTUBE_DOWNLOADER]: 1, // YouTube 解析消耗 1 积分
  [ProductType.TIKTOK_DOWNLOADER]: 1, // TikTok 解析消耗 1 积分
};

/**
 * 语音成本配置 - 开发环境
 *
 * 计费规则：每 unit_chars 个字符消耗对应积分，不足也按一个单位计算
 */
export const voiceCostConfig: VoiceCostConfig = {
  unit_chars: 100,
  standard: 1,
  professional: 1,
  special: 2,
  clone: 3,
};