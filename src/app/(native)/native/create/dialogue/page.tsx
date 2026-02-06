'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useCredits } from '@/contexts/CreditsContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useRewardedAd } from '@/hooks/useRewardedAd';
import { adConfig } from '@/config/native/adConfig';
import CreatePageHeader from '@/components/native/common/CreatePageHeader';
import GradientButton from '@/components/native/common/GradientButton';
import CreditsIcon from '@/components/native/common/CreditsIcon';
import CreditsInfoBar from '@/components/native/common/CreditsInfoBar';
import CrownIcon from '@/components/native/common/CrownIcon';
import LoginModal from '@/components/native/LoginModal';
import InsufficientCreditsModal from '@/components/native/common/InsufficientCreditsModal';
import NativeDailyTasksModal from '@/components/native/NativeDailyTasksModal';
import DialogueLanguageSheet from '@/components/native/create/dialogue/DialogueLanguageSheet';
import DialogueVoiceSheet from '@/components/native/create/dialogue/DialogueVoiceSheet';
import { calculateDialogueCost } from '@/config/creditsCost';
import { createDialogueTask, getDialogueTaskStatus, getDialogueRecordByTaskId, deleteDialogueRecord, type DialogueRecord } from '@/actions/dialogue';
import DialogueDetailModal from '@/components/native/me/DialogueDetailModal';

// localStorage key
const STORAGE_KEY = 'dialogue_draft';

// 轮询超时时间（15分钟）
const POLLING_TIMEOUT_MS = 15 * 60 * 1000;

// 对话片段类型
interface DialogueSegment {
  id: string;
  text: string;
  voice: string;
}

import {
  DIALOGUE_LANGUAGES,
  DIALOGUE_EMOTIONS,
  DIALOGUE_ALL_VOICES,
} from '@/config/native/dialogueConfig';

// 声音类型（直接使用配置）
interface Voice {
  id: string;
  name: string;
  gender: string;
}

// 从配置生成声音列表
const VOICES: Voice[] = DIALOGUE_ALL_VOICES;

// 图标组件
const BackIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const DialogueIcon = () => (
  <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
    <circle cx="8" cy="10" r="1.5"/>
    <circle cx="12" cy="10" r="1.5"/>
    <circle cx="16" cy="10" r="1.5"/>
  </svg>
);

/**
 * Native Text to Dialogue 页面
 */
export default function NativeDialoguePage() {
  const router = useRouter();
  const { user } = useFirebaseAuth();
  const { credits, refreshCredits } = useCredits();
  const { t } = useLanguage();
  const { isSubscribed } = useSubscription();
  const { showRewardedAd } = useRewardedAd();

  // 广告状态
  const [adWatched, setAdWatched] = useState(false);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isInsufficientCreditsModalOpen, setIsInsufficientCreditsModalOpen] = useState(false);
  const [isDailyTasksModalOpen, setIsDailyTasksModalOpen] = useState(false);
  const [insufficientCreditsInfo, setInsufficientCreditsInfo] = useState<{ required: number; current: number } | null>(null);
  const [dialogues, setDialogues] = useState<DialogueSegment[]>([
    { id: '1', text: '', voice: 'Liam' },
  ]);
  const [languageCode, setLanguageCode] = useState('auto');
  const [isLanguageSheetOpen, setIsLanguageSheetOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceSheetDialogueId, setVoiceSheetDialogueId] = useState<string | null>(null);

  // 声音列表（直接使用配置）
  const voices = VOICES;

  // 生成弹窗状态
  const [isGeneratingModalOpen, setIsGeneratingModalOpen] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState<'generating' | 'success' | 'error'>('generating');
  const [generatingError, setGeneratingError] = useState<string | null>(null);
  const [generatingProgress, setGeneratingProgress] = useState(0);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [taskCreatedAt, setTaskCreatedAt] = useState<Date | null>(null);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [generatedDialogue, setGeneratedDialogue] = useState<DialogueRecord | null>(null);

  // textarea refs（用于在光标位置插入情绪标签）
  const textareaRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());

  // 总字符限制
  const maxTotalCharacters = 5000;
  const totalCharacters = dialogues.reduce((sum, d) => sum + d.text.length, 0);

  // 修正 voice ID 大小写
  const fixVoiceCase = (voiceId: string): string => {
    if (!voiceId) return 'Adam';
    return voiceId.charAt(0).toUpperCase() + voiceId.slice(1).toLowerCase();
  };

  // 从 localStorage 加载
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const fixed = parsed.map((d: DialogueSegment) => ({
            ...d,
            voice: fixVoiceCase(d.voice),
          }));
          setDialogues(fixed);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  // 保存到 localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dialogues));
  }, [dialogues]);

  // 非订阅用户：生成开始后自动弹出激励广告
  useEffect(() => {
    if (!isGeneratingModalOpen || generatingStatus !== 'generating' || isSubscribed || adWatched) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        console.log('[Dialogue] Auto showing rewarded ad...');
        const result = await showRewardedAd();
        if (result.success) {
          setAdWatched(true);
        }
      } catch (err) {
        console.error('[Dialogue] Ad error:', err);
      }
    }, adConfig.rewardedAdDelayMs);

    return () => clearTimeout(timer);
  }, [isGeneratingModalOpen, generatingStatus, isSubscribed, adWatched, showRewardedAd]);

  // 轮询任务状态
  useEffect(() => {
    if (!currentTaskId || generatingStatus !== 'generating') {
      return;
    }

    const pollInterval = setInterval(async () => {
      // 超时检查
      if (taskCreatedAt) {
        const elapsed = Date.now() - taskCreatedAt.getTime();
        if (elapsed >= POLLING_TIMEOUT_MS) {
          setGeneratingStatus('error');
          setGeneratingError('Generation timed out. Please check your history later.');
          setCurrentTaskId(null);
          setTaskCreatedAt(null);
          return;
        }
      }

      try {
        const status = await getDialogueTaskStatus(currentTaskId);
        setGeneratingProgress(status.progress);

        if (status.status === 'SUCCESS' && status.audioUrl) {
          // 获取生成的记录并显示详情
          const dialogueRecord = await getDialogueRecordByTaskId(currentTaskId);
          if (dialogueRecord) {
            setGeneratedDialogue(dialogueRecord);
            setIsGeneratingModalOpen(false);
          } else {
            // 如果获取失败，显示成功状态
            setGeneratingStatus('success');
            setGeneratedAudioUrl(status.audioUrl);
          }
          setCurrentTaskId(null);
          setTaskCreatedAt(null);
          refreshCredits();
        } else if (status.status === 'FAILURE') {
          setGeneratingStatus('error');
          setGeneratingError(status.error || 'Generation failed');
          setCurrentTaskId(null);
          setTaskCreatedAt(null);
        }
      } catch (err) {
        console.error('Poll status error:', err);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [currentTaskId, generatingStatus, taskCreatedAt, refreshCredits]);

  // 添加对话
  const addDialogue = () => {
    const newId = Date.now().toString();
    const defaultVoice = voices[0]?.id || 'Jessica';
    setDialogues([...dialogues, { id: newId, text: '', voice: defaultVoice }]);
  };

  // 删除对话
  const removeDialogue = (id: string) => {
    if (dialogues.length > 1) {
      setDialogues(dialogues.filter(d => d.id !== id));
    }
  };

  // 更新对话文本
  const updateDialogueText = (id: string, text: string) => {
    const otherChars = dialogues.filter(d => d.id !== id).reduce((sum, d) => sum + d.text.length, 0);
    if (otherChars + text.length <= maxTotalCharacters) {
      setDialogues(dialogues.map(d => d.id === id ? { ...d, text } : d));
      setError(null);
    }
  };

  // 插入情绪标签（在光标位置）
  const insertEmotion = (id: string, tag: string) => {
    const dialogue = dialogues.find(d => d.id === id);
    if (!dialogue) return;

    const textarea = textareaRefs.current.get(id);
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = dialogue.text;
      const newText = text.slice(0, start) + tag + ' ' + text.slice(end);
      updateDialogueText(id, newText);

      // 恢复光标位置到插入内容之后
      setTimeout(() => {
        const newCursorPos = start + tag.length + 1;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
      }, 0);
    } else {
      // fallback: 插入到末尾
      const newText = dialogue.text + tag + ' ';
      updateDialogueText(id, newText);
    }
  };

  // 更新对话语音
  const updateDialogueVoice = (id: string, voice: string) => {
    setDialogues(dialogues.map(d => d.id === id ? { ...d, voice } : d));
  };

  // 获取语音信息
  const getVoiceInfo = (voiceId: string) => {
    const voice = voices.find(v => v.id === voiceId);
    return {
      name: voice?.name || voiceId,
      gender: voice?.gender || 'male',
    };
  };

  // 预估积分消耗
  const estimatedCredits = calculateDialogueCost(totalCharacters);

  // 是否可以生成
  const canGenerate = dialogues.some(d => d.text.trim().length > 0) && !isGenerating;

  // 关闭生成弹窗
  const handleCloseGeneratingModal = () => {
    setIsGeneratingModalOpen(false);
    setGeneratingStatus('generating');
    setGeneratingError(null);
    setCurrentTaskId(null);
    setTaskCreatedAt(null);
    setGeneratingProgress(0);
  };

  // 查看历史
  const handleViewHistory = () => {
    setIsGeneratingModalOpen(false);
    router.push('/native/me?tab=dialogue');
  };

  // 处理生成
  const handleGenerate = async () => {
    if (!canGenerate) return;

    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    // 打开生成弹窗
    setIsGeneratingModalOpen(true);
    setGeneratingStatus('generating');
    setGeneratingError(null);
    setGeneratingProgress(0);
    setGeneratedAudioUrl(null);
    setAdWatched(false);
    setIsGenerating(true);
    setError(null);

    try {
      // 构建对话数据
      const dialogueData = dialogues
        .filter(d => d.text.trim().length > 0)
        .map(d => ({
          text: d.text,
          voice: d.voice,
        }));

      if (dialogueData.length === 0) {
        setGeneratingStatus('error');
        setGeneratingError('Please enter dialogue content');
        setIsGenerating(false);
        return;
      }

      // 创建任务
      const result = await createDialogueTask({
        dialogue: dialogueData,
        stability: 0.5,
        language_code: languageCode,
      });

      setCurrentTaskId(result.task_id);
      setTaskCreatedAt(new Date());
      setGeneratingProgress(result.progress);

      // 清空草稿
      setDialogues([{ id: '1', text: '', voice: 'Liam' }]);
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('Dialogue task creation failed:', err);
      setGeneratingStatus('error');
      setGeneratingError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex flex-col">
      {/* Header */}
      <CreatePageHeader title={t('native.createDialogue.title')} />

      {/* Scrollable Content */}
      <div
        className="flex-1 overflow-y-auto px-4 pb-4"
        style={{
          paddingBottom: 'calc(80px + var(--safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Error Message */}
        {error && (
          <div className="mb-3 p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Language Selector */}
        <div className="mb-4">
          <label className="text-gray-400 text-xs mb-1.5 block">{t('native.createDialogue.language')}</label>
          <button
            onClick={() => setIsLanguageSheetOpen(true)}
            className="w-full flex items-center justify-between bg-gray-800/60 text-white rounded-xl p-3 text-sm"
          >
            <span>
              {(() => {
                const lang = DIALOGUE_LANGUAGES.find(l => l.code === languageCode);
                if (!lang) return 'Auto';
                return lang.name === lang.nativeName ? lang.name : `${lang.name} (${lang.nativeName})`;
              })()}
            </span>
            <ChevronDownIcon />
          </button>
        </div>

        {/* Total Characters */}
        <div className="mb-3">
          <span className="text-gray-400 text-xs">
            {t('native.createDialogue.totalCharacters', { current: totalCharacters, max: maxTotalCharacters })}
          </span>
        </div>

        {/* Dialogue Segments */}
        <div className="space-y-4 mb-4">
          {dialogues.map((dialogue, index) => (
            <div key={dialogue.id} className="bg-gray-800/60 rounded-2xl p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-white font-medium text-sm">{t('native.createDialogue.dialogue')} {index + 1}</span>
                {dialogues.length > 1 && (
                  <button
                    onClick={() => removeDialogue(dialogue.id)}
                    className="px-3 py-1 text-gray-400 text-xs border border-gray-600 rounded-full hover:text-red-400 hover:border-red-400 transition-colors"
                  >
                    {t('native.createDialogue.remove')}
                  </button>
                )}
              </div>

              {/* Text Input */}
              <div className="mb-3">
                <label className="text-gray-400 text-xs mb-1.5 block">
                  {t('native.createDialogue.text')} <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <textarea
                    ref={(el) => {
                      if (el) textareaRefs.current.set(dialogue.id, el);
                    }}
                    value={dialogue.text}
                    onChange={(e) => updateDialogueText(dialogue.id, e.target.value)}
                    placeholder={t('native.createDialogue.textPlaceholder')}
                    className="w-full h-24 bg-gray-900/60 text-white placeholder-gray-600 rounded-xl p-3 pr-8 resize-none focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                    disabled={isGenerating}
                  />
                  {dialogue.text && (
                    <button
                      onClick={() => updateDialogueText(dialogue.id, '')}
                      disabled={isGenerating}
                      className="absolute right-2 bottom-2 p-1 text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50"
                      title="Clear"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M15 9l-6 6M9 9l6 6" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {DIALOGUE_EMOTIONS.map((emotion) => (
                    <button
                      key={emotion.tag}
                      onClick={() => insertEmotion(dialogue.id, emotion.tag)}
                      disabled={isGenerating}
                      className="px-2 py-1 bg-gray-700/50 text-gray-400 text-xs rounded hover:bg-gray-600/50 hover:text-gray-300 transition-colors disabled:opacity-50"
                    >
                      {t(`native.createDialogue.emotions.${emotion.label}`)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice Selector */}
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block">
                  {t('native.createDialogue.voice')} <span className="text-red-400">*</span>
                </label>
                <button
                  onClick={() => setVoiceSheetDialogueId(dialogue.id)}
                  className="w-full flex items-center justify-between bg-gray-900/60 text-white rounded-xl p-3 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span className={getVoiceInfo(dialogue.voice).gender === 'male' ? 'text-blue-400' : 'text-pink-400'}>
                      {getVoiceInfo(dialogue.voice).gender === 'male' ? '♂' : '♀'}
                    </span>
                    {getVoiceInfo(dialogue.voice).name}
                  </span>
                  <ChevronDownIcon />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Dialogue Button */}
        <button
          onClick={addDialogue}
          disabled={isGenerating}
          className="w-full py-3 border-2 border-dashed border-gray-700 rounded-2xl text-gray-400 flex items-center justify-center gap-2 hover:border-gray-600 hover:text-gray-300 transition-colors disabled:opacity-50"
        >
          <PlusIcon />
          <span>{t('native.createDialogue.addDialogue')}</span>
        </button>
      </div>

      {/* Fixed Bottom Section */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 px-4 pt-3 pb-3 bg-[#0a0a1a]"
        style={{ paddingBottom: 'calc(var(--safe-area-inset-bottom, 0px) + 12px)' }}
      >
        <CreditsInfoBar
          credits={credits}
          creditRules={[{ name: t('native.createDialogue.dialogue'), description: t('native.createDialogue.creditsRule') }]}
          className="mb-3"
        />

        <GradientButton onClick={() => void handleGenerate()} disabled={!canGenerate || isGenerating}>
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{t('native.createDialogue.generating')}</span>
            </>
          ) : (
            <>
              <span>{t('native.createDialogue.generate')}</span>
              {estimatedCredits > 0 && totalCharacters > 0 && (
                <>
                  <CreditsIcon className="w-3.5 h-3.5" />
                  <span>{estimatedCredits}</span>
                </>
              )}
            </>
          )}
        </GradientButton>
      </div>

      {/* Generating Full Page Modal */}
      {isGeneratingModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#0a0a1a] flex flex-col"
          style={{ paddingTop: 'var(--safe-area-inset-top, 0px)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 h-14">
            <button onClick={handleCloseGeneratingModal} className="p-2 -ml-2 text-white">
              <BackIcon />
            </button>
            <div className="flex items-center gap-1 text-white">
              <CreditsIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{credits}</span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-8">
            {generatingStatus === 'generating' && (
              <>
                <div className="relative w-20 h-20 mb-8">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center animate-pulse">
                      <DialogueIcon />
                    </div>
                  </div>
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{t('native.createDialogue.generatingDialogue')}</h3>
                {generatingProgress > 0 && (
                  <p className="text-blue-400 text-sm mb-2">{generatingProgress}%</p>
                )}
                <p className="text-gray-400 text-sm mb-8">
                  {t('native.createDialogue.estimatedTime')}
                </p>
              </>
            )}

            {generatingStatus === 'success' && (
              <>
                <div className="w-20 h-20 mb-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg className="w-10 h-10 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{t('native.createDialogue.dialogueCreated')}</h3>
                <p className="text-gray-400 text-sm mb-4">{t('native.createDialogue.dialogueCreatedDesc')}</p>

                {/* Audio Player */}
                {generatedAudioUrl && (
                  <div className="w-full max-w-xs mb-6">
                    <audio controls className="w-full" src={generatedAudioUrl}>
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}

                <div className="flex gap-3 w-full max-w-xs">
                  <button
                    onClick={handleCloseGeneratingModal}
                    className="flex-1 py-3 bg-gray-700/50 text-white rounded-xl text-sm font-medium hover:bg-gray-600/50 transition-colors"
                  >
                    {t('native.createDialogue.createAnother')}
                  </button>
                  <button
                    onClick={handleViewHistory}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    {t('native.createDialogue.viewHistory')}
                  </button>
                </div>
              </>
            )}

            {generatingStatus === 'error' && (
              <>
                <div className="w-20 h-20 mb-8 rounded-full bg-red-500/20 flex items-center justify-center">
                  {generatingError?.includes('Insufficient credits') ? (
                    <CreditsIcon className="w-10 h-10 text-red-400" />
                  ) : (
                    <svg className="w-10 h-10 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M15 9l-6 6M9 9l6 6" />
                    </svg>
                  )}
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">
                  {generatingError?.includes('Insufficient credits') ? t('native.createDialogue.insufficientCredits') : t('native.createDialogue.generationFailed')}
                </h3>
                <p className="text-red-400 text-sm mb-8 text-center px-4">
                  {generatingError?.includes('Insufficient credits')
                    ? t('native.createDialogue.insufficientCreditsDesc')
                    : (generatingError || t('native.createDialogue.generationFailed'))}
                </p>
                <div className="flex gap-3 w-full max-w-xs">
                  <button
                    onClick={handleCloseGeneratingModal}
                    className="flex-1 py-3 bg-gray-700/50 text-white rounded-xl text-sm font-medium hover:bg-gray-600/50 transition-colors"
                  >
                    {t('native.createDialogue.close')}
                  </button>
                  {generatingError?.includes('Insufficient credits') ? (
                    <button
                      onClick={() => {
                        handleCloseGeneratingModal();
                        setInsufficientCreditsInfo({ required: estimatedCredits, current: credits });
                        setIsInsufficientCreditsModalOpen(true);
                      }}
                      className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                      <CrownIcon className="w-4 h-4" />
                      {t('native.createDialogue.getCredits')}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        handleCloseGeneratingModal();
                        void handleGenerate();
                      }}
                      className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      {t('native.createDialogue.tryAgain')}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={() => setIsLoginModalOpen(false)}
      />

      {/* Insufficient Credits Modal */}
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

      {/* Daily Tasks Modal */}
      <NativeDailyTasksModal
        isOpen={isDailyTasksModalOpen}
        onClose={() => setIsDailyTasksModalOpen(false)}
      />

      {/* Language Selector Sheet */}
      <DialogueLanguageSheet
        isOpen={isLanguageSheetOpen}
        onClose={() => setIsLanguageSheetOpen(false)}
        selectedCode={languageCode}
        onSelect={setLanguageCode}
      />

      {/* Voice Selector Sheet */}
      <DialogueVoiceSheet
        isOpen={voiceSheetDialogueId !== null}
        onClose={() => setVoiceSheetDialogueId(null)}
        selectedVoiceId={voiceSheetDialogueId ? dialogues.find(d => d.id === voiceSheetDialogueId)?.voice || 'Adam' : 'Adam'}
        onSelect={(voiceId) => {
          if (voiceSheetDialogueId) {
            updateDialogueVoice(voiceSheetDialogueId, voiceId);
          }
        }}
      />

      {/* Dialogue Detail Modal - 生成成功后显示 */}
      {generatedDialogue && (
        <DialogueDetailModal
          dialogue={generatedDialogue}
          onClose={() => setGeneratedDialogue(null)}
          onRecreate={() => {
            // 使用生成的对话参数重新创建
            try {
              const dialogueItems = JSON.parse(generatedDialogue.dialogue_json);
              if (Array.isArray(dialogueItems) && dialogueItems.length > 0) {
                setDialogues(dialogueItems.map((item: { text: string; voice: string }, index: number) => ({
                  id: (index + 1).toString(),
                  text: item.text,
                  voice: item.voice,
                })));
              }
            } catch {
              // ignore parse error
            }
            setGeneratedDialogue(null);
          }}
          onDelete={async (dialogue) => {
            await deleteDialogueRecord(dialogue.id);
            setGeneratedDialogue(null);
          }}
        />
      )}
    </div>
  );
}
