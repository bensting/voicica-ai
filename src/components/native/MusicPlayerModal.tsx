'use client';

import { useState, useRef } from 'react';

/**
 * 音乐播放数据接口
 */
export interface MusicPlayerData {
  title: string | null;
  cover_url: string | null;
  audio_url: string | null;
  duration: number | null;
  lyrics?: string | null;
  prompt?: string | null;
  model?: string | null;
  tags?: string | null;
}

interface MusicPlayerModalProps {
  music: MusicPlayerData;
  onClose: () => void;
  /** 是否显示完整操作（下载+重新创建），默认 false */
  showFullActions?: boolean;
  /** 是否只显示 Recreate 按钮（用于公开音乐） */
  showRecreateOnly?: boolean;
  /** 重新创建回调 */
  onRecreate?: () => void;
  /** 删除回调 */
  onDelete?: () => void;
}

// 格式化时间 (秒 -> mm:ss)
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 获取模型显示名称
function getModelDisplayName(model: string | null | undefined): string {
  if (!model) return '';
  const modelMap: Record<string, string> = {
    'music-5.0': 'v5.0',
    'music-4.5-plus': 'v4.5+',
    'music-4.5': 'v4.5',
  };
  return modelMap[model] || model;
}

/**
 * 音乐播放器弹窗组件
 * 可复用于 MyCreations 和 Explore
 */
export default function MusicPlayerModal({
  music,
  onClose,
  showFullActions = false,
  showRecreateOnly = false,
  onRecreate,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onDelete,
}: MusicPlayerModalProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(music.duration || 0);

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
      <div className="flex-shrink-0 px-6 pt-4 pb-8 bg-[#0a0a1a] border-t border-gray-800/50">
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

        {/* Prompt 显示 */}
        {music.prompt && (
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-500 text-sm flex-1 truncate">
              {music.prompt}
            </p>
            {/* 复制按钮 */}
            <button
              onClick={() => navigator.clipboard.writeText(music.prompt || '')}
              className="ml-2 p-2 text-gray-500 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            </button>
          </div>
        )}

        {/* 模型版本标签 */}
        {music.model && (
          <div className="mb-4">
            <span className="inline-block px-3 py-1 bg-gray-800 rounded-full text-gray-400 text-xs">
              {getModelDisplayName(music.model)}
            </span>
          </div>
        )}

        {/* 操作按钮 - Recreate Only 模式（公开音乐） */}
        {showRecreateOnly && onRecreate && (
          <button
            onClick={onRecreate}
            className="w-full flex items-center justify-center gap-1.5 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Recreate
          </button>
        )}

        {/* 操作按钮 - 完整模式（用户自己的音乐） */}
        {showFullActions && (
          <div className="flex gap-3">
            {onRecreate && (
              <button
                onClick={onRecreate}
                className="flex-[1] flex items-center justify-center gap-1.5 py-3 bg-gray-800/80 border border-gray-700 rounded-xl text-white text-sm font-medium hover:bg-gray-700 transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Recreate
              </button>
            )}
            <button
              onClick={handleDownload}
              disabled={!music.audio_url}
              className="flex-[2] flex items-center justify-center gap-1.5 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              Download
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
