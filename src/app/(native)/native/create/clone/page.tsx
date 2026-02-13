'use client';

import { useState, useEffect } from 'react';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useCredits } from '@/contexts/CreditsContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { calculateVoiceCost } from '@/config/creditsCost';
import { detectPlatform } from '@/lib/platform';
import { checkCreditsBeforeGenerate } from '@/lib/credits-check';
import {
  createCloneTtsTask,
  createVoiceClone,
  getMyClonedVoices,
  deleteClonedVoice,
} from '@/actions/clone';
import type { FishVoiceItem, ClonedVoiceData, CloneTtsResult } from '@/actions/clone';

import CreatePageHeader from '@/components/native/common/CreatePageHeader';
import GradientButton from '@/components/native/common/GradientButton';
import CreditsIcon from '@/components/native/common/CreditsIcon';
import CreditsInfoBar from '@/components/native/common/CreditsInfoBar';
import AssistantInput from '@/components/native/common/AssistantInput';
import AssistantModal from '@/components/native/common/AssistantModal';
import LoginModal from '@/components/native/LoginModal';
import InsufficientCreditsModal from '@/components/native/common/InsufficientCreditsModal';
import NativeDailyTasksModal from '@/components/native/NativeDailyTasksModal';
import FishVoiceGrid from '@/components/native/create/clone/FishVoiceGrid';
import AudioUploader from '@/components/native/create/clone/AudioUploader';

// Tab type
type TabId = 'generate' | 'clone';

/**
 * Voice Clone Page - /native/create/clone
 *
 * Two tabs:
 * 1. Generate: Search Fish Audio voice library, select a voice, generate TTS
 * 2. Clone: Upload/record audio to create a cloned voice model
 */
export default function VoiceClonePage() {
  const { t } = useLanguage();
  const { user } = useFirebaseAuth();
  const { credits } = useCredits();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabId>('generate');

  // Login & Credits modals
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isInsufficientCreditsModalOpen, setIsInsufficientCreditsModalOpen] = useState(false);
  const [isDailyTasksModalOpen, setIsDailyTasksModalOpen] = useState(false);
  const [insufficientCreditsInfo, setInsufficientCreditsInfo] = useState<{ required: number; current: number } | null>(null);

  // ==================== Generate Tab State ====================
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<FishVoiceItem | null>(null);
  const [selectedClonedVoice, setSelectedClonedVoice] = useState<ClonedVoiceData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState<CloneTtsResult | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Text assistant
  const [isTextAssistantOpen, setIsTextAssistantOpen] = useState(false);
  const [textPrompt, setTextPrompt] = useState('');
  const [isGeneratingText, setIsGeneratingText] = useState(false);

  // Audio playback for generated result
  const [isPlayingResult, setIsPlayingResult] = useState(false);
  const [resultAudio, setResultAudio] = useState<HTMLAudioElement | null>(null);

  // ==================== Clone Tab State ====================
  const [cloneAudioBase64, setCloneAudioBase64] = useState<string | null>(null);
  const [cloneAudioFileName, setCloneAudioFileName] = useState<string | null>(null);
  const [cloneReferenceText, setCloneReferenceText] = useState('');
  const [cloneVoiceName, setCloneVoiceName] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const [cloneError, setCloneError] = useState<string | null>(null);
  const [cloneSuccess, setCloneSuccess] = useState(false);

  // ==================== Shared State ====================
  const [clonedVoices, setClonedVoices] = useState<ClonedVoiceData[]>([]);

  // Character limit
  const maxCharacters = user ? 2000 : 500;

  // Load cloned voices
  useEffect(() => {
    if (user) {
      getMyClonedVoices().then(setClonedVoices).catch(console.error);
    }
  }, [user]);

  // Get the active voice ID for generation
  const activeVoiceId = selectedClonedVoice?.fishModelId || selectedVoice?.id || null;

  // Calculate estimated credits
  const estimatedCredits = (() => {
    const trimmedText = text?.trim() || '';
    if (trimmedText.length === 0) return 0;
    return calculateVoiceCost(trimmedText.length, 'clone');
  })();

  const canGenerate = text.trim().length > 0 && activeVoiceId !== null && !isGenerating;

  // ==================== Generate Tab Handlers ====================

  const handleTextChange = (newText: string) => {
    if (newText.length <= maxCharacters) {
      setText(newText);
      setGenerateError(null);
    }
  };

  const handleSelectVoice = (voice: FishVoiceItem) => {
    setSelectedVoice(voice);
    setSelectedClonedVoice(null);
    setGenerateError(null);
  };

  const handleSelectClonedVoice = (voice: ClonedVoiceData) => {
    setSelectedClonedVoice(voice);
    setSelectedVoice(null);
    setGenerateError(null);
  };

  const handleGenerate = async () => {
    if (!canGenerate || !activeVoiceId) return;

    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    const hasEnoughCredits = checkCreditsBeforeGenerate({
      currentCredits: credits,
      requiredCredits: estimatedCredits,
      onInsufficientCredits: () => {
        setInsufficientCreditsInfo({ required: estimatedCredits, current: credits });
        setIsInsufficientCreditsModalOpen(true);
      },
    });
    if (!hasEnoughCredits) return;

    setIsGenerating(true);
    setGenerateError(null);
    setGenerateResult(null);

    try {
      const result = await createCloneTtsTask({
        text: text.trim(),
        fishVoiceId: activeVoiceId,
        voiceName: selectedClonedVoice?.name || selectedVoice?.title || 'Fish Voice',
        platform: detectPlatform(),
      });

      if (result.status === 'FAILURE') {
        setGenerateError(result.error || 'Generation failed');
      } else {
        setGenerateResult(result);
        setText('');
      }
    } catch (err) {
      console.error('Clone TTS failed:', err);
      setGenerateError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayResult = () => {
    if (!generateResult?.audio_url) return;

    if (isPlayingResult && resultAudio) {
      resultAudio.pause();
      setIsPlayingResult(false);
      return;
    }

    const audio = new Audio(generateResult.audio_url);
    audio.onended = () => setIsPlayingResult(false);
    audio.play();
    setResultAudio(audio);
    setIsPlayingResult(true);
  };

  // Generate text helper
  const handleGenerateText = async () => {
    if (!textPrompt.trim()) return;
    setIsGeneratingText(true);
    try {
      const response = await fetch('/api/ai/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textPrompt.trim() }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed');
      if (data.text) {
        setText(data.text);
        setIsTextAssistantOpen(false);
        setTextPrompt('');
      }
    } catch (err) {
      console.error('Generate text failed:', err);
    } finally {
      setIsGeneratingText(false);
    }
  };

  // ==================== Clone Tab Handlers ====================

  const handleClone = async () => {
    if (!cloneAudioBase64 || !cloneReferenceText.trim() || !cloneVoiceName.trim()) return;

    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    setIsCloning(true);
    setCloneError(null);
    setCloneSuccess(false);

    try {
      const result = await createVoiceClone({
        name: cloneVoiceName.trim(),
        audioBase64: cloneAudioBase64,
        audioFileName: cloneAudioFileName || 'recording.mp3',
        referenceText: cloneReferenceText.trim(),
      });

      if (result.success && result.clonedVoice) {
        setCloneSuccess(true);
        setCloneAudioBase64(null);
        setCloneAudioFileName(null);
        setCloneReferenceText('');
        setCloneVoiceName('');
        // Refresh cloned voices list
        const updated = await getMyClonedVoices();
        setClonedVoices(updated);
      } else {
        setCloneError(result.error || 'Clone failed');
      }
    } catch (err) {
      console.error('Voice clone failed:', err);
      setCloneError(err instanceof Error ? err.message : 'Clone failed');
    } finally {
      setIsCloning(false);
    }
  };

  const handleDeleteClonedVoice = async (id: number) => {
    if (!confirm(t('native.createClone.clone.deleteConfirm'))) return;

    const result = await deleteClonedVoice(id);
    if (result.success) {
      setClonedVoices(prev => prev.filter(v => v.id !== id));
      if (selectedClonedVoice?.id === id) {
        setSelectedClonedVoice(null);
      }
    }
  };

  const canClone = cloneAudioBase64 !== null && cloneReferenceText.trim().length > 0 && cloneVoiceName.trim().length > 0 && !isCloning;

  // ==================== Render ====================

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex flex-col">
      {/* Header */}
      <CreatePageHeader title={t('native.createClone.title')} />

      {/* Tabs */}
      <div className="px-4 flex-shrink-0">
        <div className="flex bg-gray-800/40 rounded-xl p-1">
          {(['generate', 'clone'] as TabId[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === tab
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {t(`native.createClone.tabs.${tab}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div
        className="flex-1 flex flex-col px-4 pt-3 min-h-0 overflow-y-auto"
        style={{ paddingBottom: 'calc(110px + var(--safe-area-inset-bottom, 0px))' }}
      >
        {/* ==================== Generate Tab ==================== */}
        {activeTab === 'generate' && (
          <div className="space-y-3 flex-1">
            {/* Error */}
            {generateError && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
                <p className="text-red-400 text-sm">{generateError}</p>
              </div>
            )}

            {/* Success result */}
            {generateResult && generateResult.status === 'SUCCESS' && (
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePlayResult}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                  >
                    {isPlayingResult ? (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="text-green-400 text-sm font-medium">
                      {generateResult.duration ? `${generateResult.duration.toFixed(1)}s` : 'Generated'}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {generateResult.credits_cost} credits used
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Text Input */}
            <AssistantInput
              label={t('native.createClone.generate.enterText')}
              placeholder={t('native.createClone.generate.placeholder')}
              value={text}
              onChange={handleTextChange}
              maxLength={maxCharacters}
              multiline
              rows={5}
              assistantButtonText={t('native.createVoice.generateText')}
              onAssistantClick={() => setIsTextAssistantOpen(true)}
              disabled={isGenerating}
              className="flex-shrink-0"
            />

            {/* Voice Selector Grid */}
            <FishVoiceGrid
              selectedVoice={selectedVoice}
              onSelect={handleSelectVoice}
              clonedVoices={clonedVoices}
              onSelectCloned={handleSelectClonedVoice}
              selectedClonedVoice={selectedClonedVoice}
              onDeleteCloned={handleDeleteClonedVoice}
            />
          </div>
        )}

        {/* ==================== Clone Tab ==================== */}
        {activeTab === 'clone' && (
          <div className="space-y-4 flex-1">
            {/* Error */}
            {cloneError && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
                <p className="text-red-400 text-sm">{cloneError}</p>
              </div>
            )}

            {/* Success */}
            {cloneSuccess && (
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
                <p className="text-green-400 text-sm">{t('native.createClone.clone.cloneSuccess')}</p>
              </div>
            )}

            {/* Audio Upload / Record */}
            <AudioUploader
              audioBase64={cloneAudioBase64}
              audioFileName={cloneAudioFileName}
              onAudioChange={(base64, fileName) => {
                setCloneAudioBase64(base64);
                setCloneAudioFileName(fileName);
                setCloneError(null);
                setCloneSuccess(false);
              }}
            />

            {/* Reference Text */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">
                {t('native.createClone.clone.referenceText')}
              </label>
              <textarea
                value={cloneReferenceText}
                onChange={(e) => setCloneReferenceText(e.target.value)}
                placeholder={t('native.createClone.clone.referenceTextPlaceholder')}
                rows={3}
                className="w-full px-4 py-3 bg-gray-800/60 border border-gray-700/50 rounded-xl text-white text-sm placeholder-gray-500 resize-none focus:outline-none focus:border-purple-500/50"
              />
            </div>

            {/* Voice Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">
                {t('native.createClone.clone.voiceName')}
              </label>
              <input
                type="text"
                value={cloneVoiceName}
                onChange={(e) => setCloneVoiceName(e.target.value)}
                placeholder={t('native.createClone.clone.voiceNamePlaceholder')}
                maxLength={50}
                className="w-full px-4 py-3 bg-gray-800/60 border border-gray-700/50 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
              />
            </div>

            {/* Existing Cloned Voices */}
            {clonedVoices.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-300">
                  {t('native.createClone.generate.myClonedVoices')} ({clonedVoices.length})
                </h3>
                <div className="space-y-2">
                  {clonedVoices.map((voice) => (
                    <div
                      key={voice.id}
                      className="flex items-center gap-3 p-3 bg-gray-800/40 border border-gray-700/30 rounded-xl"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                          <path d="M19 10v2a7 7 0 01-14 0v-2" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium truncate">{voice.name}</div>
                        <div className="text-gray-500 text-xs">
                          {voice.status === 'TRAINING' ? 'Training...' : 'Ready'}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteClonedVoice(voice.id)}
                        className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {clonedVoices.length === 0 && !cloneAudioBase64 && (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                  <path d="M19 10v2a7 7 0 01-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
                <p className="text-sm">{t('native.createClone.clone.noClonedVoices')}</p>
                <p className="text-xs mt-1">{t('native.createClone.clone.createFirst')}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fixed Bottom Section */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 px-4 pt-3 pb-3 bg-[#0a0a1a]"
        style={{ paddingBottom: 'calc(var(--safe-area-inset-bottom, 0px) + 12px)' }}
      >
        {activeTab === 'generate' ? (
          <>
            <CreditsInfoBar
              credits={credits}
              creditRules={[{ name: t('native.createClone.generate.voiceGeneration'), description: t('native.createClone.generate.creditsRule') }]}
              className="mb-3"
            />
            <GradientButton
              onClick={() => void handleGenerate()}
              disabled={!canGenerate || isGenerating}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{t('native.createClone.generate.generating')}</span>
                </>
              ) : (
                <>
                  <span>{t('native.createClone.generate.generate')}</span>
                  {estimatedCredits > 0 && (
                    <>
                      <CreditsIcon className="w-3.5 h-3.5" />
                      <span>{estimatedCredits}</span>
                    </>
                  )}
                </>
              )}
            </GradientButton>
          </>
        ) : (
          <GradientButton
            onClick={() => void handleClone()}
            disabled={!canClone || isCloning}
          >
            {isCloning ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{t('native.createClone.clone.creating')}</span>
              </>
            ) : (
              <span>{t('native.createClone.clone.createClone')}</span>
            )}
          </GradientButton>
        )}
      </div>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={() => setIsLoginModalOpen(false)}
      />

      <InsufficientCreditsModal
        isOpen={isInsufficientCreditsModalOpen}
        onClose={() => setIsInsufficientCreditsModalOpen(false)}
        onGetFreeCredits={() => {
          setIsInsufficientCreditsModalOpen(false);
          setIsDailyTasksModalOpen(true);
        }}
        requiredCredits={insufficientCreditsInfo?.required}
        currentCredits={insufficientCreditsInfo?.current}
      />

      <NativeDailyTasksModal
        isOpen={isDailyTasksModalOpen}
        onClose={() => setIsDailyTasksModalOpen(false)}
      />

      <AssistantModal
        isOpen={isTextAssistantOpen}
        onClose={() => setIsTextAssistantOpen(false)}
        title={t('native.createVoice.textAssistant')}
        description={t('native.createVoice.textAssistantDesc')}
        placeholder={t('native.createVoice.textAssistantPlaceholder')}
        value={textPrompt}
        onChange={setTextPrompt}
        maxLength={500}
        isGenerating={isGeneratingText}
        onGenerate={() => void handleGenerateText()}
        generateButtonText={t('native.createVoice.generateText')}
      />
    </div>
  );
}
