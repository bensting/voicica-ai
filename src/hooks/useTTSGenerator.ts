import { useState, useCallback, useEffect, useRef } from 'react';
import { generateTTS } from '@/lib/api/tts';
import { useLanguage } from '@/contexts/LanguageContext';
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
  const { t } = useLanguage();

  // 从 localStorage 恢复上次输入的文本
  const [text, setText] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedText = localStorage.getItem('lastTTSInputText');
      return savedText || '';
    }
    return '';
  });

  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [speed, setSpeed] = useState(1.0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Ref to track if we've already loaded the pre-selected voice
  const hasLoadedPreSelection = useRef(false);

  // Check for pre-selected voice from sessionStorage (from Voices Gallery page)
  // Only run once to prevent infinite render loop
  useEffect(() => {
    // Only run once
    if (hasLoadedPreSelection.current) return;

    const preSelectedVoiceStr = sessionStorage.getItem('ttsPreSelectedVoice');
    if (preSelectedVoiceStr) {
      try {
        const preSelectedVoice = JSON.parse(preSelectedVoiceStr) as Voice;

        // Only update if it's a different voice
        if (!selectedVoice || selectedVoice.id !== preSelectedVoice.id) {
          console.log('✅ [useTTSGenerator] Loaded pre-selected voice from Voices Gallery:', preSelectedVoice.name);

          // Clear the module-level cache in MobileTTSPage to prevent it from using old default voice
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('clearVoiceCache', 'true');
            sessionStorage.setItem('voicePreSelectedFromGallery', 'true');
          }

          setSelectedVoice(preSelectedVoice);
          hasLoadedPreSelection.current = true; // Mark as loaded
        }

        // Clear after applying
        sessionStorage.removeItem('ttsPreSelectedVoice');
      } catch (err) {
        console.error('❌ Failed to parse pre-selected voice:', err);
        sessionStorage.removeItem('ttsPreSelectedVoice');
      }
    }
  }, [selectedVoice]); // ✅ Now has dependency array

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

        // 保存到 localStorage，记住用户输入的内容
        try {
          localStorage.setItem('lastTTSInputText', newText);
        } catch (err) {
          console.error('Failed to save text to localStorage:', err);
        }
      }
    },
    [maxCharacters]
  );

  // 处理语音选择
  const handleVoiceSelect = useCallback((voice: Voice) => {
    setSelectedVoice(voice);
    setError(null);

    // 保存完整的语音对象到 localStorage，记住用户的选择
    try {
      localStorage.setItem('lastSelectedVoice', JSON.stringify(voice));
      console.log('💾 [useTTSGenerator] Saved last selected voice:', voice.display_name, voice.id);
    } catch (err) {
      console.error('Failed to save voice to localStorage:', err);
    }
  }, []);

  // 处理速度变化
  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
  }, []);

  // 生成音频（提交任务，polling 由 useGenerationHistory 处理）
  const handleGenerate = useCallback(async () => {
    if (!canGenerate || !selectedVoice) {
      setError(t('studio.errors.selectTextAndVoice'));
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      setAudioUrl(null);

      console.log('🎤 [useTTSGenerator] 开始生成音频', {
        text,
        voice: selectedVoice.name,
        language: selectedVoice.locale,
        speed,
      });

      // 调用后端 API 提交任务
      const result = await generateTTS({
        text,
        voiceName: selectedVoice.name,
        language: selectedVoice.locale,
        speed,
      });

      console.log('✅ [useTTSGenerator] 任务已提交，task_id:', result.task_id);

      // Task submitted successfully
      // The generation history hook will poll for updates
      // and the record will appear in the list immediately with PENDING/PROCESSING status
      setIsGenerating(false);
    } catch (err: unknown) {
      console.error('❌ [useTTSGenerator] 提交任务失败', err);

      // 处理不同类型的错误
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { status?: number; data?: { detail?: string } } };
        const status = axiosError.response?.status;
        const detail = axiosError.response?.data?.detail;

        if (status === 400) {
          setError(detail || t('studio.errors.invalidParams'));
        } else if (status === 402 || (detail && detail.includes('Insufficient credits'))) {
          setError(t('studio.errors.insufficientCredits'));
        } else if (status === 401) {
          setError(t('studio.errors.unauthorized'));
        } else {
          setError(detail || t('studio.errors.taskSubmitFailed'));
        }
      } else if (err instanceof Error) {
        setError(err.message || t('studio.errors.taskSubmitFailed'));
      } else {
        setError(t('studio.errors.taskSubmitFailed'));
      }

      setIsGenerating(false);
    }
  }, [canGenerate, selectedVoice, text, speed, t]);

  // 清空文本输入
  const handleClearText = useCallback(() => {
    setText('');
    setError(null);

    // 同时清除 localStorage 中的保存
    try {
      localStorage.removeItem('lastTTSInputText');
    } catch (err) {
      console.error('Failed to clear text from localStorage:', err);
    }
  }, []);

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
    handleClearText,
    reset,
  };
}