import { useState, useCallback, useEffect } from 'react';
import { generateTTS } from '@/lib/api/tts';
import { TaskStatus } from '@/types/tts';
import { useCredits } from '@/contexts/CreditsContext';
import type { Voice } from '@/types/voice';

/**
 * @deprecated Use Voice from '@/types/voice' instead
 * Kept for backward compatibility
 */
export type VoiceModel = Voice;

/**
 * TTS 生成器业务逻辑 Hook
 *
 * 职责：
 * - 管理文本输入
 * - 管理选中的语音模型
 * - 处理生成逻辑
 * - 字符限制校验
 */
export function useTTSGenerator(maxCharacters: number = 120) {
  const { refreshCredits, deductCredits } = useCredits();
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<VoiceModel | null>(null);
  const [speed, setSpeed] = useState(1.0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Check for pre-selected voice from sessionStorage (from Voices Gallery page)
  useEffect(() => {
    const preSelectedVoiceStr = sessionStorage.getItem('ttsPreSelectedVoice');
    if (preSelectedVoiceStr) {
      try {
        const preSelectedVoice = JSON.parse(preSelectedVoiceStr) as Voice;

        console.log('✅ [useTTSGenerator] Loaded pre-selected voice from Voices Gallery:', preSelectedVoice.name);

        // Clear the module-level cache in MobileTTSPage to prevent it from using old default voice
        // We need to do this BEFORE setting the voice to ensure the cache is cleared
        if (typeof window !== 'undefined') {
          // Signal to MobileTTSPage to clear its cache
          sessionStorage.setItem('clearVoiceCache', 'true');
          // Also set a flag to indicate voice was pre-selected from gallery
          // This prevents mobile page from overriding with default voice
          sessionStorage.setItem('voicePreSelectedFromGallery', 'true');
        }

        setSelectedVoice(preSelectedVoice);
        // DON'T remove ttsPreSelectedVoice immediately - keep it until MobileTTSPage reads the flag
        // sessionStorage.removeItem('ttsPreSelectedVoice');
      } catch (err) {
        console.error('❌ Failed to parse pre-selected voice:', err);
        sessionStorage.removeItem('ttsPreSelectedVoice');
      }
    }
  }, []);

  // 可用字符数
  const availableCharacters = maxCharacters - text.length;
  const isTextValid = text.length > 0 && text.length <= maxCharacters;
  const canGenerate = isTextValid && selectedVoice !== null && !isGenerating;

  // 处理文本变化
  const handleTextChange = useCallback(
    (newText: string) => {
      if (newText.length <= maxCharacters) {
        setText(newText);
        setError(null);
      }
    },
    [maxCharacters]
  );

  // 处理语音选择
  const handleVoiceSelect = useCallback((voice: VoiceModel) => {
    setSelectedVoice(voice);
    setError(null);
  }, []);

  // 处理速度变化
  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
  }, []);

  // 生成音频
  const handleGenerate = useCallback(async () => {
    if (!canGenerate || !selectedVoice) {
      setError('Please enter text and select a voice');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      setAudioUrl(null);

      console.log('🎤 开始生成音频', {
        text,
        voice: selectedVoice.name,
        voiceId: selectedVoice.id,
        language: selectedVoice.locale,
        speed,
      });

      // 调用后端 API 生成音频
      const result = await generateTTS({
        text,
        voiceId: selectedVoice.id,
        language: selectedVoice.locale,
        speed,
      });

      console.log('📦 收到 API 响应', result);

      // 检查生成结果
      if (result.status === TaskStatus.SUCCESS && result.result?.audio_url) {
        setAudioUrl(result.result.audio_url);
        console.log('✅ 音频生成成功', {
          audioUrl: result.result.audio_url,
          duration: result.result.duration,
          creditsCost: result.result.credits_cost,
        });

        // 生成成功后刷新积分
        if (result.result.credits_cost) {
          // 先乐观更新（立即扣减）
          deductCredits(result.result.credits_cost);
          // 然后从服务器刷新准确值
          void refreshCredits();
        }
      } else if (result.status === TaskStatus.FAILURE) {
        const errorMsg = result.error || '生成失败，请重试';
        setError(errorMsg);
        console.error('❌ 音频生成失败', errorMsg);
      } else {
        setError('生成状态异常，请重试');
        console.error('❌ 意外的生成状态', result);
      }
    } catch (err: unknown) {
      console.error('❌ 音频生成异常', err);

      // 处理不同类型的错误
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { status?: number; data?: { detail?: string } } };
        const status = axiosError.response?.status;
        const detail = axiosError.response?.data?.detail;

        if (status === 400) {
          setError(detail || '请求参数错误，请检查输入');
        } else if (status === 402 || (detail && detail.includes('Insufficient credits'))) {
          setError('积分不足，请升级套餐或充值');
        } else if (status === 504) {
          setError('生成超时，请尝试缩短文本或稍后重试');
        } else if (status === 401) {
          setError('未登录或登录已过期，请重新登录');
        } else {
          setError(detail || '生成失败，请重试');
        }
      } else if (err instanceof Error) {
        setError(err.message || '生成失败，请重试');
      } else {
        setError('生成失败，请重试');
      }
    } finally {
      setIsGenerating(false);
    }
  }, [canGenerate, selectedVoice, text, speed, deductCredits, refreshCredits]);

  // 重置
  const reset = useCallback(() => {
    setText('');
    setSelectedVoice(null);
    setSpeed(1.0);
    setAudioUrl(null);
    setError(null);
  }, []);

  return {
    // 状态
    text,
    selectedVoice,
    speed,
    isGenerating,
    error,
    audioUrl,
    availableCharacters,
    canGenerate,

    // 方法
    handleTextChange,
    handleVoiceSelect,
    handleSpeedChange,
    handleGenerate,
    reset,
  };
}