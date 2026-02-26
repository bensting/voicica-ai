/**
 * 积分消耗配置 - 生产环境
 *
 * 生产环境正式积分消耗规则
 */

import { ProductType } from '../productType';
import type { CreditsCostConfig, VoiceCostConfig, DialogueCostConfig } from './types';

export const creditsCostConfig: CreditsCostConfig = {
  [ProductType.TEXT_TO_SPEECH]: 0, // TTS 按字符数计费，由 calculateVoiceCost 计算
  [ProductType.TEXT_TO_VIDEO]: 0, // 视频按 creditsMatrix 计费（见 videoModels.ts）
  [ProductType.VOICE_CLONING]: 0, // 语音克隆待定
  [ProductType.YOUTUBE_DOWNLOADER]: 10, // YouTube 解析消耗 10 积分
  [ProductType.VIDEO_DOWNLOADER]: 10, // 通用视频下载消耗 10 积分
  [ProductType.STORY_IDEAS]: 5, // 故事创意生成消耗 5 积分
  [ProductType.STORY_GENERATE]: 10, // 故事内容生成消耗 10 积分
  [ProductType.STORY_ILLUSTRATION]: 10, // 故事插图生成消耗 10 积分/张
  [ProductType.IMAGE_TOOL]: 10, // 图片工具（去背景/高清放大）消耗 1 积分
};

/**
 * 语音成本配置 - 生产环境
 *
 * 计费规则：每 unit_chars 个字符消耗对应积分，不足也按一个单位计算
 * 1个字符 = 1积分
 */
export const voiceCostConfig: VoiceCostConfig = {
  unit_chars: 1,
  standard: 1,
  professional: 1,
  celebrity: 2,
  special: 2,
  clone: 1,
};

/**
 * 对话成本配置 - 生产环境
 *
 * 计费规则：1个字符消耗1积分
 */
export const dialogueCostConfig: DialogueCostConfig = {
  unit_chars: 1,
  credits_per_unit: 1,
};
