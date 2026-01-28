'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useCredits } from '@/contexts/CreditsContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import CreatePageHeader from '@/components/native/common/CreatePageHeader';
import GradientButton from '@/components/native/common/GradientButton';
import CreditsIcon from '@/components/native/common/CreditsIcon';
import CreditsInfoBar from '@/components/native/common/CreditsInfoBar';
import AssistantInput from '@/components/native/common/AssistantInput';
import AssistantModal from '@/components/native/common/AssistantModal';
import CrownIcon from '@/components/native/common/CrownIcon';
import LoginModal from '@/components/native/LoginModal';
import {
  musicModelsConfig,
  defaultMusicModelId,
  getMusicModelById,
  type MusicModel,
} from '@/config/native/musicModels';
import { createMusicTask, getMusicTaskStatus, getMusicRecordByTaskId, deleteMusicRecord, type MusicRecord } from '@/actions/music';
import { sendLocalNotification } from '@/lib/notifications';
import { checkCreditsBeforeGenerate } from '@/lib/credits-check';
import MusicDetailModal from '@/components/native/me/MusicDetailModal';
import GeneratingModal, { type GeneratingStatus } from '@/components/native/common/GeneratingModal';

// localStorage keys
const STORAGE_KEY = 'music_draft';
const LYRICS_PROMPT_KEY = 'music_lyrics_prompt';

// Tab 类型
type MusicTab = 'simple' | 'custom';

// 图标组件
const ChevronDownIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const PrivacyShieldIcon = () => (
  <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 6c1.1 0 2 .9 2 2 0 .74-.4 1.38-1 1.72V14h-2v-3.28c-.6-.34-1-.98-1-1.72 0-1.1.9-2 2-2z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
  </svg>
);

const MusicIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);

const UploadIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
  </svg>
);

/**
 * Native AI Music 页面
 */
export default function NativeMusicPage() {
  const router = useRouter();
  const { user } = useFirebaseAuth();
  const { credits } = useCredits();
  const { isSubscribed } = useSubscription();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [isParameterSheetOpen, setIsParameterSheetOpen] = useState(false);
  const [isLyricsAssistantOpen, setIsLyricsAssistantOpen] = useState(false);
  const [lyricsPrompt, setLyricsPrompt] = useState('');
  const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false);
  const [isStyleAssistantOpen, setIsStyleAssistantOpen] = useState(false);
  const [stylePrompt, setStylePrompt] = useState('');
  const [isGeneratingStyle, setIsGeneratingStyle] = useState(false);
  const [isPromptAssistantOpen, setIsPromptAssistantOpen] = useState(false);
  const [promptAssistantInput, setPromptAssistantInput] = useState('');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isGeneratingModalOpen, setIsGeneratingModalOpen] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState<GeneratingStatus>('generating');
  const [generatingError, setGeneratingError] = useState<string | null>(null);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [taskCreatedAt, setTaskCreatedAt] = useState<Date | null>(null);
  const [generatingProgress, setGeneratingProgress] = useState(0);
  const [generatedMusic, setGeneratedMusic] = useState<MusicRecord | null>(null);

  const [activeTab, setActiveTab] = useState<MusicTab>('custom');
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState(defaultMusicModelId);
  const [isPublic, setIsPublic] = useState(true);
  const [isInstrumental, setIsInstrumental] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Custom tab specific states
  const [lyrics, setLyrics] = useState('');
  const [style, setStyle] = useState('');
  const [title, setTitle] = useState('');
  const [vocalGender, setVocalGender] = useState<'m' | 'f' | ''>('');

  // 字符限制
  const maxCharacters = 3000;
  const maxLyricsCharacters = 5000;

  // 从 localStorage 加载
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.prompt) setPrompt(parsed.prompt);
        if (parsed.model) setModel(parsed.model);
        if (parsed.activeTab) setActiveTab(parsed.activeTab);
        if (typeof parsed.isInstrumental === 'boolean') setIsInstrumental(parsed.isInstrumental);
        if (typeof parsed.isPublic === 'boolean') setIsPublic(parsed.isPublic);
        // Custom tab fields
        if (parsed.lyrics) setLyrics(parsed.lyrics);
        if (parsed.style) setStyle(parsed.style);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.vocalGender) setVocalGender(parsed.vocalGender);
      } catch {
        // 忽略解析错误
      }
    }
  }, []);

  // 保存到 localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      prompt, model, activeTab, isInstrumental, isPublic,
      lyrics, style, title, vocalGender,
    }));
  }, [prompt, model, activeTab, isInstrumental, isPublic, lyrics, style, title, vocalGender]);


  // 加载 lyrics prompt
  useEffect(() => {
    const savedPrompt = localStorage.getItem(LYRICS_PROMPT_KEY);
    if (savedPrompt) {
      setLyricsPrompt(savedPrompt);
    }
  }, []);

  // 保存 lyrics prompt
  useEffect(() => {
    localStorage.setItem(LYRICS_PROMPT_KEY, lyricsPrompt);
  }, [lyricsPrompt]);

  // 处理文本变化
  const handlePromptChange = (text: string) => {
    if (text.length <= maxCharacters) {
      setPrompt(text);
      setError(null);
    }
  };

  // 处理歌词变化 (Custom tab)
  const handleLyricsChange = (text: string) => {
    if (text.length <= maxLyricsCharacters) {
      setLyrics(text);
      setError(null);
    }
  };

  // 清空文本
  const handleClearPrompt = () => {
    setPrompt('');
    setError(null);
  };

  // 清空歌词
  const handleClearLyrics = () => {
    setLyrics('');
    setError(null);
  };

  // 生成歌词
  const handleGenerateLyrics = async () => {
    if (!lyricsPrompt.trim()) return;

    setIsGeneratingLyrics(true);
    try {
      // 调用 AI 生成歌词 API
      const response = await fetch('/api/ai/generate-lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: lyricsPrompt.trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate lyrics');
      }

      if (data.lyrics) {
        setLyrics(data.lyrics);
        setIsLyricsAssistantOpen(false);
        setLyricsPrompt('');
      }
    } catch (err) {
      console.error('Generate lyrics failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate lyrics');
    } finally {
      setIsGeneratingLyrics(false);
    }
  };

  // 生成风格
  const handleGenerateStyle = async () => {
    if (!stylePrompt.trim()) return;

    setIsGeneratingStyle(true);
    try {
      const response = await fetch('/api/ai/generate-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: stylePrompt.trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate style');
      }

      if (data.style) {
        setStyle(data.style);
        setIsStyleAssistantOpen(false);
        setStylePrompt('');
      }
    } catch (err) {
      console.error('Generate style failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate style');
    } finally {
      setIsGeneratingStyle(false);
    }
  };

  // 生成提示词 (Simple mode)
  const handleGeneratePrompt = async () => {
    if (!promptAssistantInput.trim()) return;

    setIsGeneratingPrompt(true);
    try {
      const response = await fetch('/api/ai/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptAssistantInput.trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate prompt');
      }

      if (data.prompt) {
        setPrompt(data.prompt);
        setIsPromptAssistantOpen(false);
        setPromptAssistantInput('');
      }
    } catch (err) {
      console.error('Generate prompt failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate prompt');
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  // 获取当前选中的模型
  const selectedModel = getMusicModelById(model);

  // 预估积分消耗（根据选中的模型和当前输入）
  const hasInput = (() => {
    if (activeTab === 'custom') return lyrics.trim().length > 0;
    return prompt.trim().length > 0;
  })();
  const estimatedCredits = (() => {
    if (!hasInput) return 0;
    return selectedModel?.credits ?? 30;
  })();

  // 处理模型选择
  const handleModelSelect = (m: MusicModel) => {
    // 如果是 Premium 模型且用户未订阅，跳转到订阅页面
    if (m.isPremium && !isSubscribed) {
      setIsModelSelectorOpen(false);
      router.push('/native/subscribe');
      return;
    }
    setModel(m.id);
    setIsModelSelectorOpen(false);
  };

  // 是否可以生成 (根据当前 tab 判断)
  const canGenerate = (() => {
    if (isGenerating) return false;
    if (activeTab === 'simple') {
      return prompt.trim().length > 0;
    } else if (activeTab === 'custom') {
      return lyrics.trim().length > 0;
    }
    return false;
  })();

  // 处理生成
  const handleGenerate = async () => {
    console.log('🎵 [handleGenerate] 开始生成', { canGenerate, user: !!user, activeTab });

    if (!canGenerate) {
      console.log('🎵 [handleGenerate] canGenerate is false, returning');
      return;
    }

    if (!user) {
      console.log('🎵 [handleGenerate] 用户未登录，显示登录弹窗');
      setIsLoginModalOpen(true);
      return;
    }

    // 检查积分是否足够
    const requiredCredits = selectedModel?.credits ?? 30;
    const hasEnoughCredits = checkCreditsBeforeGenerate({
      currentCredits: credits,
      requiredCredits,
      onInsufficientCredits: () => router.push('/native/subscribe'),
    });
    if (!hasEnoughCredits) return;

    // 打开生成中弹窗
    console.log('🎵 [handleGenerate] 打开生成中弹窗');
    setIsGeneratingModalOpen(true);
    setGeneratingStatus('generating');
    setGeneratingError(null);
    setError(null);

    // Simple/Custom tab 处理
    setIsGenerating(true);

    try {
      // 根据不同 tab 构建请求
      const isCustomMode = activeTab === 'custom';
      console.log('🎵 [handleGenerate] 调用 createMusicTask', { isCustomMode });

      const result = await createMusicTask({
        prompt: isCustomMode ? lyrics.trim() : prompt.trim(),
        model,
        isPublic,
        instrumental: isInstrumental,
        customMode: isCustomMode,
        style: isCustomMode ? style.trim() || undefined : undefined,
        title: isCustomMode ? title.trim() || undefined : undefined,
        vocalGender: isCustomMode && vocalGender ? vocalGender : undefined,
      });

      console.log('🎵 [handleGenerate] createMusicTask 返回', result);

      if (result.status === 'FAILURE') {
        console.log('🎵 [handleGenerate] 任务失败，显示错误');
        setGeneratingStatus('error');
        setGeneratingError(result.error || 'Failed to create music task');
        setIsGenerating(false);
        return;
      }

      // 任务创建成功，保存 task_id 用于轮询
      console.log('🎵 [handleGenerate] 任务提交成功，开始轮询状态');
      setCurrentTaskId(result.task_id);
      setTaskCreatedAt(new Date());
      setGeneratingProgress(result.progress || 10);

      // 清空草稿
      setPrompt('');
      setLyrics('');
      setStyle('');
      setTitle('');
      setVocalGender('');
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('🎵 [handleGenerate] 捕获错误:', err);
      setGeneratingStatus('error');
      setGeneratingError(err instanceof Error ? err.message : 'Failed to generate music');
    } finally {
      setIsGenerating(false);
      console.log('🎵 [handleGenerate] 完成');
    }
  };

  // 关闭生成弹窗并重置状态
  const handleCloseGeneratingModal = () => {
    setIsGeneratingModalOpen(false);
    setGeneratingStatus('generating');
    setGeneratingError(null);
    setCurrentTaskId(null);
    setTaskCreatedAt(null);
    setGeneratingProgress(0);
  };

  // Debug: 监控弹窗状态变化
  useEffect(() => {
    console.log('🎵 [Modal State] isGeneratingModalOpen:', isGeneratingModalOpen, 'status:', generatingStatus);
  }, [isGeneratingModalOpen, generatingStatus]);

  // 轮询任务状态（超时 30 分钟后停止）
  useEffect(() => {
    if (!currentTaskId || generatingStatus !== 'generating') {
      return;
    }

    console.log('🎵 [Polling] 开始轮询任务状态:', currentTaskId);

    const pollInterval = setInterval(async () => {
      // 超时检查：任务创建超过 30 分钟后停止轮询
      if (taskCreatedAt) {
        const taskAgeMinutes = (Date.now() - taskCreatedAt.getTime()) / 1000 / 60;
        if (taskAgeMinutes >= 30) {
          console.log('🎵 [Polling] 任务超时，停止轮询');
          setGeneratingStatus('error');
          setGeneratingError('Generation timed out. Please check your history later.');
          setCurrentTaskId(null);
          setTaskCreatedAt(null);
          return;
        }
      }

      try {
        const status = await getMusicTaskStatus(currentTaskId);
        console.log('🎵 [Polling] 任务状态:', status);

        setGeneratingProgress(status.progress);

        if (status.status === 'SUCCESS') {
          console.log('🎵 [Polling] 任务完成!');
          setGeneratingStatus('loading'); // 先显示加载状态
          // 发送本地推送通知
          sendLocalNotification('music', 'success');
          // 获取生成的音乐记录并显示详情
          const musicRecord = await getMusicRecordByTaskId(currentTaskId);
          if (musicRecord) {
            setGeneratedMusic(musicRecord);
            setIsGeneratingModalOpen(false); // 关闭生成中弹窗
          } else {
            // 如果获取失败，显示成功状态
            setGeneratingStatus('success');
          }
          setCurrentTaskId(null);
          setTaskCreatedAt(null);
        } else if (status.status === 'FAILURE') {
          console.log('🎵 [Polling] 任务失败:', status.error);
          setGeneratingStatus('error');
          setGeneratingError(status.error || 'Generation failed');
          setCurrentTaskId(null);
          setTaskCreatedAt(null);
          // 发送本地推送通知
          sendLocalNotification('music', 'failure');
        }
      } catch (err) {
        console.error('🎵 [Polling] 查询状态失败:', err);
      }
    }, 5000); // 每 5 秒查询一次

    return () => {
      console.log('🎵 [Polling] 停止轮询');
      clearInterval(pollInterval);
    };
  }, [currentTaskId, generatingStatus, taskCreatedAt]);

  const tabs: { id: MusicTab; label: string }[] = [
    { id: 'custom', label: 'Lyrics to Music' },
    { id: 'simple', label: 'Prompt to Music' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex flex-col">
      {/* Header */}
      <CreatePageHeader title="AI Music" />

      {/* Content Area */}
      <div
        className="flex-1 flex flex-col px-4"
        style={{
          paddingBottom: 'calc(80px + var(--safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Tabs */}
        <div className="flex p-1 bg-gray-800/60 rounded-xl mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-black'
                  : 'bg-transparent text-gray-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {/* Error Message */}
        {error && (
          <div className="mb-3 p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Tab Content - Simple Tab */}
        {activeTab === 'simple' && (
          <div className="flex-1 flex flex-col mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium">Prompt</span>
              <button
                onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
                className="flex items-center gap-1.5 text-gray-400 text-sm"
              >
                <MusicIcon />
                <span>{selectedModel?.name || model}</span>
                {selectedModel?.isPremium && <CrownIcon className="w-4 h-4 text-yellow-400" />}
                <ChevronDownIcon />
              </button>
            </div>

            {/* Prompt Input */}
            <AssistantInput
              label=""
              placeholder="A chinese song about summer rain, jazz, mellow, warm, sung by a male voice"
              value={prompt}
              onChange={handlePromptChange}
              maxLength={maxCharacters}
              multiline
              rows={5}
              assistantButtonText="Generate Prompt"
              onAssistantClick={() => setIsPromptAssistantOpen(true)}
              disabled={isGenerating}
              className="flex-1 flex flex-col"
              containerClassName="flex-1 flex flex-col"
              inputClassName="flex-1 min-h-[120px] leading-relaxed"
              rightActions={
                <button
                  onClick={handleClearPrompt}
                  disabled={prompt.length === 0}
                  className="text-gray-500 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <TrashIcon />
                </button>
              }
            />
          </div>
        )}

        {/* Tab Content - Custom Tab */}
        {activeTab === 'custom' && (
          <div className="flex-1 flex flex-col space-y-4 overflow-y-auto">
            {/* Reference Audio */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">Reference Audio</span>
                  <span className="text-gray-500 text-xs">(optional)</span>
                </div>
                <button
                  onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
                  className="flex items-center gap-1.5 text-gray-400 text-sm"
                >
                  <MusicIcon />
                  <span>{selectedModel?.name || model}</span>
                  {selectedModel?.isPremium && <CrownIcon className="w-4 h-4 text-yellow-400" />}
                  <ChevronDownIcon />
                </button>
              </div>
              <button className="w-full flex items-center justify-center gap-2 p-4 bg-gray-800/60 rounded-2xl border-2 border-dashed border-gray-600 text-gray-400 hover:border-purple-500 hover:text-purple-400 transition-colors">
                <UploadIcon />
                <span className="text-sm">Upload or record audio</span>
              </button>
            </div>

            {/* Lyrics Section */}
            <AssistantInput
              label="Lyrics"
              placeholder={"Enter your lyrics here...\n\n[Verse 1]\nWrite your first verse\n\n[Chorus]\nWrite your chorus"}
              value={lyrics}
              onChange={handleLyricsChange}
              maxLength={maxLyricsCharacters}
              multiline
              rows={6}
              assistantButtonText="Generate Lyrics"
              onAssistantClick={() => setIsLyricsAssistantOpen(true)}
              disabled={isGenerating}
              className="flex-1 flex flex-col min-h-[200px]"
              containerClassName="flex-1 flex flex-col"
              inputClassName="flex-1 min-h-[120px] leading-relaxed"
              rightActions={
                <button
                  onClick={handleClearLyrics}
                  disabled={lyrics.length === 0}
                  className="text-gray-500 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <TrashIcon />
                </button>
              }
            />

            {/* Style (optional) */}
            <AssistantInput
              label="Style"
              optional
              placeholder="pop, rock, jazz, electronic..."
              value={style}
              onChange={setStyle}
              maxLength={500}
              multiline
              rows={2}
              assistantButtonText="Generate Style"
              onAssistantClick={() => setIsStyleAssistantOpen(true)}
              disabled={isGenerating}
              rightActions={
                <button
                  onClick={() => setStyle('')}
                  disabled={style.length === 0}
                  className="text-gray-500 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <TrashIcon />
                </button>
              }
            />

            {/* Title (optional) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">Title</span>
                  <span className="text-gray-500 text-xs">(optional)</span>
                </div>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your song a title"
                className="w-full bg-gray-800/60 text-white placeholder-gray-500 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
                disabled={isGenerating}
              />
            </div>

            {/* Vocal Gender - 仅对有人声的音乐有效 */}
            {!isInstrumental && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">Voice</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setVocalGender('')}
                    disabled={isGenerating}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      vocalGender === ''
                        ? 'bg-gray-600 text-white'
                        : 'bg-gray-800/60 text-gray-400 hover:bg-gray-700/60'
                    } disabled:opacity-50`}
                  >
                    Auto
                  </button>
                  <button
                    type="button"
                    onClick={() => setVocalGender('m')}
                    disabled={isGenerating}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      vocalGender === 'm'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800/60 text-gray-400 hover:bg-gray-700/60'
                    } disabled:opacity-50`}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => setVocalGender('f')}
                    disabled={isGenerating}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      vocalGender === 'f'
                        ? 'bg-pink-500 text-white'
                        : 'bg-gray-800/60 text-gray-400 hover:bg-gray-700/60'
                    } disabled:opacity-50`}
                  >
                    Female
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Parameters Section - only show for simple and custom tabs */}
        {(activeTab === 'simple' || activeTab === 'custom') && (
          <div className="mb-4">
            <div className="mb-2">
              <span className="text-white font-medium">Parameters</span>
            </div>

            {/* Parameters Trigger */}
            <button
              onClick={() => setIsParameterSheetOpen(true)}
              className="w-full flex items-center justify-between p-3 bg-gray-800/60 rounded-xl"
            >
              <div className="flex items-center gap-2">
                <PrivacyShieldIcon />
                <span className="text-white text-sm">
                  Visibility · {isPublic ? 'Public' : 'Private'}
                </span>
              </div>
              <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 15l-6-6-6 6" />
              </svg>
            </button>
          </div>
        )}

      </div>

      {/* Fixed Bottom Section */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 px-4 pt-3 pb-3 bg-[#0a0a1a]"
        style={{ paddingBottom: 'calc(var(--safe-area-inset-bottom, 0px) + 12px)' }}
      >
        {/* Credits Info Bar */}
        <CreditsInfoBar
          credits={credits}
          creditRules={[{ name: 'Music generation', credits: 30 }]}
          className="mb-3"
        />

        <GradientButton
          onClick={() => void handleGenerate()}
          disabled={!canGenerate || isGenerating}
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Creating...</span>
            </>
          ) : (
            <>
              <span>Create</span>
              {estimatedCredits > 0 && (
                <>
                  <CreditsIcon className="w-3.5 h-3.5" />
                  <span>{estimatedCredits}</span>
                </>
              )}
            </>
          )}
        </GradientButton>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={() => setIsLoginModalOpen(false)}
      />

      {/* Model Selector Sheet */}
      {isModelSelectorOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsModelSelectorOpen(false)}
          />
          {/* Sheet */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-[#1a1a2e] rounded-t-3xl"
            style={{ paddingBottom: 'var(--safe-area-inset-bottom, 0px)' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-600 rounded-full" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3">
              <h3 className="text-white font-semibold text-lg">Select Model</h3>
              <button
                onClick={() => setIsModelSelectorOpen(false)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <CloseIcon />
              </button>
            </div>
            {/* Model Options */}
            <div className="px-4 pb-6 space-y-3">
              {musicModelsConfig.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleModelSelect(m)}
                  className={`w-full p-4 rounded-2xl text-left transition-colors ${
                    model === m.id
                      ? 'bg-purple-500/20 border-2 border-purple-500'
                      : 'bg-gray-800/60 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">
                        <MusicIcon />
                      </span>
                      <span className="text-white font-medium">{m.name}</span>
                      {m.isPremium && <CrownIcon className="w-4 h-4 text-yellow-400" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-purple-500/20 px-2 py-0.5 rounded-full">
                        <CreditsIcon className="w-3 h-3 text-purple-400" />
                        <span className="text-purple-400 text-xs font-medium">{m.credits}</span>
                      </div>
                      {model === m.id && (
                        <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20,6 9,17 4,12" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm pl-7">{m.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Parameter Settings Sheet */}
      {isParameterSheetOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsParameterSheetOpen(false)}
          />
          {/* Sheet */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-[#1a1a2e] rounded-t-3xl"
            style={{ paddingBottom: 'var(--safe-area-inset-bottom, 0px)' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-600 rounded-full" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-center px-4 pb-4">
              <h3 className="text-white font-semibold text-lg">Parameter Settings</h3>
            </div>
            {/* Content */}
            <div className="px-4 pb-6 space-y-6">
              {/* Instrumental */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-white font-medium">Instrumental</span>
                  <InfoIcon />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsInstrumental(true)}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                      isInstrumental
                        ? 'bg-white text-black'
                        : 'bg-gray-700/50 text-gray-400'
                    }`}
                  >
                    on
                  </button>
                  <button
                    onClick={() => setIsInstrumental(false)}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                      !isInstrumental
                        ? 'bg-white text-black'
                        : 'bg-gray-700/50 text-gray-400'
                    }`}
                  >
                    off
                  </button>
                </div>
              </div>

              {/* Visibility */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-white font-medium">Visibility</span>
                  <InfoIcon />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsPublic(true)}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                      isPublic
                        ? 'bg-white text-black'
                        : 'bg-gray-700/50 text-gray-400'
                    }`}
                  >
                    Public
                  </button>
                  <button
                    onClick={() => setIsPublic(false)}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                      !isPublic
                        ? 'bg-white text-black'
                        : 'bg-gray-700/50 text-gray-400'
                    }`}
                  >
                    Private
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Button */}
            <div className="px-4 pb-4">
              <GradientButton onClick={() => setIsParameterSheetOpen(false)}>
                <span>Done</span>
              </GradientButton>
            </div>
          </div>
        </div>
      )}

      {/* Generating Modal */}
      <GeneratingModal
        isOpen={isGeneratingModalOpen}
        status={generatingStatus}
        type="music"
        progress={generatingProgress}
        error={generatingError}
        credits={credits}
        onClose={handleCloseGeneratingModal}
        onCreateAnother={handleCloseGeneratingModal}
        onTryAgain={() => {
          handleCloseGeneratingModal();
          void handleGenerate();
        }}
      />

      {/* Lyrics Assistant Sheet */}
      {/* Lyrics Assistant Modal */}
      <AssistantModal
        isOpen={isLyricsAssistantOpen}
        onClose={() => setIsLyricsAssistantOpen(false)}
        title="AI Lyrics Assistant"
        description="Describe the theme, mood, or story you want for your lyrics. The AI will generate creative lyrics for you."
        placeholder="e.g., A love song about missing someone in autumn, melancholic but hopeful..."
        value={lyricsPrompt}
        onChange={setLyricsPrompt}
        maxLength={500}
        isGenerating={isGeneratingLyrics}
        onGenerate={() => void handleGenerateLyrics()}
        generateButtonText="Generate Lyrics"
      />

      {/* Style Assistant Modal */}
      <AssistantModal
        isOpen={isStyleAssistantOpen}
        onClose={() => setIsStyleAssistantOpen(false)}
        title="Style Assistant"
        description="Describe your song's mood, theme, or reference artists. AI will generate style tags for you."
        placeholder="e.g., An energetic dance track like Dua Lipa, with synth and strong beats..."
        value={stylePrompt}
        onChange={setStylePrompt}
        maxLength={500}
        isGenerating={isGeneratingStyle}
        onGenerate={() => void handleGenerateStyle()}
        generateButtonText="Generate Style"
      />

      {/* Prompt Assistant Modal (Simple mode) */}
      <AssistantModal
        isOpen={isPromptAssistantOpen}
        onClose={() => setIsPromptAssistantOpen(false)}
        title="Prompt Assistant"
        description="Describe your song idea briefly. AI will expand it into a detailed music generation prompt."
        placeholder="e.g., A happy summer song, a sad love ballad, an energetic workout track..."
        value={promptAssistantInput}
        onChange={setPromptAssistantInput}
        maxLength={500}
        isGenerating={isGeneratingPrompt}
        onGenerate={() => void handleGeneratePrompt()}
        generateButtonText="Generate Prompt"
      />

      {/* Music Detail Modal - 生成成功后显示 */}
      {generatedMusic && (
        <MusicDetailModal
          music={generatedMusic}
          onClose={() => setGeneratedMusic(null)}
          onRecreate={(music) => {
            // 使用生成的音乐参数重新创建
            if (music.lyrics) {
              setLyrics(music.lyrics);
              setActiveTab('custom');
            } else if (music.prompt) {
              setPrompt(music.prompt);
              setActiveTab('simple');
            }
            if (music.style) setStyle(music.style);
            if (music.title) setTitle(music.title);
            setIsInstrumental(music.is_instrumental);
            setModel(music.model);
            setGeneratedMusic(null);
          }}
          onDelete={async (music) => {
            // 删除音乐记录
            await deleteMusicRecord(music.id);
            setGeneratedMusic(null);
          }}
        />
      )}

    </div>
  );
}
