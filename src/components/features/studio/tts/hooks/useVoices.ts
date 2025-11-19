import { useState, useEffect } from 'react';
import { listVoices } from '@/actions/voice';
import type { Voice } from '@/types/voice';

/**
 * 语音数据获取 Hook
 *
 * 注意：此 hook 用于桌面端加载全量语音列表
 * 移动端不应使用此 hook，而是直接调用 API 加载单个语音
 */
export function useVoices() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  // 检测是否为桌面端
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
  }, []);

  useEffect(() => {
    // 只在桌面端执行
    if (!isDesktop) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await listVoices({ is_active: true, page: 1, page_size: 1000 });
        setVoices(response.voices as Voice[]);
        console.log('✅ 成功获取语音列表:', `共 ${response.voices.length} 条`, response.voices[0]);
      } catch (err) {
        const error = err as Error;
        console.error('❌ 获取数据失败:', error);
        setError('Failed to load voices. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [isDesktop]);

  return { voices, loading, error };
}
