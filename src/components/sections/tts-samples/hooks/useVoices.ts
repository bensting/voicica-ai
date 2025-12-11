import { useState, useEffect, useCallback } from 'react';
import { getSampleVoices } from '@/actions/voice';
import type { Voice } from '@/types/voice';

interface UseVoicesOptions {
  /** 语言区域代码 */
  locale?: string;
  /** 是否启用自动加载 */
  enabled?: boolean;
  /** 获取数量，默认 3 */
  limit?: number;
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
 * 获取语音列表 Hook（使用缓存）
 *
 * 功能：
 * - 根据 locale 自动获取语音列表
 * - 使用 getSampleVoices 复用服务端缓存
 * - 支持加载状态和错误处理
 * - locale 变化时自动重新加载
 * - 提供手动刷新方法
 *
 * @example
 * const { voices, isLoading, error } = useVoices({ locale: 'en-US' });
 */
export function useVoices({ locale, enabled = true, limit = 3 }: UseVoicesOptions = {}): UseVoicesReturn {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchVoices = useCallback(async () => {
    if (!enabled || !locale) return;

    try {
      setIsLoading(true);
      setError(null);

      // 使用缓存的 getSampleVoices，复用 locale 缓存
      const voiceList = await getSampleVoices(locale, limit);

      setVoices(voiceList);
      console.log(`✅ 成功加载 ${voiceList.length} 个语音 (locale: ${locale})`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch voices');
      setError(error);
      console.error('❌ 获取语音列表失败:', error);
      // 失败时使用空数组
      setVoices([]);
    } finally {
      setIsLoading(false);
    }
  }, [locale, enabled, limit]);

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