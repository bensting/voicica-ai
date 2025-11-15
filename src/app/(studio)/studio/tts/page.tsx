'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useStudio } from '@/contexts/StudioContext';
import { useCredits } from '@/contexts/CreditsContext';
import { useTTSGenerator } from '@/hooks/useTTSGenerator';
import { voiceAPI } from '@/lib/api';
import type { Voice } from '@/types/voice';
import TextInput from '@/components/features/studio/tts/components/TextInput';
import VoiceSelector from '@/components/features/studio/tts/components/VoiceSelector';
import VoiceSelectButton from '@/components/features/studio/tts/components/VoiceSelectButton';
import VoiceSelectorBottomSheet from '@/components/features/studio/tts/components/mobile/VoiceSelectorBottomSheet';
import ActionButtons from '@/components/features/studio/tts/components/ActionButtons';
import AudioPlayerModal from '@/components/features/studio/tts/components/mobile/AudioPlayerModal';
import { useGenerationHistory } from '@/components/features/studio/generation-history/hooks/useGenerationHistory';
import RecentGenerationsList from '@/components/features/studio/tts/components/RecentGenerationsList';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

// 模块级别的缓存，防止 React Strict Mode 导致的重复加载
let voiceLoadingPromise: Promise<Voice | null> | null = null;
let loadedVoiceCache: Voice | null = null;

/**
 * Studio TTS Page
 *
 * Text-to-Speech generation page with:
 * - Dynamic user credits display
 * - Internationalization support
 * - Upgrade navigation
 * - Complete TTS generation workflow
 * - Responsive layout (mobile-first)
 */
export default function StudioTTSPage() {
  const { locale, isReady: isLocaleReady, t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { setTitle } = useStudio();
  const { credits } = useCredits();
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [isVoiceSelectorOpen, setIsVoiceSelectorOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Set page title
  useEffect(() => {
    setTitle(t('studio.tts'));
  }, [t, setTitle]);

  // TTS Generator logic
  const maxCharacters = 500;
  const {
    text,
    selectedVoice,
    isGenerating,
    error,
    audioUrl,
    availableCharacters,
    canGenerate,
    taskProgress,
    handleTextChange,
    handleVoiceSelect,
    handleGenerate,
  } = useTTSGenerator(maxCharacters);

  // Generation history hook (显示最近6条)
  const {
    loading: historyLoading,
    generations,
    handleDeleteGeneration,
    handleDownloadGeneration,
    fetchRecords,
    confirmDialog,
    closeConfirmDialog,
  } = useGenerationHistory({
    user,
    authLoading,
    pageSize: 6,
  });

  // 检测是否为移动端（只在客户端执行一次）
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
  }, []);

  // Initialize default voice based on current locale
  useEffect(() => {
    // 等待认证完成
    if (authLoading) return;

    // Early return if conditions not met yet
    if (!isLocaleReady) return;

    // Skip if already selected
    if (selectedVoice) return;

    const fetchDefaultVoice = async () => {
      // 检查是否从 gallery 预选了语音
      const hasGallerySelection = sessionStorage.getItem('voicePreSelectedFromGallery');

      // 如果从 gallery 选择了语音，永远不加载默认语音
      if (hasGallerySelection) {
        // 清除所有 gallery 相关标志，避免影响下次使用
        sessionStorage.removeItem('voicePreSelectedFromGallery');
        sessionStorage.removeItem('gallerySelectedVoiceId');
        sessionStorage.removeItem('ttsPreSelectedVoice');
        sessionStorage.removeItem('clearVoiceCache');
        return;
      }

      // 检查是否需要清除缓存
      const shouldClearCache = sessionStorage.getItem('clearVoiceCache');
      if (shouldClearCache) {
        loadedVoiceCache = null;
        sessionStorage.removeItem('clearVoiceCache');
      }

      // 如果已经有缓存，直接使用
      if (loadedVoiceCache) {
        handleVoiceSelect(loadedVoiceCache);
        return;
      }

      // 如果正在加载，等待现有的 Promise
      if (voiceLoadingPromise) {
        const voice = await voiceLoadingPromise;
        if (voice) {
          handleVoiceSelect(voice);
        }
        return;
      }

      // 创建新的加载 Promise
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
        handleVoiceSelect(voice);
      }
    };

    void fetchDefaultVoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, isLocaleReady, authLoading, selectedVoice]);

  // 当音频生成成功时，移动端自动打开弹窗
  useEffect(() => {
    if (audioUrl && isMobile) {
      setIsAudioModalOpen(true);
    }
  }, [audioUrl, isMobile]);

  // 生成完成后刷新历史记录
  useEffect(() => {
    if (audioUrl) {
      // 等待一小段时间确保后端已保存记录
      const timer = setTimeout(() => {
        void fetchRecords();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [audioUrl, fetchRecords]);

  const handleOpenSettings = () => {
    // TODO: Open settings modal
    console.log('Open settings');
  };

  // 获取语音显示名称
  const voiceDisplayName = selectedVoice?.display_name
    || (authLoading || !isLocaleReady ? t('common.loading') : t('studio.selectVoice'));

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
            remainingCredits={credits}
          />
        </div>

        {/* Voice Select Button */}
        <div className="flex-shrink-0">
          <VoiceSelectButton
            voice={selectedVoice}
            onClick={() => setIsVoiceSelectorOpen(true)}
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
      <div className="hidden lg:flex flex-col bg-gradient-to-b from-white to-purple-50 lg:h-[calc(100vh-60px)] overflow-hidden">
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex-1 flex flex-col min-h-0">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex-shrink-0">
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Two Column Layout */}
          <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
            {/* Left Column: Voice Button, Text Input & Generation History (67%) */}
            <div className="col-span-8 flex flex-col gap-3 overflow-hidden">
              {/* Voice Selector Button */}
              <VoiceSelectButton
                voice={selectedVoice}
                onClick={() => {
                  // TODO: 可以滚动到右侧或打开模态框
                  console.log('Open voice selector');
                }}
                disabled={isGenerating}
                size="medium"
              />

              {/* Text Input Card with Generate Button - 占据 55% 左右 */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden" style={{ flex: '0 0 55%' }}>
                <TextInput
                  value={text}
                  onChange={handleTextChange}
                  maxCharacters={maxCharacters}
                  availableCharacters={availableCharacters}
                  disabled={isGenerating}
                  onGenerate={handleGenerate}
                  isGenerating={isGenerating}
                  canGenerate={canGenerate}
                  remainingCredits={credits}
                />
              </div>

              {/* Generation History List - 占据剩余空间 */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <RecentGenerationsList
                  generations={generations}
                  loading={historyLoading}
                  onDelete={handleDeleteGeneration}
                  onDownload={handleDownloadGeneration}
                  isGenerating={isGenerating}
                  generatingText={text}
                  taskProgress={taskProgress}
                />
              </div>
            </div>

            {/* Right Column: Voice Selector (33%) */}
            <div className="col-span-4 h-full min-h-0 flex flex-col overflow-hidden">
              <VoiceSelector
                selectedVoice={selectedVoice}
                onSelect={handleVoiceSelect}
                disabled={isGenerating}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Voice Selector Bottom Sheet (Mobile) */}
      <VoiceSelectorBottomSheet
        isOpen={isVoiceSelectorOpen}
        onClose={() => setIsVoiceSelectorOpen(false)}
        selectedVoice={selectedVoice}
        onSelect={handleVoiceSelect}
      />

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

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirmDialog}
        variant="danger"
      />
    </>
  );
}