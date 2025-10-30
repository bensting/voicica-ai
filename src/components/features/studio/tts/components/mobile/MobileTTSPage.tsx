'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { voiceAPI } from '@/lib/api';
import type { Voice } from '@/types/voice';
import MobileTextInput from './MobileTextInput';
import MobileVoiceSelector from './MobileVoiceSelector';
import MobileActionButtons from './MobileActionButtons';
import AudioPlayerModal from './AudioPlayerModal';

// 模块级别的缓存，防止 React Strict Mode 导致的重复加载
let voiceLoadingPromise: Promise<Voice | null> | null = null;
let loadedVoiceCache: Voice | null = null;

interface MobileTTSPageProps {
  text: string;
  selectedVoice: Voice | null;
  speed: number;
  isGenerating: boolean;
  error: string | null;
  audioUrl: string | null;
  maxCharacters: number;
  availableCharacters: number;
  canGenerate: boolean;
  handleTextChange: (value: string) => void;
  handleVoiceSelect: (voice: Voice) => void;
  handleSpeedChange: (speed: number) => void;
  handleGenerate: () => void;
}

/**
 * Mobile TTS Page Component
 *
 * Simplified mobile-optimized layout for TTS generation
 * Based on TopMediAi mobile design
 */
export default function MobileTTSPage({
  text,
  selectedVoice,
  speed,
  isGenerating,
  error,
  audioUrl,
  maxCharacters,
  availableCharacters,
  canGenerate,
  handleTextChange,
  handleVoiceSelect,
  handleSpeedChange,
  handleGenerate,
}: MobileTTSPageProps) {
  const router = useRouter();
  const { locale, isReady: isLocaleReady } = useLanguage();
  const { loading: authLoading } = useAuth();
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 检测是否为移动端（只在客户端执行一次）
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
  }, []);

  // Initialize default voice based on current locale
  useEffect(() => {
    console.log('🔄 [MobileTTSPage] useEffect 触发', {
      authLoading,
      isMobile,
      isLocaleReady,
      hasSelectedVoice: !!selectedVoice,
      selectedVoiceName: selectedVoice?.name,
      locale,
    });

    // 等待认证完成
    if (authLoading) {
      console.log('⏸️ [MobileTTSPage] 等待认证完成');
      return;
    }

    // Early return if conditions not met yet
    if (!isMobile || !isLocaleReady) {
      console.log('⏸️ [MobileTTSPage] 等待条件满足', { isMobile, isLocaleReady });
      return;
    }

    // Skip if already selected
    if (selectedVoice) {
      console.log('✅ [MobileTTSPage] 已有选中语音，跳过默认加载', selectedVoice.name);
      return;
    }

    const fetchDefaultVoice = async () => {
      // 检查是否从 gallery 预选了语音
      const hasGallerySelection = sessionStorage.getItem('voicePreSelectedFromGallery');

      console.log('🚀 [MobileTTSPage] fetchDefaultVoice 开始执行', {
        hasGallerySelection: !!hasGallerySelection,
      });

      // 如果从 gallery 选择了语音，永远不加载默认语音
      if (hasGallerySelection) {
        console.log('⏭️ [MobileTTSPage] 跳过默认语音加载 - 已从 Voices Gallery 选择');
        // 清除所有 gallery 相关标志，避免影响下次使用
        sessionStorage.removeItem('voicePreSelectedFromGallery');
        sessionStorage.removeItem('gallerySelectedVoiceId');
        sessionStorage.removeItem('ttsPreSelectedVoice');
        sessionStorage.removeItem('clearVoiceCache');
        console.log('🧹 [MobileTTSPage] 已清除所有 gallery 标志');
        return;
      }

      // 检查是否需要清除缓存
      const shouldClearCache = sessionStorage.getItem('clearVoiceCache');
      if (shouldClearCache) {
        console.log('🗑️ [MobileTTSPage] 清除语音缓存');
        loadedVoiceCache = null;
        sessionStorage.removeItem('clearVoiceCache');
      }

      // 如果已经有缓存，直接使用
      if (loadedVoiceCache) {
        console.log('✅ [MobileTTSPage] 使用缓存的默认语音:', loadedVoiceCache.name);
        handleVoiceSelect(loadedVoiceCache);
        return;
      }

      // 如果正在加载，等待现有的 Promise
      if (voiceLoadingPromise) {
        console.log('⏳ [MobileTTSPage] 等待现有的语音加载请求...');
        const voice = await voiceLoadingPromise;
        if (voice) {
          console.log('✅ [MobileTTSPage] 加载请求完成，选择语音:', voice.name);
          handleVoiceSelect(voice);
        }
        return;
      }

      // 创建新的加载 Promise
      console.log('🎤 [MobileTTSPage] 加载默认语音，locale:', locale);
      voiceLoadingPromise = (async () => {
        try {
          const voices = await voiceAPI.getVoices({
            locale,
            is_active: true,
            limit: 1,
          });

          if (voices && voices.length > 0) {
            loadedVoiceCache = voices[0];
            console.log('✅ [MobileTTSPage] 默认语音加载成功:', voices[0].name);
            return voices[0];
          }
          return null;
        } catch (err) {
          console.error('[MobileTTSPage] Failed to load default voice:', err);
          return null;
        } finally {
          // 清除 Promise，但保留缓存
          voiceLoadingPromise = null;
        }
      })();

      const voice = await voiceLoadingPromise;
      if (voice) {
        console.log('✅ [MobileTTSPage] 应用默认语音:', voice.name);
        handleVoiceSelect(voice);
      }
    };

    void fetchDefaultVoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, isMobile, isLocaleReady, authLoading, selectedVoice]);

  // 当音频生成成功时，自动打开弹窗
  useEffect(() => {
    if (audioUrl) {
      setIsAudioModalOpen(true);
    }
  }, [audioUrl]);

  const handleOpenVoiceModal = () => {
    // TODO: Open voice selection modal
    router.push('/studio/voices');
  };

  const handleOpenSettings = () => {
    // TODO: Open settings modal
    console.log('Open settings');
  };

  // 获取当前语言的显示名称
  const getVoiceDisplayName = () => {
    if (!selectedVoice) return '晓臻';

    // 尝试获取当前 locale 的显示名称
    const displayName = selectedVoice.display_name?.[locale];
    if (displayName) return displayName;

    // 回退到其他语言
    const fallbackName =
      selectedVoice.display_name?.['zh-CN'] ||
      selectedVoice.display_name?.['zh-TW'] ||
      selectedVoice.display_name?.['en-US'] ||
      selectedVoice.name;

    return fallbackName || '晓臻';
  };

  return (
    <>
      <div className="h-full flex flex-col px-4 pt-3 pb-20 gap-2 bg-gradient-to-b from-gray-50 to-white">
        {/* Error Message */}
        {error && (
          <div className="flex-shrink-0 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 font-medium text-sm">{error}</p>
          </div>
        )}

        {/* Text Input - 占据大部分空间 */}
        <div className="flex-1 min-h-0">
          <MobileTextInput
            value={text}
            onChange={handleTextChange}
            maxCharacters={maxCharacters}
            availableCharacters={availableCharacters}
            disabled={isGenerating}
          />
        </div>

        {/* Voice Selector */}
        <div className="flex-shrink-0">
          <MobileVoiceSelector
            selectedVoice={selectedVoice}
            onOpenVoiceModal={handleOpenVoiceModal}
            disabled={isGenerating}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex-shrink-0">
          <MobileActionButtons
            onGenerate={handleGenerate}
            onOpenSettings={handleOpenSettings}
            isGenerating={isGenerating}
            canGenerate={canGenerate}
          />
        </div>
      </div>

      {/* 底部弹出音频播放器 - fixed 定位，不占据布局空间 */}
      {audioUrl && (
        <AudioPlayerModal
          isOpen={isAudioModalOpen}
          onClose={() => setIsAudioModalOpen(false)}
          audioUrl={audioUrl}
          voiceName={getVoiceDisplayName()}
          voiceAvatar={selectedVoice?.avatar_url}
        />
      )}
    </>
  );
}