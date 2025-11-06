import { useState, useEffect, useCallback } from 'react';
import { voiceAPI } from '@/lib/api';
import type { Voice } from '@/types/voice';

interface UseVoicesOptions {
  /** 语言区域代码 */
  locale?: string;
  /** 是否启用自动加载 */
  enabled?: boolean;
}

interface UseVoicesReturn {
  /** 语音列表 */
  voices: Voice[];
  /** 加载状态 */
  isLoading: boolean;
  /** 错误信息 */
  error: Error | null;
  /** 重新加载 */
  refetch: () => Promise<void>;
}

/**
 * 获取语音列表 Hook
 *
 * 功能：
 * - 根据 locale 自动获取语音列表
 * - 支持加载状态和错误处理
 * - locale 变化时自动重新加载
 * - 提供手动刷新方法
 *
 * @example
 * const { voices, isLoading, error } = useVoices({ locale: 'en-US' });
 */
export function useVoices({ locale, enabled = true }: UseVoicesOptions = {}): UseVoicesReturn {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchVoices = useCallback(async () => {
    if (!enabled) return;

    try {
      setIsLoading(true);
      setError(null);

      const params: Record<string, unknown> = {
        is_active: true,
        limit: 3, // 只获取 3 条数据用于 TTS 演示
      };

      if (locale) {
        params.locale = locale;
      }

      console.log('🎤 获取语音列表:', params);
      const response = await voiceAPI.getVoices(params);

      // API 返回的数据结构是 { voices: Voice[], total, page, ... }
      const voiceList = response.voices || [];

      setVoices(voiceList);
      console.log(`✅ 成功加载 ${voiceList.length} 个语音`, voiceList);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch voices');
      setError(error);
      console.error('❌ 获取语音列表失败:', error);
      // 失败时使用空数组
      setVoices([]);
    } finally {
      setIsLoading(false);
    }
  }, [locale, enabled]);

  // locale 变化时重新加载
  useEffect(() => {
    fetchVoices();
  }, [fetchVoices]);

  return {
    voices,
    isLoading,
    error,
    refetch: fetchVoices,
  };
}