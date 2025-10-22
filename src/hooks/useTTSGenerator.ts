import { useState } from 'react';

/**
 * 语音模型接口 - 匹配后端 Voice Schema
 */
export interface VoiceModel {
  id: string;
  name: string;
  display_name: Record<string, string>;
  provider: string;
  locale: string;
  country: string;
  role: string;
  avatar_url: string;
  voice_sample_url: string;
  gender: string;
  tags: string[];
  style_list: string[];
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

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
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<VoiceModel | null>(null);
  const [speed, setSpeed] = useState(1.0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // 可用字符数
  const availableCharacters = maxCharacters - text.length;
  const isTextValid = text.length > 0 && text.length <= maxCharacters;
  const canGenerate = isTextValid && selectedVoice !== null && !isGenerating;

  // 处理文本变化
  const handleTextChange = (newText: string) => {
    if (newText.length <= maxCharacters) {
      setText(newText);
      setError(null);
    }
  };

  // 处理语音选择
  const handleVoiceSelect = (voice: VoiceModel) => {
    setSelectedVoice(voice);
    setError(null);
  };

  // 处理速度变化
  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
  };

  // 生成音频
  const handleGenerate = async () => {
    if (!canGenerate) {
      setError('Please enter text and select a voice');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      console.log('🎤 开始生成音频', {
        text,
        voice: selectedVoice?.name,
      });

      // TODO: 调用后端 API 生成音频
      // const result = await voiceAPI.generate({
      //   text,
      //   voiceId: selectedVoice.id,
      // });

      // 模拟 API 调用
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 模拟返回的音频 URL
      setAudioUrl('https://example.com/audio.mp3');

      console.log('✅ 音频生成成功');
    } catch (err) {
      const error = err as Error;
      console.error('❌ 音频生成失败', error);
      setError(error.message || '生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  // 重置
  const reset = () => {
    setText('');
    setSelectedVoice(null);
    setSpeed(1.0);
    setAudioUrl(null);
    setError(null);
  };

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