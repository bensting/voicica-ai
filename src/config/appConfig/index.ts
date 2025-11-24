/**
 * 应用配置统一入口
 *
 * 根据环境变量自动选择开发或生产配置
 */

import { appConfig as devConfig } from './config.development';
import { appConfig as prodConfig } from './config.production';
import type { AppConfig, VoiceCostConfig, TtsSamplesConfig } from './types';

// 根据环境选择配置
const isProduction = process.env.NODE_ENV === 'production';
export const appConfig: AppConfig = isProduction ? prodConfig : devConfig;

// 导出类型
export type { AppConfig, VoiceCostConfig, TtsSamplesConfig };

/**
 * 获取语音成本配置
 */
export function getVoiceCostConfig(): VoiceCostConfig {
  return appConfig.voice_cost;
}

/** 语音类型 */
export type VoiceType = 'standard' | 'professional' | 'special' | 'clone';

/**
 * 获取指定语音类型每单位消耗的积分
 */
export function getVoiceCostPerUnit(voiceType: VoiceType): number {
  return appConfig.voice_cost[voiceType];
}

/**
 * 获取计费单位字符数
 */
export function getVoiceCostUnitChars(): number {
  return appConfig.voice_cost.unit_chars;
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
  const { unit_chars } = appConfig.voice_cost;
  const costPerUnit = appConfig.voice_cost[voiceType];
  const units = Math.ceil(charCount / unit_chars);
  return units * costPerUnit;
}

/**
 * 获取 TTS 试听配置
 */
export function getTtsSamplesConfig(): TtsSamplesConfig {
  return appConfig.tts_samples;
}

/**
 * 获取支持的试听语言列表
 */
export function getSampleLocales(): string[] {
  return appConfig.tts_samples.sample_locales;
}

/**
 * 获取试听文本最大长度
 */
export function getSampleTextMaxLength(): number {
  return appConfig.tts_samples.sample_text_max_length;
}
