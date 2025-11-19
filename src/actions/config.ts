'use server';

/**
 * 配置模块 Server Actions
 */
import { getDb, configs } from '@/lib/db';
import { eq, inArray, asc } from 'drizzle-orm';

// 类型定义
export interface Config {
  id: number;
  key: string;
  value: unknown;
  description: string | null;
  config_type: string | null;
  version: number;
  is_active: boolean;
}

/**
 * 获取配置项
 */
export async function getConfig(key: string): Promise<Config | null> {
  const db = await getDb();
  const config = await db.query.configs.findFirst({
    where: eq(configs.key, key),
  });

  if (!config || !config.isActive) {
    return null;
  }

  return {
    id: config.id,
    key: config.key,
    value: config.value,
    description: config.description,
    config_type: config.configType,
    version: config.version,
    is_active: config.isActive,
  };
}

/**
 * 获取配置值
 */
export async function getConfigValue<T = unknown>(key: string): Promise<T | null> {
  const config = await getConfig(key);
  return config ? (config.value as T) : null;
}

/**
 * 获取多个配置项
 */
export async function getConfigs(keys: string[]): Promise<Record<string, unknown>> {
  const db = await getDb();
  const configList = await db.query.configs.findMany({
    where: inArray(configs.key, keys),
  });

  const result: Record<string, unknown> = {};
  for (const config of configList) {
    if (config.isActive) {
      result[config.key] = config.value;
    }
  }

  return result;
}

/**
 * 获取某类型的所有配置
 */
export async function getConfigsByType(configType: string): Promise<Config[]> {
  const db = await getDb();
  const configList = await db.query.configs.findMany({
    where: eq(configs.configType, configType),
    orderBy: [asc(configs.key)],
  });

  return configList
    .filter(c => c.isActive)
    .map((c) => ({
      id: c.id,
      key: c.key,
      value: c.value,
      description: c.description,
      config_type: c.configType,
      version: c.version,
      is_active: c.isActive,
    }));
}

/**
 * 获取语音积分消耗配置
 */
export async function getVoiceCostConfig(): Promise<Record<string, number> | null> {
  return getConfigValue<Record<string, number>>('voice_cost');
}

/**
 * 获取 TTS 示例文本配置
 */
export async function getTtsSamplesConfig(): Promise<Record<string, string> | null> {
  return getConfigValue<Record<string, string>>('tts_samples');
}

/**
 * TTS Demo 配置返回类型
 */
export interface TtsSamplesConfig {
  sample_locales: string[];
  sample_text_max_length: number;
}

/**
 * 获取 TTS Demo 页面配置
 */
export async function getTtsSamples(): Promise<TtsSamplesConfig> {
  const configData = await getConfigs(['tts_sample_locales', 'tts_sample_max_length']);

  return {
    sample_locales: (configData['tts_sample_locales'] as string[]) || ['en-US', 'zh-CN', 'zh-TW', 'ja-JP', 'ko-KR'],
    sample_text_max_length: (configData['tts_sample_max_length'] as number) || 100,
  };
}