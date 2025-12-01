/**
 * 积分消耗配置统一入口
 *
 * 根据环境变量自动选择开发或生产配置
 */

import {
  creditsCostConfig as devConfig,
  voiceCostConfig as devVoiceCost,
  videoCostConfig as devVideoCost,
} from './creditsCost.development';
import {
  creditsCostConfig as prodConfig,
  voiceCostConfig as prodVoiceCost,
  videoCostConfig as prodVideoCost,
} from './creditsCost.production';
import type {
  CreditsCostConfig,
  VoiceCostConfig,
  VideoCostConfig,
  VideoResolution,
  VideoDuration,
} from './types';
import { ProductType } from '../productType';

// 根据环境选择配置
const isProduction = process.env.NODE_ENV === 'production';
export const creditsCostConfig: CreditsCostConfig = isProduction ? prodConfig : devConfig;
export const voiceCostConfig: VoiceCostConfig = isProduction ? prodVoiceCost : devVoiceCost;
export const videoCostConfig: VideoCostConfig = isProduction ? prodVideoCost : devVideoCost;

// 导出类型
export type {
  CreditsCostConfig,
  VoiceCostConfig,
  VideoCostConfig,
  VideoResolution,
  VideoDuration,
  VideoCostItem,
} from './types';

/** 语音类型 */
export type VoiceType = 'standard' | 'professional' | 'special' | 'clone';

/**
 * 计算积分消耗的选项参数
 */
export interface CalculateCostOptions {
  /** TTS: 字符数 */
  charCount?: number;
  /** TTS: 语音类型 */
  voiceType?: VoiceType;
  /** Video: 分辨率 */
  resolution?: VideoResolution;
  /** Video: 时长（秒） */
  duration?: VideoDuration;
}

/**
 * 【统一入口】计算产品积分消耗
 *
 * 所有产品的积分计算都应该使用此函数
 *
 * @param productType 产品类型
 * @param options 计算选项（不同产品需要不同参数）
 * @returns 需要消耗的积分数
 *
 * @example
 * // YouTube/TikTok 下载器（固定积分）
 * const cost1 = calculateProductCreditsCost(ProductType.YOUTUBE_DOWNLOADER);
 *
 * // TTS（动态计算）
 * const cost2 = calculateProductCreditsCost(ProductType.TEXT_TO_SPEECH, {
 *   charCount: 150,
 *   voiceType: 'standard'
 * });
 */
export function calculateProductCreditsCost(
  productType: ProductType,
  options?: CalculateCostOptions
): number {
  // TTS 特殊处理：根据字符数和语音类型动态计算
  if (productType === ProductType.TEXT_TO_SPEECH) {
    if (!options?.charCount || !options?.voiceType) {
      throw new Error('TEXT_TO_SPEECH requires charCount and voiceType in options');
    }
    return calculateVoiceCost(options.charCount, options.voiceType);
  }

  // 视频特殊处理：根据分辨率和时长计算
  if (productType === ProductType.TEXT_TO_VIDEO) {
    if (!options?.resolution || !options?.duration) {
      throw new Error('TEXT_TO_VIDEO requires resolution and duration in options');
    }
    return calculateVideoCost(options.resolution, options.duration);
  }

  // 其他产品：使用固定积分消耗
  return creditsCostConfig[productType] ?? 0;
}

/**
 * 获取所有产品类型的积分消耗配置（用于调试）
 */
export function getAllCreditsCosts() {
  return {
    environment: isProduction ? 'production' : 'development',
    config: creditsCostConfig,
  };
}

/**
 * 获取语音成本配置
 */
export function getVoiceCostConfig(): VoiceCostConfig {
  return voiceCostConfig;
}

/**
 * 获取指定语音类型每单位消耗的积分
 */
export function getVoiceCostPerUnit(voiceType: VoiceType): number {
  return voiceCostConfig[voiceType];
}

/**
 * 获取计费单位字符数
 */
export function getVoiceCostUnitChars(): number {
  return voiceCostConfig.unit_chars;
}

/**
 * 计算指定字符数和语音类型需要消耗的积分
 *
 * 计费规则：每 unit_chars 个字符消耗对应积分，不足也按一个单位计算
 * 例如：unit_chars=100, standard=1 时，101个字符消耗2积分
 *
 * @param charCount 字符数
 * @param voiceType 语音类型
 * @returns 需要消耗的积分数
 */
export function calculateVoiceCost(charCount: number, voiceType: VoiceType): number {
  const { unit_chars } = voiceCostConfig;
  const costPerUnit = voiceCostConfig[voiceType];
  const units = Math.ceil(charCount / unit_chars);
  return units * costPerUnit;
}

// ==================== 视频成本相关函数 ====================

/**
 * 获取视频成本配置
 */
export function getVideoCostConfig(): VideoCostConfig {
  return videoCostConfig;
}

/**
 * 获取支持的视频模型列表
 */
export function getSupportedVideoModels(): string[] {
  return videoCostConfig.models;
}

/**
 * 获取支持的分辨率列表
 */
export function getSupportedVideoResolutions(): VideoResolution[] {
  const resolutions = new Set(videoCostConfig.costs.map((c) => c.resolution));
  return Array.from(resolutions);
}

/**
 * 获取指定分辨率支持的时长列表
 */
export function getSupportedVideoDurations(resolution: VideoResolution): VideoDuration[] {
  return videoCostConfig.costs.filter((c) => c.resolution === resolution).map((c) => c.duration);
}

/**
 * 计算视频生成需要消耗的积分
 *
 * @param resolution 分辨率 (768p, 1080p)
 * @param duration 时长（秒）
 * @returns 需要消耗的积分数，找不到配置返回 0
 *
 * @example
 * calculateVideoCost('768p', 10)  // 返回 100 (生产环境)
 * calculateVideoCost('1080p', 15) // 返回 450 (生产环境)
 */
export function calculateVideoCost(resolution: VideoResolution, duration: VideoDuration): number {
  const costItem = videoCostConfig.costs.find(
    (c) => c.resolution === resolution && c.duration === duration
  );
  return costItem?.credits ?? 0;
}

/**
 * 获取所有视频成本配置项（用于 UI 展示）
 */
export function getAllVideoCostItems() {
  return videoCostConfig.costs;
}

/**
 * 检查视频模型是否支持
 */
export function isVideoModelSupported(model: string): boolean {
  return videoCostConfig.models.includes(model);
}