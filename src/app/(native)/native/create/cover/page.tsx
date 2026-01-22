'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useCredits } from '@/contexts/CreditsContext';
import GradientButton from '@/components/native/common/GradientButton';
import CreditsIcon from '@/components/native/common/CreditsIcon';
import CreditsInfoBar from '@/components/native/common/CreditsInfoBar';
import LoginModal from '@/components/native/LoginModal';
import CreateSheet from '@/components/native/CreateSheet';
import {
  voiceCategories,
  formatUsesCount,
  type CoverVoice,
} from '@/config/native/coverVoices';
import { getMusicRecords, type MusicRecord } from '@/actions/music';
import {
  getRvcVoiceModels,
  createCoverTask,
  getCoverTaskStatus,
  type RvcVoiceModel,
} from '@/actions/cover';
import { sendLocalNotification } from '@/lib/notifications';

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

const TrashIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
  </svg>
);

const CrownIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.5 19h19v2h-19v-2zm19.57-9.36c-.21-.8-1.04-1.28-1.84-1.06l-4.63 1.22-3.15-5.14c-.45-.74-1.44-.96-2.19-.51-.27.16-.49.4-.62.68L6.5 9.8l-4.63-1.22c-.8-.22-1.63.26-1.84 1.06-.1.34-.04.72.14 1.03l4.85 8.13c.16.27.44.44.75.52.13.03.26.05.39.05h11.68c.13 0 .26-.02.39-.05.31-.08.59-.25.75-.52l4.85-8.13c.18-.31.24-.69.14-1.03z" />
  </svg>
);

const UploadIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
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

const CoverIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
    <path d="M19 10v2a7 7 0 01-14 0v-2" />
    <path d="M8 21h8" />
    <path d="M12 17v4" />
    <path d="M3 9l2-2m0 0l2 2m-2-2v6" />
    <path d="M21 9l-2-2m0 0l-2 2m2-2v6" />
  </svg>
);

const PrivacyShieldIcon = () => (
  <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 6c1.1 0 2 .9 2 2 0 .74-.4 1.38-1 1.72V14h-2v-3.28c-.6-.34-1-.98-1-1.72 0-1.1.9-2 2-2z" />
  </svg>
);

const PitchIcon = () => (
  <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3v18M5 8l7-5 7 5M5 16l7 5 7-5" />
  </svg>
);

/**
 * Native AI Cover 页面
 */
export default function NativeCoverPage() {
  const router = useRouter();
  const { user } = useFirebaseAuth();
  const { credits } = useCredits();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [isGeneratingModalOpen, setIsGeneratingModalOpen] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState<'generating' | 'success' | 'error'>('generating');
  const [generatingError, setGeneratingError] = useState<string | null>(null);
  const [generatingProgress, setGeneratingProgress] = useState(0);

  const [error, setError] = useState<string | null>(null);

  // Cover specific states
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
  const [isPublic, setIsPublic] = useState(true);

  // Parameter sheet state
  const [isParameterSheetOpen, setIsParameterSheetOpen] = useState(false);

  // History sheet states
  const [isHistorySheetOpen, setIsHistorySheetOpen] = useState(false);
  const [musicHistory, setMusicHistory] = useState<MusicRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedHistoryMusic, setSelectedHistoryMusic] = useState<MusicRecord | null>(null);

  // 加载 Cover 声音模型
  useEffect(() => {
    setIsLoadingVoices(true);
    getRvcVoiceModels(voiceCategory === 'all' ? undefined : voiceCategory)
      .then((voices) => {
        setCoverVoices(voices);
      })
      .catch((err) => {
        console.error('Failed to load cover voices:', err);
      })
      .finally(() => {
        setIsLoadingVoices(false);
      });
  }, [voiceCategory]);

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

  // Cover 功能积分
  const COVER_CREDITS = 50;

  // 预估积分消耗
  const hasInput = (() => {
    const hasAudio = coverAudioFile !== null || selectedHistoryMusic !== null;
    return hasAudio && selectedVoice !== null;
  })();
  const estimatedCredits = hasInput ? COVER_CREDITS : 0;

  // 是否可以生成
  const canGenerate = (() => {
    if (isCoverGenerating) return false;
    const hasAudio = coverAudioFile !== null || selectedHistoryMusic !== null;
    return hasAudio && selectedVoice !== null;
  })();

  // 处理生成
  const handleGenerate = async () => {
    console.log('🎤 [handleGenerate] 开始生成', { canGenerate, user: !!user });

    if (!canGenerate) {
      console.log('🎤 [handleGenerate] canGenerate is false, returning');
      return;
    }

    if (!user) {
      console.log('🎤 [handleGenerate] 用户未登录，显示登录弹窗');
      setIsLoginModalOpen(true);
      return;
    }

    // 打开生成中弹窗
    console.log('🎤 [handleGenerate] 打开生成中弹窗');
    setIsGeneratingModalOpen(true);
    setGeneratingStatus('generating');
    setGeneratingError(null);
    setError(null);
    setIsCoverGenerating(true);

    try {
      if ((!coverAudioFile && !selectedHistoryMusic) || !selectedVoice) {
        throw new Error('Please select an audio file and a voice');
      }

      let audioUrl: string;

      // 如果从历史选择，直接使用现有 URL
      if (selectedHistoryMusic && selectedHistoryMusic.audio_url) {
        audioUrl = selectedHistoryMusic.audio_url;
        console.log('🎤 [handleGenerate] 使用历史音乐:', audioUrl);
      } else if (coverAudioFile) {
        // 上传音频文件到 R2
        console.log('🎤 [handleGenerate] 上传音频文件');
        const formData = new FormData();
        formData.append('file', coverAudioFile);
        formData.append('type', 'cover-input');

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload audio file');
        }

        const uploadResult = await uploadResponse.json();
        audioUrl = uploadResult.url;
        console.log('🎤 [handleGenerate] 音频上传成功:', audioUrl);
      } else {
        throw new Error('No audio source available');
      }

      // 创建 Cover 任务
      const result = await createCoverTask({
        originalAudioUrl: audioUrl,
        voiceModelId: selectedVoice.id,
        pitchChange: coverPitchChange,
        isPublic,
      });

      console.log('🎤 [handleGenerate] createCoverTask 返回', result);

      if (result.status === 'FAILURE') {
        setGeneratingStatus('error');
        setGeneratingError(result.error || 'Failed to create cover task');
        setIsCoverGenerating(false);
        return;
      }

      // 任务创建成功，开始轮询
      setCoverTaskId(result.task_id);
      setCoverStatus(result.status);
      setGeneratingProgress(result.progress || 10);

      // 清空
      handleClearCoverAudio();
      setSelectedVoice(null);
    } catch (err) {
      console.error('🎤 [handleGenerate] Cover 错误:', err);
      setGeneratingStatus('error');
      setGeneratingError(err instanceof Error ? err.message : 'Failed to create cover');
      setIsCoverGenerating(false);
    }
  };

  // 关闭生成弹窗并重置状态
  const handleCloseGeneratingModal = () => {
    setIsGeneratingModalOpen(false);
    setGeneratingStatus('generating');
    setGeneratingError(null);
    setGeneratingProgress(0);
  };

  // 查看历史
  const handleViewHistory = () => {
    console.log('🎤 [handleViewHistory] 跳转到历史页面');
    setIsGeneratingModalOpen(false);
    router.push('/native/me?tab=cover');
  };

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
            <span>AI Cover</span>
            <ChevronDownIcon />
          </button>
          <div className="w-10" />
        </div>
      </div>

      {/* Content Area */}
      <div
        className="flex-1 flex flex-col px-4"
        style={{
          paddingTop: 'calc(var(--safe-area-inset-top, 0px) + 70px)',
          paddingBottom: 'calc(80px + var(--safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Error Message */}
        {error && (
          <div className="mb-3 p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Cover Content */}
        <div className="flex-1 flex flex-col space-y-4 overflow-y-auto">
          {/* Original Song Section */}
          <div>
            <span className="text-white font-medium">Original Song</span>
            {/* Tab: Upload Audio | Select from history */}
            <div className="flex bg-[#1a1a2e] rounded-full p-1 mt-2">
              <button
                onClick={() => setCoverAudioSource('upload')}
                className={`flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-colors ${
                  coverAudioSource === 'upload'
                    ? 'bg-white text-gray-900'
                    : 'text-gray-400'
                }`}
              >
                Upload Audio
              </button>
              <button
                onClick={() => {
                  setCoverAudioSource('history');
                  // 如果还没有选择历史音乐，直接打开选择器
                  if (!selectedHistoryMusic) {
                    handleOpenHistorySheet();
                  }
                }}
                className={`flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-colors ${
                  coverAudioSource === 'history'
                    ? 'bg-white text-gray-900'
                    : 'text-gray-400'
                }`}
              >
                Select from history
              </button>
            </div>

            {/* Upload Area or Selected Audio */}
            {coverAudioFile ? (
              // 显示上传的文件
              <div className="flex items-center gap-3 p-4 bg-gray-800/60 rounded-2xl mt-3">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                  <MusicNoteIcon />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{coverAudioFile.name}</p>
                  <p className="text-gray-400 text-xs">{(coverAudioFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button
                  onClick={handleClearCoverAudio}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <TrashIcon />
                </button>
              </div>
            ) : selectedHistoryMusic ? (
              // 显示从历史选择的音乐
              <div className="flex items-center gap-3 p-4 bg-gray-800/60 rounded-2xl mt-3">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                  <MusicNoteIcon />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {selectedHistoryMusic.title || 'AI Music'}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {formatDuration(selectedHistoryMusic.duration)}
                  </p>
                </div>
                <button
                  onClick={handleClearCoverAudio}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <TrashIcon />
                </button>
                <button className="p-2 text-gray-400 hover:text-white transition-colors">
                  <PlayIcon />
                </button>
              </div>
            ) : coverAudioSource === 'history' ? (
              // 历史模式下显示点击选择区域
              <button
                onClick={handleOpenHistorySheet}
                className="w-full border-2 border-dashed border-gray-600 rounded-2xl p-4 mt-3 flex items-center gap-4 hover:border-purple-500 transition-colors"
              >
                <div className="text-gray-500">
                  <UploadIcon />
                </div>
                <p className="text-gray-400 text-sm text-left">
                  Click to select an original song to create an AI cover.
                </p>
              </button>
            ) : (
              // 上传模式下显示文件选择
              <label className="w-full border-2 border-dashed border-gray-600 rounded-2xl p-4 mt-3 flex items-center gap-4 hover:border-purple-500 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleCoverAudioUpload}
                  className="hidden"
                />
                <div className="text-gray-500">
                  <UploadIcon />
                </div>
                <p className="text-gray-400 text-sm text-left">
                  Click to select an original song to create an AI cover.
                </p>
              </label>
            )}
          </div>

          {/* Select Voice Section */}
          <div>
            <span className="text-white font-medium">Select Voice</span>

            {/* Selected Voice Card (if selected) */}
            {selectedVoice && (
              <div className="flex items-center gap-3 p-3 bg-gray-800/60 rounded-2xl mt-2">
                {selectedVoice.avatar_url ? (
                  <img
                    src={selectedVoice.avatar_url}
                    alt={selectedVoice.name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                    {selectedVoice.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-white font-medium">{selectedVoice.name}</p>
                  <p className="text-gray-400 text-sm">{formatUsesCount(selectedVoice.uses_count)} Uses</p>
                </div>
                <button className="p-2 text-gray-400 hover:text-red-400 transition-colors">
                  <HeartIcon />
                </button>
                {selectedVoice.sample_url && (
                  <button className="p-2 text-gray-400 hover:text-white transition-colors">
                    <PlayIcon />
                  </button>
                )}
              </div>
            )}

            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto mt-3 pb-1 -mx-1 px-1 scrollbar-hide">
              {voiceCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setVoiceCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    voiceCategory === cat.id
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-800/60 text-gray-400 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Voice Grid */}
            <div className="grid grid-cols-5 gap-3 mt-3">
              {/* Clone Voice Button */}
              <button className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 hover:text-purple-400 hover:bg-gray-600 transition-colors">
                  <PlusIcon />
                </div>
                <span className="text-xs text-gray-400 mt-1.5 text-center">Clone Voice</span>
              </button>

              {/* Loading State */}
              {isLoadingVoices && (
                <div className="col-span-4 flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* Voice Items */}
              {!isLoadingVoices && coverVoices.map((voice) => (
                <button
                  key={voice.id}
                  onClick={() => setSelectedVoice({
                    id: voice.id,
                    name: voice.name,
                    slug: voice.slug,
                    avatar_url: voice.avatar_url,
                    sample_url: voice.sample_url,
                    category: voice.category,
                    uses_count: voice.uses_count,
                    is_builtin: voice.is_builtin,
                  })}
                  className="flex flex-col items-center"
                >
                  {voice.avatar_url ? (
                    <img
                      src={voice.avatar_url}
                      alt={voice.name}
                      className={`w-14 h-14 rounded-full object-cover transition-all ${
                        selectedVoice?.id === voice.id
                          ? 'ring-2 ring-purple-400 ring-offset-2 ring-offset-[#0a0a1a]'
                          : 'hover:ring-2 hover:ring-purple-400/50'
                      }`}
                    />
                  ) : (
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all ${
                        selectedVoice?.id === voice.id
                          ? 'bg-gradient-to-br from-purple-500 to-pink-500 ring-2 ring-purple-400 ring-offset-2 ring-offset-[#0a0a1a]'
                          : 'bg-gradient-to-br from-gray-600 to-gray-700 hover:from-purple-600 hover:to-pink-600'
                      }`}
                    >
                      {voice.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-xs text-white mt-1.5 text-center truncate w-full">
                    {voice.name}
                  </span>
                </button>
              ))}

              {/* Empty State */}
              {!isLoadingVoices && coverVoices.length === 0 && (
                <div className="col-span-4 text-center py-8">
                  <p className="text-gray-400 text-sm">No voices available in this category</p>
                </div>
              )}
            </div>
          </div>

          {/* Parameters Trigger */}
          <div>
            <div className="mb-2">
              <span className="text-white font-medium">Parameters</span>
            </div>
            <button
              onClick={() => setIsParameterSheetOpen(true)}
              className="w-full flex items-center justify-between p-3 bg-gray-800/60 rounded-xl"
            >
              <div className="flex items-center gap-2">
                <PitchIcon />
                <span className="text-white text-sm">
                  Pitch · {coverPitchChange > 0 ? '+' : ''}{coverPitchChange}
                </span>
              </div>
              <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 15l-6-6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Section */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 px-4 pt-3 pb-3 bg-[#0a0a1a]"
        style={{ paddingBottom: 'calc(var(--safe-area-inset-bottom, 0px) + 12px)' }}
      >
        {/* Credits Info Bar */}
        <CreditsInfoBar
          credits={credits}
          creditRules={[{ name: 'Cover generation', credits: 50 }]}
          className="mb-3"
        />

        <GradientButton
          onClick={() => void handleGenerate()}
          disabled={!canGenerate || isCoverGenerating}
        >
          {isCoverGenerating ? (
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

      {/* Parameters Bottom Sheet */}
      {isParameterSheetOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsParameterSheetOpen(false)}
          />
          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-[#1a1a2e] rounded-t-3xl p-6 animate-slide-up">
            <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-6" />

            <h3 className="text-white font-semibold text-lg mb-6">Parameters</h3>

            {/* Pitch Adjustment */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white font-medium">Pitch Adjustment</span>
                <span className="text-gray-400 text-sm">{coverPitchChange > 0 ? '+' : ''}{coverPitchChange} semitones</span>
              </div>
              <input
                type="range"
                min="-12"
                max="12"
                value={coverPitchChange}
                onChange={(e) => setCoverPitchChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>-12</span>
                <span>0</span>
                <span>+12</span>
              </div>
            </div>

            {/* Visibility Toggle */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2">
                <PrivacyShieldIcon />
                <span className="text-white">Public</span>
              </div>
              <button
                onClick={() => setIsPublic(!isPublic)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  isPublic ? 'bg-purple-500' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    isPublic ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Done Button */}
            <button
              onClick={() => setIsParameterSheetOpen(false)}
              className="w-full mt-6 py-3 bg-purple-500 text-white font-medium rounded-xl"
            >
              Done
            </button>
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
                {/* Animated Cover Icon */}
                <div className="relative w-20 h-20 mb-8">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center">
                      <div className="text-gray-400 animate-pulse">
                        <CoverIcon />
                      </div>
                    </div>
                  </div>
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">Creating AI Cover...</h3>
                {generatingProgress > 0 && (
                  <p className="text-blue-400 text-sm mb-2">{generatingProgress}%</p>
                )}
                <p className="text-gray-400 text-sm mb-8">
                  Estimated time: <span className="text-blue-400">2-3 minutes</span>
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
                <h3 className="text-white font-semibold text-lg mb-2">AI Cover Created!</h3>
                <p className="text-gray-400 text-sm mb-8">
                  Your AI cover has been generated successfully.
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
                <h3 className="text-white font-semibold text-lg mb-2">Cover Failed</h3>
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
