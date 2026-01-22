'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Download, Pencil } from 'lucide-react';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { getMusicRecords, getMusicTaskStatus, deleteMusicRecord, type MusicRecord } from '@/actions/music';
import { getTtsRecords, type TtsRecord } from '@/actions/tts';
import { getCoverRecords, deleteCoverRecord, type CoverRecord } from '@/actions/cover';
import GradientButton from '@/components/ui/GradientButton';
import DeleteConfirmDialog from '@/components/native/ui/DeleteConfirmDialog';

type TabType = 'music' | 'cover' | 'voices';

interface VideoItem {
  taskId: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILURE';
  progress: number;
  prompt: string;
  model: string;
  resolution: string;
  duration: number;
  aspectRatio: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

const tabs: { id: TabType; label: string }[] = [
  { id: 'music', label: 'Music' },
  { id: 'cover', label: 'Cover' },
  { id: 'voices', label: 'Voices' },
];

const emptyStateMessages: Record<TabType, { title: string; subtitle: string; createLink: string }> = {
  music: {
    title: 'No content yet.',
    subtitle: 'Create your first AI music.',
    createLink: '/native/create/music',
  },
  cover: {
    title: 'No content yet.',
    subtitle: 'Create your first AI cover.',
    createLink: '/native/create/cover',
  },
  voices: {
    title: 'No content yet.',
    subtitle: 'Create your first voice.',
    createLink: '/native/create/voice',
  },
};

// 空状态插画
const EmptyIllustration = () => (
  <svg
    className="w-16 h-16 text-gray-600"
    viewBox="0 0 120 120"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    {/* 文件夹 */}
    <rect x="25" y="40" width="50" height="45" rx="4" />
    <path d="M25 50 L25 45 Q25 40 30 40 L45 40 L50 35 L70 35 Q75 35 75 40 L75 50" />
    {/* 加号 */}
    <line x1="50" y1="55" x2="50" y2="75" strokeWidth="3" />
    <line x1="40" y1="65" x2="60" y2="65" strokeWidth="3" />
    {/* 人物 */}
    <circle cx="90" cy="55" r="8" />
    <path d="M82 75 Q82 65 90 65 Q98 65 98 75" />
    <path d="M85 72 L80 85" />
    <path d="M95 68 L105 60" />
  </svg>
);

// 格式化日期 (短格式)
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
}

// 格式化日期 (长格式，用于分组标题)
function formatDateLong(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

// 格式化时间 (秒 -> mm:ss)
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 获取模型显示名称
function getModelDisplayName(model: string): string {
  const modelMap: Record<string, string> = {
    'music-5.0': 'v5.0',
    'music-4.5-plus': 'v4.5+',
    'music-4.5': 'v4.5',
  };
  return modelMap[model] || model;
}

// 音乐详情弹窗组件
function MusicDetailModal({
  music,
  onClose,
  onRecreate,
  onDelete,
}: {
  music: MusicRecord;
  onClose: () => void;
  onRecreate: (music: MusicRecord) => void;
  onDelete: (music: MusicRecord) => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(music.duration || 0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const displayTitle = music.title || 'AI Music';
  const displayLyrics = music.lyrics || music.prompt || '';

  // 播放/暂停
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // 更新播放进度
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // 加载元数据
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  // 播放结束
  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // 进度条点击
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    audioRef.current.currentTime = percent * duration;
    setCurrentTime(percent * duration);
  };

  // 下载音频
  const handleDownload = async () => {
    if (!music.audio_url) return;
    try {
      const response = await fetch(music.audio_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${displayTitle}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  // 执行删除
  const handleConfirmDelete = async () => {
    await onDelete(music);
    setShowDeleteDialog(false);
    onClose();
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0a0a1a] flex flex-col">
      {/* 隐藏的音频元素 */}
      {music.audio_url && (
        <audio
          ref={audioRef}
          src={music.audio_url}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
        />
      )}

      {/* 顶部导航 */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center bg-gray-800/50 rounded-full"
        >
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="6" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="18" r="2" />
            </svg>
          </button>
        </div>
      </div>

      {/* 可滚动内容区域 */}
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        {/* 封面图 */}
        <div className="flex justify-center mb-4">
          <div className="relative w-48 h-48 rounded-xl overflow-hidden shadow-2xl">
            {music.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={music.cover_url}
                alt={displayTitle}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 to-pink-900">
                <svg className="w-16 h-16 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </div>
            )}
            {/* AI 标签 */}
            <div className="absolute top-2 right-2 px-2 py-0.5 bg-purple-500 rounded text-white text-xs font-medium">
              AI
            </div>
          </div>
        </div>

        {/* 标题 */}
        <h1 className="text-2xl font-bold text-white text-center mb-4">{displayTitle}</h1>

        {/* 歌词 */}
        {displayLyrics && (
          <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap mb-6 max-h-48 overflow-y-auto">
            {displayLyrics}
          </div>
        )}
      </div>

      {/* 底部播放器和操作按钮 - 固定在底部 */}
      <div className="flex-shrink-0 px-6 pb-8 bg-[#0a0a1a]">
        {/* 进度条 */}
        <div
          className="w-full h-1 bg-gray-700 rounded-full cursor-pointer mb-2"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-cyan-400 rounded-full" />
          </div>
        </div>

        {/* 时间显示 */}
        <div className="flex justify-between text-gray-500 text-xs mb-4">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* 播放按钮 */}
        <div className="flex justify-center mb-4">
          <button
            onClick={togglePlay}
            disabled={!music.audio_url}
            className="w-16 h-16 flex items-center justify-center bg-gray-700 rounded-full hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            {isPlaying ? (
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg className="w-7 h-7 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>

        {/* Prompt 和删除按钮 */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-gray-500 text-sm flex-1 truncate">
            {music.prompt || 'No prompt provided yet.'}
          </p>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="ml-2 p-2 text-gray-500 hover:text-red-500 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
        </div>

        {/* 模型版本标签 */}
        <div className="mb-4">
          <span className="inline-block px-3 py-1 bg-gray-800 rounded-full text-gray-400 text-xs">
            {getModelDisplayName(music.model)}
          </span>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3">
          <button
            onClick={() => onRecreate(music)}
            className="flex-[1] flex items-center justify-center gap-1.5 py-3 bg-gray-800/80 border border-gray-700 rounded-xl text-white text-sm font-medium hover:bg-gray-700 transition-all"
          >
            <Pencil size={14} />
            Recreate
          </button>
          <GradientButton
            icon={Download}
            iconPosition="left"
            size="md"
            onClick={handleDownload}
            disabled={!music.audio_url}
            className="flex-[2] !py-3"
          >
            Download
          </GradientButton>
        </div>
      </div>

      {/* 删除确认弹窗 */}
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        title="Confirm delete song?"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </div>
  );
}

// Cover 详情弹窗组件
function CoverDetailModal({
  cover,
  onClose,
  onRecreate,
  onDelete,
}: {
  cover: CoverRecord;
  onClose: () => void;
  onRecreate: (cover: CoverRecord) => void;
  onDelete: (cover: CoverRecord) => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(cover.duration || 0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const displayTitle = cover.voice_model_name || 'AI Cover';

  // 播放/暂停
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // 更新播放进度
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // 加载元数据
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  // 播放结束
  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // 进度条点击
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    audioRef.current.currentTime = percent * duration;
    setCurrentTime(percent * duration);
  };

  // 下载音频
  const handleDownload = async () => {
    if (!cover.output_url) return;
    try {
      const response = await fetch(cover.output_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${displayTitle}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  // 执行删除
  const handleConfirmDelete = async () => {
    await onDelete(cover);
    setShowDeleteDialog(false);
    onClose();
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0a0a1a] flex flex-col">
      {/* 隐藏的音频元素 */}
      {cover.output_url && (
        <audio
          ref={audioRef}
          src={cover.output_url}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
        />
      )}

      {/* 顶部导航 */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center bg-gray-800/50 rounded-full"
        >
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="6" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="18" r="2" />
            </svg>
          </button>
        </div>
      </div>

      {/* 可滚动内容区域 */}
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        {/* 封面图 */}
        <div className="flex justify-center mb-4">
          <div className="relative w-48 h-48 rounded-xl overflow-hidden shadow-2xl">
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-900 to-pink-900">
              <svg className="w-16 h-16 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            {/* AI Cover 标签 */}
            <div className="absolute top-2 right-2 px-2 py-0.5 bg-orange-500 rounded text-white text-xs font-medium">
              Cover
            </div>
          </div>
        </div>

        {/* 标题 */}
        <h1 className="text-2xl font-bold text-white text-center mb-4">{displayTitle}</h1>
      </div>

      {/* 底部播放器和操作按钮 - 固定在底部 */}
      <div className="flex-shrink-0 px-6 pb-8 bg-[#0a0a1a]">
        {/* 进度条 */}
        <div
          className="w-full h-1 bg-gray-700 rounded-full cursor-pointer mb-2"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-gradient-to-r from-orange-400 to-pink-500 rounded-full relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-orange-400 rounded-full" />
          </div>
        </div>

        {/* 时间显示 */}
        <div className="flex justify-between text-gray-500 text-xs mb-4">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* 播放按钮 */}
        <div className="flex justify-center mb-4">
          <button
            onClick={togglePlay}
            disabled={!cover.output_url}
            className="w-16 h-16 flex items-center justify-center bg-gray-700 rounded-full hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            {isPlaying ? (
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg className="w-7 h-7 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>

        {/* 声音模型和删除按钮 */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-gray-500 text-sm flex-1 truncate">
            Voice: {cover.voice_model_name}
          </p>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="ml-2 p-2 text-gray-500 hover:text-red-500 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3">
          <button
            onClick={() => onRecreate(cover)}
            className="flex-[1] flex items-center justify-center gap-1.5 py-3 bg-gray-800/80 border border-gray-700 rounded-xl text-white text-sm font-medium hover:bg-gray-700 transition-all"
          >
            <Pencil size={14} />
            Recreate
          </button>
          <GradientButton
            icon={Download}
            iconPosition="left"
            size="md"
            onClick={handleDownload}
            disabled={!cover.output_url}
            className="flex-[2] !py-3"
          >
            Download
          </GradientButton>
        </div>
      </div>

      {/* 删除确认弹窗 */}
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        title="Confirm delete cover?"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </div>
  );
}

// 音乐卡片组件
function MusicCard({ music, onClick }: { music: MusicRecord; onClick: () => void }) {
  const isProcessing = music.status === 'PENDING' || music.status === 'PROCESSING';
  const isSuccess = music.status === 'SUCCESS';
  const isFailed = music.status === 'FAILURE';

  // 显示的标题
  const displayTitle = music.title || 'AI Music';
  // 显示的副标题 (prompt 的前 30 个字符)
  const displaySubtitle = music.prompt?.substring(0, 30) || '';

  return (
    <button onClick={onClick} className="flex items-center gap-3 w-full py-3">
      {/* 封面图 */}
      <div className="relative w-16 h-16 flex-shrink-0 bg-gray-800 rounded-lg overflow-hidden">
        {isSuccess && music.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={music.cover_url}
            alt={displayTitle}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 to-pink-900">
            {isProcessing && (
              <div className="flex flex-col items-center gap-1">
                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-white text-[9px] font-medium">{music.progress}%</span>
              </div>
            )}
            {isFailed && (
              <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            )}
            {!isProcessing && !isFailed && (
              <svg className="w-6 h-6 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            )}
          </div>
        )}
        {/* 状态标签 */}
        {isProcessing && (
          <div className="absolute top-0.5 left-0.5 px-1 py-0.5 bg-purple-500/80 rounded">
            <span className="text-white text-[8px] font-medium">Processing</span>
          </div>
        )}
      </div>

      {/* 文字内容 */}
      <div className="flex-1 text-left min-w-0">
        <h4 className="text-white font-medium text-base truncate">{displayTitle}</h4>
        {displaySubtitle && (
          <p className="text-gray-500 text-sm truncate">{displaySubtitle}</p>
        )}
      </div>
    </button>
  );
}

// 视频卡片组件 - 统一使用正方形显示 (预留，暂未使用)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function VideoCard({ video, onClick }: { video: VideoItem; onClick: () => void }) {
  const isProcessing = video.status === 'PENDING' || video.status === 'PROCESSING';
  const isSuccess = video.status === 'SUCCESS';
  const isFailed = video.status === 'FAILURE';

  return (
    <button onClick={onClick} className="flex flex-col w-full">
      {/* 正方形缩略图 */}
      <div className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden group w-full">
        {/* 缩略图或占位 */}
        {isSuccess && video.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnailUrl}
            alt={video.prompt}
            className="w-full h-full object-cover"
          />
        ) : isSuccess && video.videoUrl ? (
          <video
            src={video.videoUrl}
            className="w-full h-full object-cover"
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
            {isProcessing && (
              <div className="flex flex-col items-center gap-1">
                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-white text-[10px] font-medium">{video.progress}%</span>
              </div>
            )}
            {isFailed && (
              <div className="flex flex-col items-center gap-1">
                <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span className="text-red-400 text-[10px]">Failed</span>
              </div>
            )}
          </div>
        )}

        {/* 状态标签 */}
        {isProcessing && (
          <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-purple-500/80 rounded-full">
            <span className="text-white text-[9px] font-medium">Processing</span>
          </div>
        )}

        {/* 时长标签 */}
        {isSuccess && (
          <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/60 rounded">
            <span className="text-white text-[9px]">{video.duration}s</span>
          </div>
        )}

        {/* Hover 遮罩 */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
      </div>

      {/* 日期 */}
      <span className="text-gray-500 text-[10px] mt-1 text-center">
        {formatDate(video.createdAt)}
      </span>
    </button>
  );
}

// 语音卡片组件
function VoiceCard({ voice, onClick }: { voice: TtsRecord; onClick: () => void }) {
  const isProcessing = voice.status === 'PENDING' || voice.status === 'PROCESSING';
  const isSuccess = voice.status === 'SUCCESS';
  const isFailed = voice.status === 'FAILURE';

  // 显示的标题 - 使用文本的前 30 个字符
  const displayTitle = voice.text?.substring(0, 30) || 'Voice Audio';
  // 显示的副标题 - 使用 voice_name
  const displaySubtitle = voice.voice_name || '';

  return (
    <button onClick={onClick} className="flex items-center gap-3 w-full py-3">
      {/* 图标 */}
      <div className="relative w-16 h-16 flex-shrink-0 bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
        {isProcessing && (
          <div className="flex flex-col items-center gap-1">
            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-white text-[9px] font-medium">{voice.progress}%</span>
          </div>
        )}
        {isFailed && (
          <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        )}
        {isSuccess && (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-900 to-purple-900">
            <svg className="w-6 h-6 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z" />
              <path d="M19 10v2a7 7 0 01-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          </div>
        )}
        {!isProcessing && !isFailed && !isSuccess && (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-900 to-purple-900">
            <svg className="w-6 h-6 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z" />
              <path d="M19 10v2a7 7 0 01-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          </div>
        )}
        {/* 状态标签 */}
        {isProcessing && (
          <div className="absolute top-0.5 left-0.5 px-1 py-0.5 bg-purple-500/80 rounded">
            <span className="text-white text-[8px] font-medium">Processing</span>
          </div>
        )}
        {/* 时长标签 */}
        {isSuccess && voice.duration && (
          <div className="absolute bottom-0.5 right-0.5 px-1 py-0.5 bg-black/60 rounded">
            <span className="text-white text-[9px]">{formatTime(voice.duration)}</span>
          </div>
        )}
      </div>

      {/* 文字内容 */}
      <div className="flex-1 text-left min-w-0">
        <h4 className="text-white font-medium text-base truncate">{displayTitle}</h4>
        {displaySubtitle && (
          <p className="text-gray-500 text-sm truncate">{displaySubtitle}</p>
        )}
      </div>
    </button>
  );
}

// Cover 卡片组件
function CoverCard({ cover, onClick }: { cover: CoverRecord; onClick: () => void }) {
  const isProcessing = cover.status === 'PENDING' || cover.status === 'PROCESSING';
  const isSuccess = cover.status === 'SUCCESS';
  const isFailed = cover.status === 'FAILURE';

  // 显示的标题 - 使用声音模型名称
  const displayTitle = cover.voice_model_name || 'AI Cover';

  return (
    <button onClick={onClick} className="flex items-center gap-3 w-full py-3">
      {/* 图标 */}
      <div className="relative w-16 h-16 flex-shrink-0 bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
        {isProcessing && (
          <div className="flex flex-col items-center gap-1">
            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-white text-[9px] font-medium">{cover.progress}%</span>
          </div>
        )}
        {isFailed && (
          <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        )}
        {isSuccess && (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-900 to-pink-900">
            <svg className="w-6 h-6 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
        )}
        {!isProcessing && !isFailed && !isSuccess && (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-900 to-pink-900">
            <svg className="w-6 h-6 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
        )}
        {/* 状态标签 */}
        {isProcessing && (
          <div className="absolute top-0.5 left-0.5 px-1 py-0.5 bg-purple-500/80 rounded">
            <span className="text-white text-[8px] font-medium">Processing</span>
          </div>
        )}
        {/* 时长标签 */}
        {isSuccess && cover.duration && (
          <div className="absolute bottom-0.5 right-0.5 px-1 py-0.5 bg-black/60 rounded">
            <span className="text-white text-[9px]">{formatTime(cover.duration)}</span>
          </div>
        )}
      </div>

      {/* 文字内容 */}
      <div className="flex-1 text-left min-w-0">
        <h4 className="text-white font-medium text-base truncate">{displayTitle}</h4>
        <p className="text-gray-500 text-sm truncate">AI Cover</p>
      </div>
    </button>
  );
}

/**
 * My Creations 区域
 * 显示用户创建的内容，支持 Tab 切换和下拉刷新
 */
export default function MyCreations() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useFirebaseAuth();

  // 从 URL 参数获取初始 tab
  const tabFromUrl = searchParams.get('tab') as TabType | null;
  const initialTab = tabFromUrl && ['music', 'cover', 'voices'].includes(tabFromUrl)
    ? tabFromUrl
    : 'music';

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [musicRecords, setMusicRecords] = useState<MusicRecord[]>([]);
  const [voiceRecords, setVoiceRecords] = useState<TtsRecord[]>([]);
  const [coverRecords, setCoverRecords] = useState<CoverRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<MusicRecord | null>(null);
  const [selectedCover, setSelectedCover] = useState<CoverRecord | null>(null);

  // 下拉刷新相关
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);
  const PULL_THRESHOLD = 60;

  // 获取视频列表 (预留，暂未使用)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fetchVideos = useCallback(async (isRefresh = false) => {
    if (!token) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch('/api/v1/native/video/list', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos || []);
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  // 获取音乐列表
  const fetchMusic = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const records = await getMusicRecords(50);
      setMusicRecords(records);
    } catch (error) {
      console.error('Failed to fetch music records:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // 获取语音列表
  const fetchVoices = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const records = await getTtsRecords(50);
      setVoiceRecords(records);
    } catch (error) {
      console.error('Failed to fetch voice records:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // 获取 Cover 列表
  const fetchCovers = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const records = await getCoverRecords(50);
      setCoverRecords(records);
    } catch (error) {
      console.error('Failed to fetch cover records:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // 同步 URL 参数到 activeTab
  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabType | null;
    if (tabParam && ['videos', 'music', 'cover', 'images'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // 初始加载
  useEffect(() => {
    if (activeTab === 'music') {
      fetchMusic();
    } else if (activeTab === 'voices') {
      fetchVoices();
    } else if (activeTab === 'cover') {
      fetchCovers();
    }
  }, [activeTab, fetchMusic, fetchVoices, fetchCovers]);

  // 如果有正在处理的音乐，定时刷新（开发环境直接查询 KIE API）
  useEffect(() => {
    const processingRecords = musicRecords.filter(
      (m) => m.status === 'PENDING' || m.status === 'PROCESSING'
    );

    if (processingRecords.length === 0 || activeTab !== 'music') return;

    const interval = setInterval(async () => {
      // 开发环境下，为每个处理中的任务调用 getMusicTaskStatus
      // 这会触发 KIE API 直接查询并更新数据库
      const isDev = process.env.NODE_ENV === 'development';

      if (isDev) {
        console.log('🎵 [MyCreations] 开发环境，查询处理中的音乐状态...');

        // 并行查询所有处理中的任务状态
        const statusResults = await Promise.all(
          processingRecords.map(async (record) => {
            try {
              const status = await getMusicTaskStatus(record.task_id);
              return { task_id: record.task_id, status };
            } catch (error) {
              console.error(`查询任务状态失败: ${record.task_id}`, error);
              return null;
            }
          })
        );

        // 更新本地状态
        setMusicRecords((prev) =>
          prev.map((record) => {
            const result = statusResults.find((r) => r?.task_id === record.task_id);
            if (result && result.status) {
              return {
                ...record,
                status: result.status.status,
                progress: result.status.progress,
                audio_url: result.status.result?.audio_url || record.audio_url,
                audio_url_2: result.status.result?.audio_url_2 || record.audio_url_2,
                cover_url: result.status.result?.cover_url || record.cover_url,
                cover_url_2: result.status.result?.cover_url_2 || record.cover_url_2,
                duration: result.status.result?.duration || record.duration,
                duration_2: result.status.result?.duration_2 || record.duration_2,
                title: result.status.result?.title || record.title,
                tags: result.status.result?.tags || record.tags,
                lyrics: result.status.result?.lyrics || record.lyrics,
              };
            }
            return record;
          })
        );
      } else {
        // 生产环境使用原有的重新获取列表方式
        await fetchMusic();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [musicRecords, activeTab, fetchMusic]);

  // 下拉刷新触摸事件
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || scrollRef.current?.scrollTop !== 0) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, (currentY - startY.current) * 0.5);
    setPullDistance(Math.min(distance, PULL_THRESHOLD * 1.5));
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= PULL_THRESHOLD && !refreshing) {
      if (activeTab === 'music') {
        await fetchMusic(true);
      } else if (activeTab === 'voices') {
        await fetchVoices(true);
      } else if (activeTab === 'cover') {
        await fetchCovers(true);
      }
    }
    setPullDistance(0);
    setIsPulling(false);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleVideoClick = (video: VideoItem) => {
    router.push(`/native/video/task/${video.taskId}`);
  };

  const handleMusicClick = (music: MusicRecord) => {
    // 只有完成的音乐才能打开详情
    if (music.status === 'SUCCESS') {
      setSelectedMusic(music);
    }
  };

  const handleMusicRecreate = (music: MusicRecord) => {
    // 跳转到创建页面，带上 prompt 参数
    const params = new URLSearchParams();
    if (music.prompt) params.set('prompt', music.prompt);
    if (music.style) params.set('style', music.style);
    if (music.model) params.set('model', music.model);
    router.push(`/native/create/music?${params.toString()}`);
    setSelectedMusic(null);
  };

  const handleMusicDelete = async (music: MusicRecord) => {
    await deleteMusicRecord(music.id);
    setMusicRecords((prev) => prev.filter((m) => m.id !== music.id));
  };

  const handleCoverClick = (cover: CoverRecord) => {
    // 只有完成的 cover 才能打开详情
    if (cover.status === 'SUCCESS') {
      setSelectedCover(cover);
    }
  };

  const handleCoverRecreate = () => {
    // 跳转到创建页面
    router.push('/native/create/cover');
    setSelectedCover(null);
  };

  const handleCoverDelete = async (cover: CoverRecord) => {
    await deleteCoverRecord(cover.id);
    setCoverRecords((prev) => prev.filter((c) => c.id !== cover.id));
  };

  // 过滤掉失败的记录
  const filteredMusicRecords = musicRecords.filter((m) => m.status !== 'FAILURE');
  const filteredVoiceRecords = voiceRecords.filter((v) => v.status !== 'FAILURE');
  const filteredCoverRecords = coverRecords.filter((c) => c.status !== 'FAILURE');

  const emptyState = emptyStateMessages[activeTab];
  const isEmpty = activeTab === 'music'
    ? filteredMusicRecords.length === 0
    : activeTab === 'voices'
    ? filteredVoiceRecords.length === 0
    : activeTab === 'cover'
    ? filteredCoverRecords.length === 0
    : true;

  // 按日期分组
  const groupedMusicRecords = filteredMusicRecords.reduce((groups, music) => {
    const date = formatDateLong(music.created_at.toString());
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(music);
    return groups;
  }, {} as Record<string, MusicRecord[]>);

  const groupedVoiceRecords = filteredVoiceRecords.reduce((groups, voice) => {
    const date = formatDateLong(voice.created_at.toString());
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(voice);
    return groups;
  }, {} as Record<string, TtsRecord[]>);

  const groupedCoverRecords = filteredCoverRecords.reduce((groups, cover) => {
    const date = formatDateLong(cover.created_at.toString());
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(cover);
    return groups;
  }, {} as Record<string, CoverRecord[]>);

  return (
    <div className="h-full flex flex-col">
      {/* 固定的标题和 Tabs */}
      <div className="flex-shrink-0 px-4 pt-4 bg-[#0a0a1a]">
        {/* 标题 */}
        <h2 className="text-xl font-bold text-white mb-3">My Creations</h2>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 可滚动的内容区域 */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 pb-24"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ paddingTop: pullDistance > 0 ? pullDistance : 16 }}
      >
        {/* 下拉刷新指示器 */}
        {(pullDistance > 0 || refreshing) && (
          <div className="flex justify-center py-2 -mt-2 mb-2">
            {refreshing ? (
              <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <div className={`text-gray-400 text-xs transition-opacity ${pullDistance >= PULL_THRESHOLD ? 'opacity-100' : 'opacity-50'}`}>
                {pullDistance >= PULL_THRESHOLD ? 'Release to refresh' : 'Pull to refresh'}
              </div>
            )}
          </div>
        )}

        {/* 内容区域 */}
        {activeTab === 'music' ? (
          loading && musicRecords.length === 0 ? (
            // 加载中
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : isEmpty ? (
            // 空状态
            <div className="flex flex-col items-center justify-center py-8">
              <EmptyIllustration />
              <p className="mt-3 text-gray-400 text-center">{emptyState.title}</p>
              <p className="text-gray-500 text-sm text-center">{emptyState.subtitle}</p>
              <Link
                href={emptyState.createLink}
                className="mt-4 px-8 py-3 bg-white/10 border border-white/20 rounded-full text-white font-medium hover:bg-white/20 transition-colors"
              >
                Go create
              </Link>
            </div>
          ) : (
            // 音乐列表 - 按日期分组
            <div className="space-y-4">
              {Object.entries(groupedMusicRecords).map(([date, records]) => (
                <div key={date}>
                  <h3 className="text-gray-500 text-sm mb-2">{date}</h3>
                  <div className="space-y-1">
                    {records.map((music) => (
                      <MusicCard
                        key={music.task_id}
                        music={music}
                        onClick={() => handleMusicClick(music)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : activeTab === 'voices' ? (
          loading && voiceRecords.length === 0 ? (
            // 加载中
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : isEmpty ? (
            // 空状态
            <div className="flex flex-col items-center justify-center py-8">
              <EmptyIllustration />
              <p className="mt-3 text-gray-400 text-center">{emptyState.title}</p>
              <p className="text-gray-500 text-sm text-center">{emptyState.subtitle}</p>
              <Link
                href={emptyState.createLink}
                className="mt-4 px-8 py-3 bg-white/10 border border-white/20 rounded-full text-white font-medium hover:bg-white/20 transition-colors"
              >
                Go create
              </Link>
            </div>
          ) : (
            // 语音列表 - 按日期分组
            <div className="space-y-4">
              {Object.entries(groupedVoiceRecords).map(([date, records]) => (
                <div key={date}>
                  <h3 className="text-gray-500 text-sm mb-2">{date}</h3>
                  <div className="space-y-1">
                    {records.map((voice) => (
                      <VoiceCard
                        key={voice.task_id}
                        voice={voice}
                        onClick={() => {
                          // 跳转到语音详情页
                          router.push(`/native/voice/task/${voice.task_id}`);
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : activeTab === 'cover' ? (
          loading && coverRecords.length === 0 ? (
            // 加载中
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : isEmpty ? (
            // 空状态
            <div className="flex flex-col items-center justify-center py-8">
              <EmptyIllustration />
              <p className="mt-3 text-gray-400 text-center">{emptyState.title}</p>
              <p className="text-gray-500 text-sm text-center">{emptyState.subtitle}</p>
              <Link
                href={emptyState.createLink}
                className="mt-4 px-8 py-3 bg-white/10 border border-white/20 rounded-full text-white font-medium hover:bg-white/20 transition-colors"
              >
                Go create
              </Link>
            </div>
          ) : (
            // Cover 列表 - 按日期分组
            <div className="space-y-4">
              {Object.entries(groupedCoverRecords).map(([date, records]) => (
                <div key={date}>
                  <h3 className="text-gray-500 text-sm mb-2">{date}</h3>
                  <div className="space-y-1">
                    {records.map((cover) => (
                      <CoverCard
                        key={cover.task_id}
                        cover={cover}
                        onClick={() => handleCoverClick(cover)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : isEmpty ? (
          // 其他 tab 的空状态
          <div className="flex flex-col items-center justify-center py-8">
            <EmptyIllustration />
            <p className="mt-3 text-gray-400 text-center">{emptyState.title}</p>
            <p className="text-gray-500 text-sm text-center">{emptyState.subtitle}</p>
            <Link
              href={emptyState.createLink}
              className="mt-4 px-8 py-3 bg-white/10 border border-white/20 rounded-full text-white font-medium hover:bg-white/20 transition-colors"
            >
              Go create
            </Link>
          </div>
        ) : null}
      </div>

      {/* 音乐详情弹窗 */}
      {selectedMusic && (
        <MusicDetailModal
          music={selectedMusic}
          onClose={() => setSelectedMusic(null)}
          onRecreate={handleMusicRecreate}
          onDelete={handleMusicDelete}
        />
      )}

      {/* Cover 详情弹窗 */}
      {selectedCover && (
        <CoverDetailModal
          cover={selectedCover}
          onClose={() => setSelectedCover(null)}
          onRecreate={handleCoverRecreate}
          onDelete={handleCoverDelete}
        />
      )}
    </div>
  );
}
