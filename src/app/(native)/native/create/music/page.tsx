'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useCredits } from '@/contexts/CreditsContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import GradientButton from '@/components/native/common/GradientButton';
import CreditsIcon from '@/components/native/common/CreditsIcon';
import CreditsInfoBar from '@/components/native/common/CreditsInfoBar';
import AssistantInput from '@/components/native/common/AssistantInput';
import AssistantModal from '@/components/native/common/AssistantModal';
import LoginModal from '@/components/native/LoginModal';
import CreateSheet from '@/components/native/CreateSheet';
import {
  musicModelsConfig,
  defaultMusicModelId,
  getMusicModelById,
  type MusicModel,
} from '@/config/native/musicModels';
import {
  voiceCategories,
  formatUsesCount,
  type CoverVoice,
} from '@/config/native/coverVoices';
import { createMusicTask, getMusicTaskStatus, getMusicRecords, type MusicRecord } from '@/actions/music';
import {
  getRvcVoiceModels,
  createCoverTask,
  getCoverTaskStatus,
  type RvcVoiceModel,
} from '@/actions/cover';
import { sendLocalNotification } from '@/lib/notifications';

// localStorage keys
const STORAGE_KEY = 'music_draft';
const LYRICS_PROMPT_KEY = 'music_lyrics_prompt';

// Tab 类型
type MusicTab = 'simple' | 'custom';

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

const ChevronUpIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 15l6-6 6 6" />
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

const CrownIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.5 19h19v2h-19v-2zm19.57-9.36c-.21-.8-1.04-1.28-1.84-1.06l-4.63 1.22-3.15-5.14c-.45-.74-1.44-.96-2.19-.51-.27.16-.49.4-.62.68L6.5 9.8l-4.63-1.22c-.8-.22-1.63.26-1.84 1.06-.1.34-.04.72.14 1.03l4.85 8.13c.16.27.44.44.75.52.13.03.26.05.39.05h11.68c.13 0 .26-.02.39-.05.31-.08.59-.25.75-.52l4.85-8.13c.18-.31.24-.69.14-1.03z" />
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

const ShieldIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const UploadIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
  </svg>
);

const MicIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
    <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
  </svg>
);

const HeartIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);

const PlayIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const MusicNoteIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
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
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
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
  const [generatingStatus, setGeneratingStatus] = useState<'generating' | 'success' | 'error'>('generating');
  const [generatingError, setGeneratingError] = useState<string | null>(null);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [generatingProgress, setGeneratingProgress] = useState(0);

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

  // Cover tab specific states
  const [coverAudioSource, setCoverAudioSource] = useState<'upload' | 'history'>('upload');
  const [selectedVoice, setSelectedVoice] = useState<CoverVoice | null>(null);
  const [voiceCategory, setVoiceCategory] = useState('all');
  const [coverVoices, setCoverVoices] = useState<RvcVoiceModel[]>([]);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [coverAudioFile, setCoverAudioFile] = useState<File | null>(null);
  const [coverAudioUrl, setCoverAudioUrl] = useState<string | null>(null);
  const [coverPitchChange, setCoverPitchChange] = useState(0);
  const [isCoverGenerating, setIsCoverGenerating] = useState(false);
  const [coverTaskId, setCoverTaskId] = useState<string | null>(null);
  const [coverStatus, setCoverStatus] = useState<string | null>(null);

  // History sheet states
  const [isHistorySheetOpen, setIsHistorySheetOpen] = useState(false);
  const [musicHistory, setMusicHistory] = useState<MusicRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedHistoryMusic, setSelectedHistoryMusic] = useState<MusicRecord | null>(null);

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


  // 轮询 Cover 任务状态
  useEffect(() => {
    if (!coverTaskId || coverStatus === 'SUCCESS' || coverStatus === 'FAILURE') {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const status = await getCoverTaskStatus(coverTaskId);
        console.log('🎤 [Cover Polling] 状态:', status);
        setCoverStatus(status.status);
        setGeneratingProgress(status.progress);

        if (status.status === 'SUCCESS') {
          setGeneratingStatus('success');
          setIsCoverGenerating(false);
          setCoverTaskId(null);
          // 发送本地推送通知
          sendLocalNotification('cover', 'success');
        } else if (status.status === 'FAILURE') {
          setGeneratingStatus('error');
          setGeneratingError(status.error || 'Cover generation failed');
          setIsCoverGenerating(false);
          setCoverTaskId(null);
          // 发送本地推送通知
          sendLocalNotification('cover', 'failure');
        }
      } catch (err) {
        console.error('🎤 [Cover Polling] 查询状态失败:', err);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [coverTaskId, coverStatus]);

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

  // 处理 Cover 音频文件上传
  const handleCoverAudioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('audio/')) {
      setError('Please select an audio file');
      return;
    }

    // 验证文件大小 (最大 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB');
      return;
    }

    setCoverAudioFile(file);
    // 创建本地预览 URL
    const url = URL.createObjectURL(file);
    setCoverAudioUrl(url);
    setError(null);
  };

  // 清除 Cover 音频
  const handleClearCoverAudio = () => {
    if (coverAudioUrl) {
      URL.revokeObjectURL(coverAudioUrl);
    }
    setCoverAudioFile(null);
    setCoverAudioUrl(null);
    setSelectedHistoryMusic(null);
  };

  // 格式化时长 (秒 -> MM:SS)
  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 格式化日期 (YYYY-MM-DD)
  const formatDate = (date: Date): string => {
    return new Date(date).toISOString().split('T')[0];
  };

  // 按日期分组音乐记录
  const groupMusicByDate = (records: MusicRecord[]): Record<string, MusicRecord[]> => {
    const groups: Record<string, MusicRecord[]> = {};
    records.forEach((record) => {
      const dateKey = formatDate(record.created_at);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(record);
    });
    return groups;
  };

  // 加载音乐历史
  const loadMusicHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const records = await getMusicRecords(50);
      // 只显示已完成且有音频的记录
      const completedRecords = records.filter(
        (r) => r.status === 'SUCCESS' && r.audio_url
      );
      setMusicHistory(completedRecords);
    } catch (error) {
      console.error('Failed to load music history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // 打开历史选择器
  const handleOpenHistorySheet = () => {
    console.log('🎵 [handleOpenHistorySheet] 打开历史选择器');
    setIsHistorySheetOpen(true);
    loadMusicHistory();
  };

  // 选择历史音乐
  const handleSelectHistoryMusic = (record: MusicRecord) => {
    setSelectedHistoryMusic(record);
    setCoverAudioFile(null);
    setCoverAudioUrl(record.audio_url);
    setIsHistorySheetOpen(false);
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
    setGeneratingProgress(0);
  };

  // 查看历史
  const handleViewHistory = () => {
    console.log('🎵 [handleViewHistory] 跳转到历史页面');
    setIsGeneratingModalOpen(false);
    router.push('/native/me?tab=music');
  };

  // Debug: 监控弹窗状态变化
  useEffect(() => {
    console.log('🎵 [Modal State] isGeneratingModalOpen:', isGeneratingModalOpen, 'status:', generatingStatus);
  }, [isGeneratingModalOpen, generatingStatus]);

  // 轮询任务状态
  useEffect(() => {
    if (!currentTaskId || generatingStatus !== 'generating') {
      return;
    }

    console.log('🎵 [Polling] 开始轮询任务状态:', currentTaskId);

    const pollInterval = setInterval(async () => {
      try {
        const status = await getMusicTaskStatus(currentTaskId);
        console.log('🎵 [Polling] 任务状态:', status);

        setGeneratingProgress(status.progress);

        if (status.status === 'SUCCESS') {
          console.log('🎵 [Polling] 任务完成!');
          setGeneratingStatus('success');
          setCurrentTaskId(null);
          // 发送本地推送通知
          sendLocalNotification('music', 'success');
        } else if (status.status === 'FAILURE') {
          console.log('🎵 [Polling] 任务失败:', status.error);
          setGeneratingStatus('error');
          setGeneratingError(status.error || 'Generation failed');
          setCurrentTaskId(null);
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
  }, [currentTaskId, generatingStatus]);

  const tabs: { id: MusicTab; label: string }[] = [
    { id: 'custom', label: 'Custom' },
    { id: 'simple', label: 'Simple' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex flex-col">
      {/* Fixed Header */}
      <div
        className="fixed top-0 left-0 right-0 z-30 bg-[#0a0a1a]"
        style={{ paddingTop: 'var(--safe-area-inset-top, 0px)' }}
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-white">
            <BackIcon />
          </button>
          <button
            onClick={() => setIsCreateSheetOpen(true)}
            className="flex items-center gap-1 text-white font-semibold"
          >
            <span>AI Music</span>
            <ChevronDownIcon />
          </button>
          <div className="w-10" />
        </div>

        {/* Tabs */}
        <div className="flex px-4 gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-gray-700 text-white'
                  : 'bg-transparent text-gray-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div
        className="flex-1 flex flex-col px-4"
        style={{
          paddingTop: 'calc(var(--safe-area-inset-top, 0px) + 120px)',
          paddingBottom: 'calc(80px + var(--safe-area-inset-bottom, 0px))',
        }}
      >
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
                {selectedModel?.isPremium && (
                  <span className="text-yellow-400">
                    <CrownIcon />
                  </span>
                )}
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
                <span className="text-white font-medium">Reference Audio <span className="text-gray-500 font-normal">(Optional)</span></span>
                <button
                  onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
                  className="flex items-center gap-1.5 text-gray-400 text-sm"
                >
                  <MusicIcon />
                  <span>{selectedModel?.name || model}</span>
                  {selectedModel?.isPremium && (
                    <span className="text-yellow-400">
                      <CrownIcon />
                    </span>
                  )}
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

        {/* Credits Info Bar */}
        <CreditsInfoBar
          credits={credits}
          creditRules={[{ name: 'Music generation', credits: 30 }]}
          className="px-1"
        />
      </div>

      {/* Fixed Bottom Button */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 px-4 py-3 bg-[#0a0a1a]"
        style={{ paddingBottom: 'calc(var(--safe-area-inset-bottom, 0px) + 12px)' }}
      >
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

      {/* Create Sheet */}
      <CreateSheet
        isOpen={isCreateSheetOpen}
        onClose={() => setIsCreateSheetOpen(false)}
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
                      <MusicIcon />
                      <span className="text-white font-medium">{m.name}</span>
                      {m.isPremium && (
                        <span className="text-yellow-400">
                          <CrownIcon />
                        </span>
                      )}
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

      {/* Generating Full Page */}
      {isGeneratingModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#0a0a1a] flex flex-col"
          style={{ paddingTop: 'var(--safe-area-inset-top, 0px)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 h-14">
            <button
              onClick={handleCloseGeneratingModal}
              className="p-2 -ml-2 text-white"
            >
              <BackIcon />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-white">
                <CreditsIcon className="w-4 h-4" />
                <span className="text-sm font-medium">{credits}</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-8">
            {generatingStatus === 'generating' && (
              <>
                {/* Animated Music Icon */}
                <div className="relative w-20 h-20 mb-8">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400 animate-bounce" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">Generating music...</h3>
                {generatingProgress > 0 && (
                  <p className="text-blue-400 text-sm mb-2">{generatingProgress}%</p>
                )}
                <p className="text-gray-400 text-sm mb-8">
                  Estimated queue time: <span className="text-blue-400">3 minutes</span>
                </p>
                <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
                  <CrownIcon />
                  <span>Use fast channel</span>
                </button>
              </>
            )}

            {generatingStatus === 'success' && (
              <>
                {/* Success Icon */}
                <div className="w-20 h-20 mb-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg className="w-10 h-10 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">Music Created!</h3>
                <p className="text-gray-400 text-sm mb-8">
                  Your music has been generated successfully.
                </p>
                <div className="flex gap-3 w-full max-w-xs">
                  <button
                    onClick={handleCloseGeneratingModal}
                    className="flex-1 py-3 bg-gray-700/50 text-white rounded-xl text-sm font-medium hover:bg-gray-600/50 transition-colors"
                  >
                    Create Another
                  </button>
                  <button
                    onClick={handleViewHistory}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    View
                  </button>
                </div>
              </>
            )}

            {generatingStatus === 'error' && (
              <>
                {/* Error Icon */}
                <div className="w-20 h-20 mb-8 rounded-full bg-red-500/20 flex items-center justify-center">
                  <svg className="w-10 h-10 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M15 9l-6 6M9 9l6 6" />
                  </svg>
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">Generation Failed</h3>
                <p className="text-red-400 text-sm mb-8 text-center px-4">
                  {generatingError || 'Something went wrong. Please try again.'}
                </p>
                <div className="flex gap-3 w-full max-w-xs">
                  <button
                    onClick={handleCloseGeneratingModal}
                    className="flex-1 py-3 bg-gray-700/50 text-white rounded-xl text-sm font-medium hover:bg-gray-600/50 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleCloseGeneratingModal();
                      void handleGenerate();
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Try Again
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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

      {/* Music History Sheet */}
      {isHistorySheetOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsHistorySheetOpen(false)}
          />
          {/* Sheet */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-[#1a1a2e] rounded-t-3xl max-h-[70vh] flex flex-col"
            style={{ paddingBottom: 'var(--safe-area-inset-bottom, 0px)' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
              <div className="w-10 h-1 bg-gray-600 rounded-full" />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 pb-6">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : musicHistory.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">No music history yet</p>
                </div>
              ) : (
                Object.entries(groupMusicByDate(musicHistory)).map(([date, records]) => (
                  <div key={date}>
                    {/* Date Header */}
                    <div className="flex items-center gap-2 text-gray-400 text-sm py-3">
                      <ClockIcon />
                      <span>{date}</span>
                    </div>

                    {/* Records */}
                    <div className="space-y-1">
                      {records.map((record) => (
                        <button
                          key={record.id}
                          onClick={() => handleSelectHistoryMusic(record)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-gray-800/60 rounded-xl transition-colors"
                        >
                          {/* Cover Image */}
                          {record.cover_url ? (
                            <img
                              src={record.cover_url}
                              alt={record.title || 'AI Music'}
                              className="w-14 h-14 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                              <MusicNoteIcon />
                            </div>
                          )}

                          {/* Info */}
                          <div className="flex-1 text-left min-w-0">
                            <p className="text-white font-medium truncate">
                              {record.title || 'AI Music'}
                            </p>
                            {record.style && (
                              <p className="text-gray-400 text-sm truncate">{record.style}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-800 my-2" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
