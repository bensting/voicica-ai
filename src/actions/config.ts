'use server';

/**
 * 配置模块 Server Actions
 */
import prisma from '@/lib/prisma';

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
  const config = await prisma.configs.findUnique({
    where: { key },
  });

  if (!config || !config.is_active) {
    return null;
  }

  return {
    id: config.id,
    key: config.key,
    value: config.value,
    description: config.description,
    config_type: config.config_type,
    version: config.version,
    is_active: config.is_active,
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
  const configs = await prisma.configs.findMany({
    where: {
      key: { in: keys },
      is_active: true,
    },
  });

  const result: Record<string, unknown> = {};
  for (const config of configs) {
    result[config.key] = config.value;
  }

  return result;
}

/**
 * 获取某类型的所有配置
 */
export async function getConfigsByType(configType: string): Promise<Config[]> {
  const configs = await prisma.configs.findMany({
    where: {
      config_type: configType,
      is_active: true,
    },
    orderBy: { key: 'asc' },
  });

  return configs.map((c) => ({
    id: c.id,
    key: c.key,
    value: c.value,
    description: c.description,
    config_type: c.config_type,
    version: c.version,
    is_active: c.is_active,
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
  const configs = await getConfigs(['tts_sample_locales', 'tts_sample_max_length']);

  return {
    sample_locales: (configs['tts_sample_locales'] as string[]) || ['en-US', 'zh-CN', 'zh-TW', 'ja-JP', 'ko-KR'],
    sample_text_max_length: (configs['tts_sample_max_length'] as number) || 100,
  };
}
