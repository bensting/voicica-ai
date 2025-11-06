'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { voiceAPI } from '@/lib/api';
import type { Voice } from '@/types/voice';
import { getLocalizedVoiceName } from '@/types/voice';
import TextInput from './TextInput';
import VoiceSelector from './VoiceSelector';
import ActionButtons from './ActionButtons';
import AudioPlayerModal from './mobile/AudioPlayerModal';

// 模块级别的缓存，防止 React Strict Mode 导致的重复加载
let voiceLoadingPromise: Promise<Voice | null> | null = null;
let loadedVoiceCache: Voice | null = null;

interface TTSPageProps {
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
 * Responsive TTS Page Component (Mobile-First)
 *
 * Mobile: Vertical flex layout with text input, voice selector, action buttons
 * Desktop: Sectioned layout with gradient cards, full voice selector, inline audio player
 */
export default function TTSPage({
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
}: TTSPageProps) {
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

  // Initialize default voice based on current locale (mobile only)
  useEffect(() => {
    // 只在移动端加载默认语音
    if (!isMobile) return;

    console.log('🔄 [TTSPage] useEffect 触发', {
      authLoading,
      isMobile,
      isLocaleReady,
      hasSelectedVoice: !!selectedVoice,
      selectedVoiceName: selectedVoice?.name,
      locale,
    });

    // 等待认证完成
    if (authLoading) {
      console.log('⏸️ [TTSPage] 等待认证完成');
      return;
    }

    // Early return if conditions not met yet
    if (!isMobile || !isLocaleReady) {
      console.log('⏸️ [TTSPage] 等待条件满足', { isMobile, isLocaleReady });
      return;
    }

    // Skip if already selected
    if (selectedVoice) {
      console.log('✅ [TTSPage] 已有选中语音，跳过默认加载', selectedVoice.name);
      return;
    }

    const fetchDefaultVoice = async () => {
      // 检查是否从 gallery 预选了语音
      const hasGallerySelection = sessionStorage.getItem('voicePreSelectedFromGallery');

      console.log('🚀 [TTSPage] fetchDefaultVoice 开始执行', {
        hasGallerySelection: !!hasGallerySelection,
      });

      // 如果从 gallery 选择了语音，永远不加载默认语音
      if (hasGallerySelection) {
        console.log('⏭️ [TTSPage] 跳过默认语音加载 - 已从 Voices Gallery 选择');
        // 清除所有 gallery 相关标志，避免影响下次使用
        sessionStorage.removeItem('voicePreSelectedFromGallery');
        sessionStorage.removeItem('gallerySelectedVoiceId');
        sessionStorage.removeItem('ttsPreSelectedVoice');
        sessionStorage.removeItem('clearVoiceCache');
        console.log('🧹 [TTSPage] 已清除所有 gallery 标志');
        return;
      }

      // 检查是否需要清除缓存
      const shouldClearCache = sessionStorage.getItem('clearVoiceCache');
      if (shouldClearCache) {
        console.log('🗑️ [TTSPage] 清除语音缓存');
        loadedVoiceCache = null;
        sessionStorage.removeItem('clearVoiceCache');
      }

      // 如果已经有缓存，直接使用
      if (loadedVoiceCache) {
        console.log('✅ [TTSPage] 使用缓存的默认语音:', loadedVoiceCache.name);
        handleVoiceSelect(loadedVoiceCache);
        return;
      }

      // 如果正在加载，等待现有的 Promise
      if (voiceLoadingPromise) {
        console.log('⏳ [TTSPage] 等待现有的语音加载请求...');
        const voice = await voiceLoadingPromise;
        if (voice) {
          console.log('✅ [TTSPage] 加载请求完成，选择语音:', voice.name);
          handleVoiceSelect(voice);
        }
        return;
      }

      // 创建新的加载 Promise
      console.log('🎤 [TTSPage] 加载默认语音，locale:', locale);
      voiceLoadingPromise = (async () => {
        try {
          const response = await voiceAPI.getVoices({
            locale,
            is_active: true,
            page: 1,
            page_size: 1,
          });

          if (response.voices && response.voices.length > 0) {
            loadedVoiceCache = response.voices[0];
            console.log('✅ [TTSPage] 默认语音加载成功:', response.voices[0].name);
            return response.voices[0];
          }
          return null;
        } catch (err) {
          console.error('[TTSPage] Failed to load default voice:', err);
          return null;
        } finally {
          // 清除 Promise，但保留缓存
          voiceLoadingPromise = null;
        }
      })();

      const voice = await voiceLoadingPromise;
      if (voice) {
        console.log('✅ [TTSPage] 应用默认语音:', voice.name);
        handleVoiceSelect(voice);
      }
    };

    void fetchDefaultVoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, isMobile, isLocaleReady, authLoading, selectedVoice]);

  // 当音频生成成功时，移动端自动打开弹窗
  useEffect(() => {
    if (audioUrl && isMobile) {
      setIsAudioModalOpen(true);
    }
  }, [audioUrl, isMobile]);

  const handleUpgradeClick = () => {
    router.push('/subscription');
  };

  const handleOpenSettings = () => {
    // TODO: Open settings modal
    console.log('Open settings');
  };

  // 获取当前语言的显示名称
  const voiceDisplayName = selectedVoice ? getLocalizedVoiceName(selectedVoice, locale) : '晓臻';

  return (
    <>
      {/* Mobile Layout */}
      <div className="lg:hidden h-full flex flex-col px-4 pt-3 pb-20 gap-2 bg-gradient-to-b from-gray-50 to-white">
        {/* Error Message */}
        {error && (
          <div className="flex-shrink-0 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 font-medium text-sm">{error}</p>
          </div>
        )}

        {/* Text Input - 占据大部分空间 */}
        <div className="flex-1 min-h-0">
          <TextInput
            value={text}
            onChange={handleTextChange}
            maxCharacters={maxCharacters}
            availableCharacters={availableCharacters}
            disabled={isGenerating}
            selectedVoice={selectedVoice}
            speed={speed}
            onSpeedChange={handleSpeedChange}
          />
        </div>

        {/* Voice Selector */}
        <div className="flex-shrink-0">
          <VoiceSelector
            selectedVoice={selectedVoice}
            onSelect={handleVoiceSelect}
            disabled={isGenerating}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex-shrink-0">
          <ActionButtons
            onGenerate={handleGenerate}
            onOpenSettings={handleOpenSettings}
            isGenerating={isGenerating}
            canGenerate={canGenerate}
          />
        </div>
      </div>

      {/* Desktop Layout - Two Column */}
      <div className="hidden lg:block bg-gradient-to-b from-white to-purple-50 h-full overflow-hidden">
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full flex flex-col">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex-shrink-0">
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Two Column Layout */}
          <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
            {/* Left Column: Text Input & Generation (67%) */}
            <div className="col-span-8 flex flex-col gap-6 min-h-0">
              {/* Text Input Card */}
              <div className="bg-gradient-to-br from-gray-50 to-purple-50 rounded-3xl p-6 md:p-8 shadow-lg flex-shrink-0">
                <TextInput
                  value={text}
                  onChange={handleTextChange}
                  maxCharacters={maxCharacters}
                  availableCharacters={availableCharacters}
                  disabled={isGenerating}
                  selectedVoice={selectedVoice}
                  speed={speed}
                  onSpeedChange={handleSpeedChange}
                />
              </div>

              {/* Generate Button & Results Card */}
              <div className="bg-gradient-to-br from-gray-50 to-purple-50 rounded-3xl p-6 md:p-8 shadow-lg flex-1 min-h-0 flex flex-col overflow-hidden">
                <div className="space-y-6 flex-1 min-h-0 overflow-y-auto">
                  <ActionButtons
                    onGenerate={handleGenerate}
                    isGenerating={isGenerating}
                    canGenerate={canGenerate}
                  />

                  {/* Audio Player */}
                  {audioUrl && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Generated Audio
                      </h3>
                      <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-200">
                        <audio
                          controls
                          src={audioUrl}
                          className="w-full"
                          style={{
                            filter: 'sepia(20%) saturate(70%) hue-rotate(220deg)',
                          }}
                        >
                          Your browser does not support the audio element.
                        </audio>

                        {/* Download Button */}
                        <a
                          href={audioUrl}
                          download="ai-voice-output.mp3"
                          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                          Download Audio
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Upgrade Pro CTA */}
                  <div className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border-2 border-yellow-200">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-6 h-6 text-yellow-900"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          Upgrade to Pro
                        </h4>
                        <p className="text-sm text-gray-700 mb-3">
                          Get unlimited characters, premium voices, and faster
                          generation!
                        </p>
                        <button
                          onClick={handleUpgradeClick}
                          className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-lg transition-colors"
                        >
                          Upgrade Now
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Voice Selector (33%) */}
            <div className="col-span-4 h-full min-h-0">
              <VoiceSelector
                selectedVoice={selectedVoice}
                onSelect={handleVoiceSelect}
                disabled={isGenerating}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Audio Player Modal (Mobile) - fixed 定位，不占据布局空间 */}
      {audioUrl && (
        <AudioPlayerModal
          isOpen={isAudioModalOpen}
          onClose={() => setIsAudioModalOpen(false)}
          audioUrl={audioUrl}
          voiceName={voiceDisplayName}
          voiceAvatar={selectedVoice?.avatar_url}
        />
      )}
    </>
  );
}