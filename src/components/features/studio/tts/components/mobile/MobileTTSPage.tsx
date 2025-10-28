'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { voiceAPI } from '@/lib/api';
import type { VoiceModel } from '@/hooks/useTTSGenerator';
import MobileTextInput from './MobileTextInput';
import MobileVoiceSelector from './MobileVoiceSelector';
import MobileActionButtons from './MobileActionButtons';
import AudioPlayerModal from './AudioPlayerModal';

interface MobileTTSPageProps {
  text: string;
  selectedVoice: VoiceModel | null;
  speed: number;
  isGenerating: boolean;
  error: string | null;
  audioUrl: string | null;
  maxCharacters: number;
  availableCharacters: number;
  canGenerate: boolean;
  handleTextChange: (value: string) => void;
  handleVoiceSelect: (voice: VoiceModel) => void;
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
  const { locale } = useLanguage();
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);

  // Initialize default voice based on current locale
  useEffect(() => {
    const fetchDefaultVoice = async () => {
      // Only fetch if no voice is selected
      if (!selectedVoice) {
        try {
          // Get first voice matching current locale
          const voices = await voiceAPI.getVoices({
            locale,
            is_active: true,
            limit: 1,
          });

          if (voices && voices.length > 0) {
            handleVoiceSelect(voices[0]);
            console.log('✅ 已加载默认语音:', voices[0]);
          }
        } catch (err) {
          console.error('❌ 获取默认语音失败:', err);
        }
      }
    };

    void fetchDefaultVoice();
  }, [locale, selectedVoice, handleVoiceSelect]);

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