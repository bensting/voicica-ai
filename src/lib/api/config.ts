import { apiClient } from './client';
import { TtsSamplesConfig } from '@/types/config';

/**
 * 配置相关 API
 */

/**
 * 获取 TTS 试听示例配置
 *
 * **公开接口**，无需认证
 *
 * @returns TTS 试听配置（支持的语言、最大文本长度）
 */
export async function getTtsSamples(): Promise<TtsSamplesConfig> {
  return apiClient.get<TtsSamplesConfig>('/api/v1/config/tts-samples');
}