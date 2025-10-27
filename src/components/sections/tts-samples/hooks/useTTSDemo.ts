import { useState, useCallback, useEffect } from 'react';
import { configAPI } from '@/lib/api';
import { LocaleOption } from '@/types/config';
import type { Voice } from '@/types/voice';
import { mapLocaleCodesToOptions } from '@/utils/localeMapper';
import { useVoices } from './useVoices';

/**
 * TTS Demo 主 Hook
 * 管理 TTS 演示的所有状态和业务逻辑
 *
 * 功能：
 * - 从后端获取支持的语言配置
 * - 根据选中的语言获取语音列表
 * - 管理语音、语言、文本输入等状态
 * - 提供状态更新方法
 */
export function useTTSDemo() {
  // ==================== 配置相关 ====================
  const [availableLocales, setAvailableLocales] = useState<LocaleOption[]>([]);
  const [maxTextLength, setMaxTextLength] = useState<number>(100);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  // ==================== TTS 状态 ====================
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [selectedLocale, setSelectedLocale] = useState<LocaleOption | null>(null);
  const [textInput, setTextInput] = useState('非常好，我要试试');
  const [enhanceVoice, setEnhanceVoice] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // ==================== UI 状态 ====================
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [isVoiceDropdownOpen, setIsVoiceDropdownOpen] = useState(false);

  // ==================== 语音列表 ====================
  // 根据选中的 locale 获取语音列表
  const { voices, isLoading: isLoadingVoices } = useVoices({
    locale: selectedLocale?.code,
    enabled: !!selectedLocale,
  });

  // 当语音列表加载完成且没有选中语音时，自动选择第一个
  useEffect(() => {
    if (voices.length > 0 && !selectedVoice) {
      setSelectedVoice(voices[0]);
      console.log('🎤 自动选择第一个语音:', voices[0].name);
    }
  }, [voices, selectedVoice]);

  // ==================== 加载配置 ====================
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsLoadingConfig(true);
        const config = await configAPI.getTtsSamples();

        // 转换语言代码为选项
        const localeOptions = mapLocaleCodesToOptions(config.sample_locales);
        setAvailableLocales(localeOptions);
        setMaxTextLength(config.sample_text_max_length);

        // 设置默认语言为第一个（如果有）
        if (localeOptions.length > 0) {
          setSelectedLocale(localeOptions[0]);
        }

        console.log('✅ TTS 配置加载成功:', {
          locales: localeOptions.length,
          maxLength: config.sample_text_max_length,
        });
      } catch (error) {
        console.error('❌ 加载 TTS 配置失败:', error);
        // 使用默认配置
        const defaultLocales = mapLocaleCodesToOptions(['en-US', 'zh-CN', 'zh-TW', 'ja-JP', 'ko-KR']);
        setAvailableLocales(defaultLocales);
        setSelectedLocale(defaultLocales[0]);
      } finally {
        setIsLoadingConfig(false);
      }
    };

    loadConfig();
  }, []);

  // ==================== 事件处理 ====================

  // 处理文本输入变化
  const handleTextChange = useCallback(
    (text: string) => {
      if (text.length <= maxTextLength) {
        setTextInput(text);
      }
    },
    [maxTextLength]
  );

  // 切换增强语音
  const toggleEnhanceVoice = useCallback(() => {
    setEnhanceVoice((prev) => !prev);
  }, []);

  // 处理播放
  const handlePlay = useCallback(() => {
    if (!textInput.trim()) {
      console.warn('⚠️ 文本为空，无法播放');
      return;
    }

    if (!selectedVoice) {
      console.warn('⚠️ 未选择语音，无法播放');
      return;
    }

    setIsPlaying(true);
    console.log('🎵 播放 TTS:', {
      voice: selectedVoice.name,
      locale: selectedLocale?.code,
      text: textInput,
      enhanced: enhanceVoice,
    });

    // TODO: 实现实际的音频播放逻辑
    // 模拟播放结束
    setTimeout(() => {
      setIsPlaying(false);
    }, 3000);
  }, [selectedVoice, selectedLocale, textInput, enhanceVoice]);

  // 处理语音选择
  const handleVoiceSelect = useCallback((voice: Voice) => {
    setSelectedVoice(voice);
    console.log('🎤 选择语音:', voice.name);
  }, []);

  // 处理语言选择
  const handleLocaleSelect = useCallback((locale: LocaleOption) => {
    setSelectedLocale(locale);
    // 切换语言时清空已选语音，等待新语音列表加载
    setSelectedVoice(null);
    console.log('🌐 切换语言:', locale.code);
  }, []);

  // 切换语言下拉菜单
  const toggleLanguageDropdown = useCallback(() => {
    setIsLanguageDropdownOpen((prev) => !prev);
    // 关闭语音下拉菜单
    if (isVoiceDropdownOpen) {
      setIsVoiceDropdownOpen(false);
    }
  }, [isVoiceDropdownOpen]);

  // 切换语音下拉菜单
  const toggleVoiceDropdown = useCallback(() => {
    setIsVoiceDropdownOpen((prev) => !prev);
    // 关闭语言下拉菜单
    if (isLanguageDropdownOpen) {
      setIsLanguageDropdownOpen(false);
    }
  }, [isLanguageDropdownOpen]);

  return {
    // 配置状态
    availableLocales,
    maxTextLength,
    isLoadingConfig,

    // TTS 状态
    selectedVoice,
    selectedLocale,
    textInput,
    enhanceVoice,
    isPlaying,

    // 语音列表
    availableVoices: voices,
    isLoadingVoices,

    // UI 状态
    isLanguageDropdownOpen,
    isVoiceDropdownOpen,

    // Actions
    handleTextChange,
    toggleEnhanceVoice,
    handlePlay,
    handleVoiceSelect,
    handleLocaleSelect,
    toggleLanguageDropdown,
    toggleVoiceDropdown,
  };
}