/**
 * 积分消耗配置 - 开发环境
 *
 * 开发环境不消耗积分，方便测试
 */

import { ProductType } from '../productType';
import type { CreditsCostConfig, VoiceCostConfig, DialogueCostConfig } from './types';

export const creditsCostConfig: CreditsCostConfig = {
  [ProductType.TEXT_TO_SPEECH]: 0, // TTS 按字符数计费，由 calculateVoiceCost 计算
  [ProductType.TEXT_TO_VIDEO]: 0, // 视频按 creditsMatrix 计费（见 videoModels.ts）
  [ProductType.VOICE_CLONING]: 0, // 语音克隆待定
  [ProductType.YOUTUBE_DOWNLOADER]: 1, // YouTube 解析消耗 1 积分
  [ProductType.VIDEO_DOWNLOADER]: 1, // 通用视频下载消耗 1 积分
  [ProductType.STORY_IDEAS]: 10, // 故事创意生成消耗 1 积分（开发环境）
  [ProductType.STORY_GENERATE]: 20, // 故事内容生成消耗 1 积分（开发环境）
  [ProductType.STORY_ILLUSTRATION]: 1, // 故事插图生成消耗 1 积分/张（开发环境）
  [ProductType.IMAGE_TOOL]: 1, // 图片工具（去背景/高清放大）消耗 1 积分
};

/**
 * 语音成本配置 - 开发环境
 *
 * 计费规则：每 unit_chars 个字符消耗对应积分，不足也按一个单位计算
 * 100个字符 = 1积分
 */
export const voiceCostConfig: VoiceCostConfig = {
  unit_chars: 100,
  standard: 1,
  professional: 1,
  celebrity: 2,
  special: 2,
  clone: 1,
};

/**
 * 对话成本配置 - 开发环境
 *
 * 计费规则：100个字符消耗3积分（与生产环境相同）
 */
export const dialogueCostConfig: DialogueCostConfig = {
  unit_chars: 100,
  credits_per_unit: 3,
};