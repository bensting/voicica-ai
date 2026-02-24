/**
 * 应用配置统一入口
 *
 * 根据环境变量自动选择开发或生产配置
 */

import { appConfig as devConfig } from './config.development';
import { appConfig as prodConfig } from './config.production';
import type { AppConfig, TtsSamplesConfig, DailyTasksConfig, DailyTasksBaseConfig, MiningEconomyConfig, AppUpdateConfig, AnonymousUserConfig, ConversionConfig } from './types';

// 导出语音成本相关功能（从 creditsCost 重新导出以保持向后兼容）
export {
  type VoiceCostConfig,
  type VoiceType,
  getVoiceCostConfig,
  getVoiceCostPerUnit,
  getVoiceCostUnitChars,
  calculateVoiceCost,
} from '../creditsCost';

// 根据环境选择配置
const isProduction = process.env.NODE_ENV === 'production';
export const appConfig: AppConfig = isProduction ? prodConfig : devConfig;

// 导出类型
export type { AppConfig, TtsSamplesConfig, DailyTasksConfig, DailyTasksBaseConfig, MiningEconomyConfig, AppUpdateConfig, AnonymousUserConfig, ConversionConfig };

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

/**
 * 获取每日任务配置
 * @param isNative 是否为原生应用，如果是则返回 native 配置（如果存在）
 */
export function getDailyTasksConfig(isNative: boolean = false): DailyTasksBaseConfig {
  const config = appConfig.daily_tasks;
  // 如果是原生应用且有独立配置，则使用 native 配置
  if (isNative && config.native) {
    return config.native;
  }
  // 否则返回默认配置（排除 native 属性）
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { native: _native, ...baseConfig } = config;
  return baseConfig;
}

/**
 * 获取挖矿经济配置
 */
export function getMiningEconomyConfig(): MiningEconomyConfig {
  return appConfig.mining_economy;
}

/**
 * 获取应用更新配置
 */
export function getAppUpdateConfig(): AppUpdateConfig {
  return appConfig.app_update;
}

/**
 * 获取匿名用户配置
 */
export function getAnonymousUserConfig(): AnonymousUserConfig {
  return appConfig.anonymous_user;
}

/**
 * 获取兑换配置
 */
export function getConversionConfig(): ConversionConfig {
  return appConfig.mining_economy.conversion;
}

/**
 * 检查每日任务是否启用
 * @param isNative 是否为原生应用
 */
export function isDailyTasksEnabled(isNative: boolean = false): boolean {
  const config = getDailyTasksConfig(isNative);
  return config.enabled;
}
