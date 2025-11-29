/**
 * 积分消耗配置 - 生产环境
 *
 * 生产环境正式积分消耗规则
 */

import { ProductType } from '../productType';
import type { CreditsCostConfig } from './types';

export const creditsCostConfig: CreditsCostConfig = {
  [ProductType.TEXT_TO_SPEECH]: 0, // TTS 按字符数计费，由 calculateVoiceCost 计算
  [ProductType.VOICE_CLONING]: 0, // 语音克隆待定
  [ProductType.YOUTUBE_DOWNLOADER]: 1, // YouTube 解析消耗 1 积分
  [ProductType.TIKTOK_DOWNLOADER]: 1, // TikTok 解析消耗 1 积分
};