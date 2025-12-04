'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
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
  const { user, loading: authLoading } = useFirebaseAuth();
  const { setTitle } = useStudio();
  const { credits, loading: creditsLoading, refreshCredits } = useCredits();
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [isVoiceSelectorOpen, setIsVoiceSelectorOpen] = useState(false);
  const [isGeneratingModalOpen, setIsGeneratingModalOpen] = useState(false);
  const [isAudioSettingsOpen, setIsAudioSettingsOpen] = useState(false);
  const [userClosedGeneratingModal, setUserClosedGeneratingModal] = useState(false); // 追踪用户是否手动关闭

  // 检测是否为移动端（在 useState 初始化，避免 useEffect）
  const [isMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024;
    }
    return false;
  });

  // Set page title
  useEffect(() => {
    setTitle(t('tts.title'));
  }, [t, setTitle]);

  // Google Ads 转化跟踪
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'ads_conversion_tts', {});
    }
  }, []);

  // 注意：积分已由 CreditsContext 在认证完成后自动获取
  // 这里不需要再主动调用 refreshCredits，避免重复请求

  // TTS Generator logic
  // 字符限制：匿名用户 500，注册用户 2000
  const maxCharacters = user ? 2000 : 500;
  const {
    text,
    selectedVoice,
    selectedStyle,
    isGenerating,
    error,
    audioUrl,
    availableCharacters,
    canGenerate,
    handleTextChange,
    handleVoiceSelect,
    handleGenerate,
    handleClearText,
  } = useTTSGenerator(maxCharacters, {
    onTaskSubmitted: () => {
      console.log('🔄 [TTSPage] 任务成功提交，300ms 后刷新记录和积分');
      setTimeout(() => {
        console.log('⏰ [TTSPage] 300ms 超时触发，开始刷新');
        console.log('📋 [TTSPage] 调用 fetchRecords');
        void fetchRecords().then(() => {
          console.log('✅ [TTSPage] fetchRecords 完成');
        }).catch((err) => {
          console.error('❌ [TTSPage] fetchRecords 失败:', err);
        });

        console.log('💰 [TTSPage] 调用 refreshCredits');
        void refreshCredits().then(() => {
          console.log('✅ [TTSPage] refreshCredits 完成');
        }).catch((err) => {
          console.error('❌ [TTSPage] refreshCredits 失败:', err);
        });
      }, 300);
    },
  });

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
    onTaskCompleted: () => {
      console.log('💰 [TTSPage] 任务完成（轮询检测），刷新积分');
      void refreshCredits();
    },
    t, // 传入翻译函数
  });

  // Load voice from various sources (sessionStorage from Voices page takes priority)
  useEffect(() => {
    // 等待认证完成
    if (authLoading) return;

    // Early return if conditions not met yet
    if (!isLocaleReady) return;

    const loadVoice = () => {
      // 1. 检查是否从 voices 页面预选了语音（最高优先级，覆盖当前选择）
      const preSelectedVoiceStr = sessionStorage.getItem('ttsPreSelectedVoice');
      if (preSelectedVoiceStr) {
        try {
          const preSelectedVoice = JSON.parse(preSelectedVoiceStr) as Voice;
          console.log('🎯 [TTSPage] 从 Voices 页面预选语音:', preSelectedVoice.display_name);
          handleVoiceSelect(preSelectedVoice);
          // 清除 sessionStorage
          sessionStorage.removeItem('ttsPreSelectedVoice');
          sessionStorage.removeItem('voicePreSelectedFromGallery');
          sessionStorage.removeItem('clearVoiceCache');
          return;
        } catch (err) {
          console.error('[TTSPage] Failed to parse pre-selected voice:', err);
          sessionStorage.removeItem('ttsPreSelectedVoice');
        }
      }

      // 2. 检查是否从首页 TTS Samples 预填充了数据
      const prefillText = localStorage.getItem('tts_prefill_text');
      const prefillVoiceStr = localStorage.getItem('tts_prefill_voice');
      if (prefillText && prefillVoiceStr) {
        try {
          const prefillVoice = JSON.parse(prefillVoiceStr) as Voice;
          console.log('📋 [TTSPage] 从首页预填充数据:', { text: prefillText, voice: prefillVoice.name });

          // 设置文本和语音
          handleTextChange(prefillText);
          handleVoiceSelect(prefillVoice);

          // 清除预填充数据，避免下次访问时重复应用
          localStorage.removeItem('tts_prefill_text');
          localStorage.removeItem('tts_prefill_voice');
          return;
        } catch (err) {
          console.error('[TTSPage] Failed to parse prefill data:', err);
          localStorage.removeItem('tts_prefill_text');
          localStorage.removeItem('tts_prefill_voice');
        }
      }

      // Skip loading from localStorage if voice is already selected
      if (selectedVoice) return;

      // 3. 尝试从 localStorage 加载上次选择的语音（记住用户选择）
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

      // 4. 首次访问或找不到上次的语音：不自动选择，让用户主动选择
    };

    loadVoice();
  }, [locale, isLocaleReady, authLoading, selectedVoice, handleVoiceSelect, handleTextChange]);

  // 当音频生成成功时，移动端自动打开弹窗
  useEffect(() => {
    if (audioUrl && isMobile) {
      setIsAudioModalOpen(true);
    }
  }, [audioUrl, isMobile]);

  // 移动端：当有处理中的任务时，自动打开弹窗显示最新记录
  useEffect(() => {
    if (!isMobile || generations.length === 0) return;

    const latestRecord = generations[0];
    const isProcessing = latestRecord.status === TaskStatus.PROCESSING || latestRecord.status === TaskStatus.PENDING;

    // 如果最新记录是处理中状态 且 用户没有手动关闭弹窗，则打开弹窗
    if (isProcessing && !isGeneratingModalOpen && !userClosedGeneratingModal) {
      console.log('📱 [TTSPage] 检测到处理中的任务，打开弹窗', {
        id: latestRecord.id,
        status: latestRecord.status,
      });
      setIsGeneratingModalOpen(true);
    }

    // 如果任务已完成，重置用户关闭标志（允许下次新任务自动打开）
    if (!isProcessing && userClosedGeneratingModal) {
      console.log('📱 [TTSPage] 任务完成，重置用户关闭标志');
      setUserClosedGeneratingModal(false);
    }

    // 如果最新记录已完成且弹窗是打开的，不自动关闭（用户手动关闭）
    // 用户可以查看完成结果，手动关闭弹窗
  }, [generations, isMobile, isGeneratingModalOpen, userClosedGeneratingModal]);

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
      (authLoading || !isLocaleReady ? t('common.loading') : t('tts.selectVoice')),
    [selectedVoice?.display_name, authLoading, isLocaleReady, t]
  );

  return (
    <>
      {/* Mobile Layout */}
      <div className="lg:hidden fixed inset-0 top-[60px] flex flex-col bg-gradient-to-b from-gray-50 to-white">
        <div className="flex-1 flex flex-col px-4 pt-2 gap-1.5 overflow-hidden pb-3">
          {/* Error Message */}
          {error && (
            <div className="flex-shrink-0 p-2.5 bg-red-50 border border-red-200 rounded-xl">
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
              creditsLoading={creditsLoading}
              onClear={handleClearText}
            />
          </div>

          {/* Voice Select Button */}
          <div className="flex-shrink-0">
            <VoiceSelectButton
              voice={selectedVoice}
              selectedStyle={selectedStyle}
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

        {/* 底部导航栏占位空间 */}
        <div className="h-[64px] flex-shrink-0" style={{ height: 'calc(64px + var(--safe-area-inset-bottom, 0px))' }} />
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
              {/* Audio Settings & Voice Selector Button - 水平排列 */}
              <div className="flex items-start gap-3 relative">
                {/* Audio Settings Panel - 占约1/3宽度，使用绝对定位避免挤压下方内容 */}
                <div className="w-1/3 flex-shrink-0 absolute z-10">
                  <AudioSettingsPanel />
                </div>

                {/* Voice Selector Button - 占据剩余空间 */}
                <div className="flex-1 ml-[calc(33.333%+0.75rem)]">
                  <VoiceSelectButton
                    voice={selectedVoice}
                    selectedStyle={selectedStyle}
                    onClick={() => {
                      // TODO: 可以滚动到右侧或打开模态框
                      console.log('Open voice selector');
                    }}
                    disabled={isGenerating}
                    size="medium"
                  />
                </div>
              </div>

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
                  creditsLoading={creditsLoading}
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

            {/* Right Column: Voice Selector (42%) */}
            <div className="col-span-5 h-full min-h-0 flex flex-col gap-3 overflow-hidden">
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
          console.log('📱 [TTSPage] 用户手动关闭生成进度弹窗');
          setIsGeneratingModalOpen(false);
          setUserClosedGeneratingModal(true); // 标记用户手动关闭，防止自动重新打开
        }}
        generation={generations.length > 0 ? generations[0] : null}
        onDelete={(id) => {
          console.log('📱 [TTSPage] 删除记录并关闭弹窗', id);
          handleDeleteGeneration(id);
          // 删除后立即关闭弹窗
          setIsGeneratingModalOpen(false);
          setUserClosedGeneratingModal(true); // 也标记为手动关闭
        }}
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