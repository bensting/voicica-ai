'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useStudio } from '@/contexts/StudioContext';
import { useCredits } from '@/contexts/CreditsContext';
import { useTTSGenerator } from '@/hooks/useTTSGenerator';
import { TaskStatus } from '@/types/tts';
import type { Voice } from '@/types/voice';
import TextInput from '@/components/features/studio/tts/components/TextInput';
import VoiceSelector from '@/components/features/studio/tts/components/VoiceSelector';
import VoiceSelectButton from '@/components/features/studio/tts/components/VoiceSelectButton';
import VoiceSelectorBottomSheet from '@/components/features/studio/tts/components/mobile/VoiceSelectorBottomSheet';
import ActionButtons from '@/components/features/studio/tts/components/ActionButtons';
import AudioPlayerModal from '@/components/features/studio/tts/components/mobile/AudioPlayerModal';
import GeneratingRecordModal from '@/components/features/studio/tts/components/mobile/GeneratingRecordModal';
import { useGenerationHistory } from '@/components/features/studio/generation-history/hooks/useGenerationHistory';
import RecentGenerationsList from '@/components/features/studio/tts/components/RecentGenerationsList';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import AudioSettingsModal from '@/components/features/studio/tts/AudioSettingsModal';
import AudioSettingsPanel from '@/components/features/studio/tts/AudioSettingsPanel';

// 将 defaultStatus 提取到组件外部，避免每次渲染创建新数组引用
const DEFAULT_GENERATION_STATUS = [TaskStatus.SUCCESS, TaskStatus.PROCESSING, TaskStatus.PENDING];

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
  const [isGeneratingModalOpen, setIsGeneratingModalOpen] = useState(false);
  const [isAudioSettingsOpen, setIsAudioSettingsOpen] = useState(false);
  const [lastOpenedRecordId, setLastOpenedRecordId] = useState<string | null>(null);

  // 追踪 isGenerating 的前一个值，避免首次加载时误触发刷新
  const prevIsGeneratingRef = useRef<boolean | null>(null);

  // 检测是否为移动端（在 useState 初始化，避免 useEffect）
  const [isMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024;
    }
    return false;
  });

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
    handleTextChange,
    handleVoiceSelect,
    handleGenerate,
    handleClearText,
  } = useTTSGenerator(maxCharacters);

  // Generation history hook (显示最近6条，只查询成功和进行中的记录，不显示失败的)
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
    defaultStatus: DEFAULT_GENERATION_STATUS, // 只查询这三种状态，不查询 FAILURE
  });

  // Load last selected voice from localStorage (remember user's choice)
  useEffect(() => {
    // 等待认证完成
    if (authLoading) return;

    // Early return if conditions not met yet
    if (!isLocaleReady) return;

    // Skip if already selected
    if (selectedVoice) return;

    const loadLastSelectedVoice = async () => {
      // 1. 检查是否从 voices 页面预选了语音（最高优先级）
      const hasGallerySelection = sessionStorage.getItem('voicePreSelectedFromGallery');
      if (hasGallerySelection) {
        // 清除所有 gallery 相关标志，避免影响下次使用
        sessionStorage.removeItem('voicePreSelectedFromGallery');
        sessionStorage.removeItem('gallerySelectedVoiceId');
        sessionStorage.removeItem('ttsPreSelectedVoice');
        sessionStorage.removeItem('clearVoiceCache');
        return; // useTTSGenerator hook 会处理预选语音
      }

      // 2. 尝试从 localStorage 加载上次选择的语音（记住用户选择）
      const lastVoiceStr = localStorage.getItem('lastSelectedVoice');
      if (lastVoiceStr) {
        try {
          const lastVoice = JSON.parse(lastVoiceStr) as Voice;
          handleVoiceSelect(lastVoice);
          return;
        } catch (err) {
          console.error('[TTSPage] Failed to parse last selected voice:', err);
          localStorage.removeItem('lastSelectedVoice');
        }
      }

      // 3. 首次访问或找不到上次的语音：不自动选择，让用户主动选择
    };

    void loadLastSelectedVoice();
  }, [locale, isLocaleReady, authLoading, selectedVoice, handleVoiceSelect]);

  // 当音频生成成功时，移动端自动打开弹窗
  useEffect(() => {
    if (audioUrl && isMobile) {
      setIsAudioModalOpen(true);
    }
  }, [audioUrl, isMobile]);

  // 任务提交后立即刷新历史记录
  useEffect(() => {
    // 只在 isGenerating 从 true 变为 false 时刷新（即任务刚完成时）
    // 避免首次加载时误触发
    if (prevIsGeneratingRef.current === true && !isGenerating) {
      console.log('🔄 [TTSPage] 任务完成，300ms 后刷新记录');
      const timer = setTimeout(() => {
        void fetchRecords();
      }, 300);

      // 更新 ref
      prevIsGeneratingRef.current = isGenerating;

      return () => clearTimeout(timer);
    }

    // 更新 ref 追踪当前值
    prevIsGeneratingRef.current = isGenerating;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGenerating]); // 移除 fetchRecords 依赖，避免重复调用

  // 移动端：当新的生成记录出现时，自动打开底部抽屉显示进度
  useEffect(() => {
    if (isMobile && generations.length > 0) {
      const latestRecord = generations[0];
      // 只在新记录首次出现时打开弹窗（通过记录 ID 判断是否是新记录）
      if (latestRecord.status === TaskStatus.PROCESSING || latestRecord.status === TaskStatus.PENDING) {
        if (latestRecord.id !== lastOpenedRecordId) {
          console.log('📱 [TTSPage] 打开移动端生成进度弹窗，记录ID:', latestRecord.id);
          setIsGeneratingModalOpen(true);
          setLastOpenedRecordId(latestRecord.id);
        }
      }
    }
  }, [generations, isMobile, lastOpenedRecordId]);

  // Memoize callbacks to prevent unnecessary re-renders
  const handleOpenSettings = useCallback(() => {
    setIsAudioSettingsOpen(true);
  }, []);

  const handleVoiceSelectorOpen = useCallback(() => setIsVoiceSelectorOpen(true), []);
  const handleVoiceSelectorClose = useCallback(() => setIsVoiceSelectorOpen(false), []);
  const handleAudioModalClose = useCallback(() => setIsAudioModalOpen(false), []);
  const handleAudioSettingsClose = useCallback(() => setIsAudioSettingsOpen(false), []);

  // Memoize computed values
  const voiceDisplayName = useMemo(
    () =>
      selectedVoice?.display_name ||
      (authLoading || !isLocaleReady ? t('common.loading') : t('studio.selectVoice')),
    [selectedVoice?.display_name, authLoading, isLocaleReady, t]
  );

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
            onClear={handleClearText}
          />
        </div>

        {/* Voice Select Button */}
        <div className="flex-shrink-0">
          <VoiceSelectButton
            voice={selectedVoice}
            onClick={handleVoiceSelectorOpen}
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
            {/* Left Column: Voice Button, Text Input & Generation History (58%) */}
            <div className="col-span-7 flex flex-col gap-3 overflow-hidden">
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
                  onClear={handleClearText}
                />
              </div>

              {/* Generation History List - 占据剩余空间 */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <RecentGenerationsList
                  generations={generations}
                  loading={historyLoading}
                  onDelete={handleDeleteGeneration}
                  onDownload={handleDownloadGeneration}
                />
              </div>
            </div>

            {/* Right Column: Audio Settings & Voice Selector (42%) */}
            <div className="col-span-5 h-full min-h-0 flex flex-col gap-3 overflow-hidden">
              {/* Audio Settings Panel */}
              <AudioSettingsPanel />

              {/* Voice Selector */}
              <div className="flex-1 min-h-0">
                <VoiceSelector
                  selectedVoice={selectedVoice}
                  onSelect={handleVoiceSelect}
                  disabled={isGenerating}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Selector Bottom Sheet (Mobile) - 只在打开时渲染，避免重复请求 */}
      {isVoiceSelectorOpen && (
        <VoiceSelectorBottomSheet
          isOpen={isVoiceSelectorOpen}
          onClose={handleVoiceSelectorClose}
          selectedVoice={selectedVoice}
          onSelect={handleVoiceSelect}
        />
      )}

      {/* Audio Player Modal (Mobile) - fixed 定位，不占据布局空间 */}
      {audioUrl && (
        <AudioPlayerModal
          isOpen={isAudioModalOpen}
          onClose={handleAudioModalClose}
          audioUrl={audioUrl}
          voiceName={voiceDisplayName}
          voiceAvatar={selectedVoice?.avatar_url}
        />
      )}

      {/* Generating Record Modal (Mobile) - 显示生成进度 */}
      <GeneratingRecordModal
        isOpen={isGeneratingModalOpen}
        onClose={() => {
          setIsGeneratingModalOpen(false);
          // 当弹窗关闭时（无论是用户手动关闭还是自动关闭），
          // 如果当前记录已经完成，清除 lastOpenedRecordId，
          // 这样下次生成新记录时弹窗还能正常打开
          if (generations.length > 0 && generations[0].status === TaskStatus.SUCCESS) {
            setLastOpenedRecordId(null);
          }
        }}
        generation={generations.length > 0 ? generations[0] : null}
        onDelete={handleDeleteGeneration}
        onDownload={handleDownloadGeneration}
      />

      {/* Audio Settings Modal (Mobile) */}
      <AudioSettingsModal
        isOpen={isAudioSettingsOpen}
        onClose={handleAudioSettingsClose}
      />

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