import { useState, useEffect } from 'react';
import type { VoiceModel } from '@/hooks/useTTSGenerator';
import { voiceAPI } from '@/lib/api';

/**
 * 语音数据获取 Hook
 */
export function useVoices() {
  const [voices, setVoices] = useState<VoiceModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const voicesData = await voiceAPI.getVoices({ is_active: true, limit: 1000 });
        setVoices(voicesData as VoiceModel[]);
        console.log('✅ 成功获取语音列表:', voicesData);
      } catch (err) {
        const error = err as Error;
        console.error('❌ 获取数据失败:', error);
        setError('Failed to load voices. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, []);

  return { voices, loading, error };
}
