/**
 * 积分消耗配置 - 生产环境
 *
 * 生产环境正式积分消耗规则
 */

import { ProductType } from '../productType';
import type { CreditsCostConfig, VoiceCostConfig, VideoCostConfig } from './types';

export const creditsCostConfig: CreditsCostConfig = {
  [ProductType.TEXT_TO_SPEECH]: 0, // TTS 按字符数计费，由 calculateVoiceCost 计算
  [ProductType.TEXT_TO_VIDEO]: 0, // 视频按分辨率和时长计费，由 calculateVideoCost 计算
  [ProductType.VOICE_CLONING]: 0, // 语音克隆待定
  [ProductType.YOUTUBE_DOWNLOADER]: 1, // YouTube 解析消耗 1 积分
  [ProductType.TIKTOK_DOWNLOADER]: 1, // TikTok 解析消耗 1 积分
  [ProductType.STORY_IDEAS]: 5, // 故事创意生成消耗 5 积分
  [ProductType.STORY_GENERATE]: 10, // 故事内容生成消耗 10 积分
  [ProductType.STORY_ILLUSTRATION]: 10, // 故事插图生成消耗 10 积分/张
};

/**
 * 语音成本配置 - 生产环境
 *
 * 计费规则：每 unit_chars 个字符消耗对应积分，不足也按一个单位计算
 */
export const voiceCostConfig: VoiceCostConfig = {
  unit_chars: 1,
  standard: 1,
  professional: 1,
  celebrity: 2,
  special: 2,
  clone: 3,
};

/**
 * 视频成本配置 - 生产环境
 *
 * 计费规则：根据分辨率和时长固定收费
 * - 768p 10s = 100积分
 * - 768p 15s = 150积分
 * - 1080p 10s = 300积分
 * - 1080p 15s = 450积分
 */
export const videoCostConfig: VideoCostConfig = {
  models: ['veo-3.1'],
  costs: [
    { resolution: '768p', duration: 5, credits: 50 },
    { resolution: '768p', duration: 8, credits: 80 },
    { resolution: '768p', duration: 10, credits: 100 },
    { resolution: '768p', duration: 15, credits: 150 },
    { resolution: '1080p', duration: 5, credits: 150 },
    { resolution: '1080p', duration: 8, credits: 240 },
    { resolution: '1080p', duration: 10, credits: 300 },
    { resolution: '1080p', duration: 15, credits: 450 },
  ],
};