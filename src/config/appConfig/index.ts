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

/**
 * 获取指定语音类型的成本
 */
export function getVoiceCost(voiceType: keyof VoiceCostConfig): number {
  return appConfig.voice_cost[voiceType];
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
