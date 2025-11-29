/**
 * 积分消耗配置 - 开发环境
 *
 * 开发环境不消耗积分，方便测试
 */

import { ProductType } from '../productType';
import type { CreditsCostConfig } from './types';

export const creditsCostConfig: CreditsCostConfig = {
  [ProductType.TEXT_TO_SPEECH]: 0, // TTS 按字符数计费，由 calculateVoiceCost 计算
  [ProductType.VOICE_CLONING]: 0, // 语音克隆待定
  [ProductType.YOUTUBE_DOWNLOADER]: 0, // 开发环境不消耗积分
  [ProductType.TIKTOK_DOWNLOADER]: 0, // 开发环境不消耗积分
};