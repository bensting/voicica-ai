import { useState, useCallback, useEffect, useRef } from 'react';
import { generateTTS, getTaskStatus } from '@/lib/api/tts';
import { TaskStatus } from '@/types/tts';
import { useCredits } from '@/contexts/CreditsContext';
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
  const { refreshCredits, deductCredits } = useCredits();
  const { t } = useLanguage();
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [speed, setSpeed] = useState(1.0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // 轮询相关状态
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [taskProgress, setTaskProgress] = useState(0);

  // Check for pre-selected voice from sessionStorage (from Voices Gallery page)
  // Run on every render to catch updates when navigating back from voices page
  useEffect(() => {
    const preSelectedVoiceStr = sessionStorage.getItem('ttsPreSelectedVoice');
    if (preSelectedVoiceStr) {
      try {
        const preSelectedVoice = JSON.parse(preSelectedVoiceStr) as Voice;

        // Only update if it's a different voice
        if (!selectedVoice || selectedVoice.id !== preSelectedVoice.id) {
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
        }

        // Clear after applying to prevent re-applying on every render
        sessionStorage.removeItem('ttsPreSelectedVoice');
      } catch (err) {
        console.error('❌ Failed to parse pre-selected voice:', err);
        sessionStorage.removeItem('ttsPreSelectedVoice');
      }
    }
  }); // No dependency array - runs on every render to catch navigation updates

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
  const handleVoiceSelect = useCallback((voice: Voice) => {
    setSelectedVoice(voice);
    setError(null);
  }, []);

  // 处理速度变化
  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
  }, []);

  // 清理轮询定时器
  const clearPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearTimeout(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      clearPolling();
    };
  }, [clearPolling]);

  // 轮询任务状态
  const pollTaskStatus = useCallback(async (taskId: string, attemptCount: number = 0) => {
    try {
      console.log(`🔄 轮询任务状态 (第 ${attemptCount + 1} 次)`, taskId);

      const result = await getTaskStatus(taskId);

      console.log('📊 任务状态:', {
        status: result.status,
        progress: result.progress,
        hasResult: !!result.result,
        hasError: !!result.error,
      });

      // 更新进度
      setTaskProgress(result.progress || 0);

      // 处理不同状态
      if (result.status === TaskStatus.SUCCESS && result.result?.audio_url) {
        // 任务成功
        console.log('✅ 任务完成', result.result);
        setAudioUrl(result.result.audio_url);
        setIsGenerating(false);
        setCurrentTaskId(null);
        setTaskProgress(100);
        clearPolling();

        // 生成成功后刷新积分
        if (result.result.credits_cost) {
          deductCredits(result.result.credits_cost);
          void refreshCredits();
        }

        return;
      } else if (result.status === TaskStatus.FAILURE) {
        // 任务失败
        const errorMsg = result.error || t('studio.errors.generationFailed');
        console.error('❌ 任务失败', errorMsg);
        setError(errorMsg);
        setIsGenerating(false);
        setCurrentTaskId(null);
        setTaskProgress(0);
        clearPolling();
        return;
      } else if (result.status === TaskStatus.PENDING || result.status === TaskStatus.PROCESSING) {
        // 任务进行中，继续轮询
        // 使用递增的轮询间隔：2s -> 3s -> 4s -> 5s（最大）
        const nextInterval = Math.min(2000 + attemptCount * 1000, 5000);

        console.log(`⏳ 任务进行中 (${result.status})，${nextInterval}ms 后重试`);

        pollingIntervalRef.current = setTimeout(() => {
          void pollTaskStatus(taskId, attemptCount + 1);
        }, nextInterval);
      } else {
        // 未知状态
        console.error('❓ 未知任务状态', result);
        setError(t('studio.errors.unknownTaskStatus'));
        setIsGenerating(false);
        setCurrentTaskId(null);
        setTaskProgress(0);
        clearPolling();
      }
    } catch (err) {
      console.error('❌ 轮询任务状态失败', err);

      // 如果轮询失败且尝试次数少于 10 次，继续重试
      if (attemptCount < 10) {
        const retryInterval = 3000;
        console.log(`🔄 ${retryInterval}ms 后重试轮询`);
        pollingIntervalRef.current = setTimeout(() => {
          void pollTaskStatus(taskId, attemptCount + 1);
        }, retryInterval);
      } else {
        setError(t('studio.errors.queryTaskFailed'));
        setIsGenerating(false);
        setCurrentTaskId(null);
        setTaskProgress(0);
        clearPolling();
      }
    }
  }, [deductCredits, refreshCredits, clearPolling, t]);

  // 生成音频（异步任务模式）
  const handleGenerate = useCallback(async () => {
    if (!canGenerate || !selectedVoice) {
      setError(t('studio.errors.selectTextAndVoice'));
      return;
    }

    // 清理之前的轮询
    clearPolling();

    try {
      setIsGenerating(true);
      setError(null);
      setAudioUrl(null);
      setTaskProgress(0);

      console.log('🎤 开始生成音频', {
        text,
        voice: selectedVoice.name,
        voiceName: selectedVoice.name,
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

      console.log('📦 收到任务响应', result);

      // 任务已提交，开始轮询
      if (result.task_id) {
        console.log('✅ 任务已提交，task_id:', result.task_id);
        setCurrentTaskId(result.task_id);

        // 立即开始轮询（延迟 1 秒）
        pollingIntervalRef.current = setTimeout(() => {
          void pollTaskStatus(result.task_id);
        }, 1000);
      } else {
        setError(t('studio.errors.taskNoId'));
        setIsGenerating(false);
      }
    } catch (err: unknown) {
      console.error('❌ 提交任务失败', err);

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
  }, [canGenerate, selectedVoice, text, speed, clearPolling, pollTaskStatus, t]);

  // 重置
  const reset = useCallback(() => {
    clearPolling();
    setText('');
    setSelectedVoice(null);
    setSpeed(1.0);
    setAudioUrl(null);
    setError(null);
    setCurrentTaskId(null);
    setTaskProgress(0);
  }, [clearPolling]);

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
    currentTaskId,
    taskProgress,

    // 方法
    handleTextChange,
    handleVoiceSelect,
    handleSpeedChange,
    handleGenerate,
    reset,
  };
}