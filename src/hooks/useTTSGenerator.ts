import { useState, useCallback, useEffect, useRef } from 'react';
import { createTtsTask } from '@/actions/tts';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAudioSettings } from '@/contexts/AudioSettingsContext';
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
export function useTTSGenerator(
  maxCharacters: number = 120,
  options?: {
    onTaskSubmitted?: () => void; // 任务成功提交后的回调
  }
) {
  const { t } = useLanguage();
  const { settings: audioSettings } = useAudioSettings();

  // 从 localStorage 恢复上次输入的文本
  const [text, setText] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedText = localStorage.getItem('lastTTSInputText');
      return savedText || '';
    }
    return '';
  });

  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
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
        console.error('[useTTSGenerator] Failed to parse pre-selected voice:', err);
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

  // 处理语音选择（支持同时选择风格）
  const handleVoiceSelect = useCallback((voice: Voice, style: string | null = null) => {
    setSelectedVoice(voice);
    setSelectedStyle(style);
    setError(null);

    // 保存完整的语音对象和风格到 localStorage，记住用户的选择
    try {
      localStorage.setItem('lastSelectedVoice', JSON.stringify(voice));
      if (style) {
        localStorage.setItem('lastSelectedStyle', style);
      } else {
        localStorage.removeItem('lastSelectedStyle');
      }
    } catch (err) {
      console.error('[useTTSGenerator] Failed to save voice to localStorage:', err);
    }
  }, []);

  // 生成音频（提交任务，polling 由 useGenerationHistory 处理）
  const handleGenerate = useCallback(async () => {
    if (!canGenerate || !selectedVoice) {
      setError(t('tts.errors.selectTextAndVoice'));
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      setAudioUrl(null);

      // 调用 Server Action 提交任务（使用 AudioSettings Context 中的音频参数）
      const result = await createTtsTask({
        text,
        voice_name: selectedVoice.name,
        language: selectedVoice.locale,
        style: selectedStyle || undefined, // 语音风格
        speed: audioSettings.speed,
        pitch: audioSettings.pitch,
        volume: audioSettings.volume,
      });

      // 检查是否返回错误（业务逻辑错误，如积分不足）
      if (result.status === 'FAILURE' && result.errorCode) {
        // 根据错误码使用国际化消息
        const errorKey = `tts.errors.${result.errorCode}`;

        // 如果有错误数据，传递给翻译函数进行插值
        const errorMessage = result.errorData
          ? t(errorKey, result.errorData)
          : t(errorKey);

        setError(errorMessage);
        setIsGenerating(false);
        return;
      }

      // Task submitted successfully
      // The generation history hook will poll for updates
      // and the record will appear in the list immediately with PENDING/PROCESSING status
      setIsGenerating(false);

      // 调用成功回调（用于刷新积分等）
      if (options?.onTaskSubmitted) {
        options.onTaskSubmitted();
      }
    } catch (err: unknown) {
      console.error('[useTTSGenerator] Task submit failed:', err);

      // 处理未预期的异常（网络错误、服务器崩溃等）
      if (err instanceof Error) {
        setError(err.message || t('tts.errors.taskSubmitFailed'));
      } else {
        setError(t('tts.errors.taskSubmitFailed'));
      }

      setIsGenerating(false);
    }
  }, [canGenerate, selectedVoice, selectedStyle, text, audioSettings, t, options]);

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
    setAudioUrl(null);
    setError(null);
  }, []);

  return {
    // 状态
    text,
    selectedVoice,
    selectedStyle,
    isGenerating,
    error,
    audioUrl,
    availableCharacters,
    canGenerate,

    // 方法
    handleTextChange,
    handleVoiceSelect,
    handleGenerate,
    handleClearText,
    reset,
  };
}