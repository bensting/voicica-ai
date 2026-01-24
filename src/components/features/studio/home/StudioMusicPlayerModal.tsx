'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, Download, Copy, Check, Share2 } from 'lucide-react';
import { createShareLink } from '@/actions/share';

/**
 * Studio 音乐播放数据接口
 */
export interface StudioMusicPlayerData {
  title: string | null;
  cover_url: string | null;
  audio_url: string | null;
  duration: number | null;
  lyrics?: string | null;
  prompt?: string | null;
  model?: string | null;
  tags?: string | null;
}

interface StudioMusicPlayerModalProps {
  music: StudioMusicPlayerData;
  onClose: () => void;
  /** 音乐记录的 task_id（用于分享） */
  taskId?: string;
  /** 是否显示完整操作（下载+重新创建），默认 false */
  showFullActions?: boolean;
  /** 是否只显示 Recreate 按钮（用于公开音乐） */
  showRecreateOnly?: boolean;
  /** 重新创建回调 */
  onRecreate?: () => void;
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
 * Studio 音乐播放器弹窗组件
 * 专门为 Studio Web 版设计，采用浅色主题
 */
export default function StudioMusicPlayerModal({
  music,
  onClose,
  taskId,
  showFullActions = false,
  showRecreateOnly = false,
  onRecreate,
}: StudioMusicPlayerModalProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(music.duration || 0);
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const displayTitle = music.title || 'AI Music';
  const displayLyrics = music.lyrics || music.prompt || '';

  // 按 ESC 键关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
  const handleDownload = () => {
    if (!music.audio_url) return;
    window.open(music.audio_url, '_blank');
  };

  // 复制 prompt
  const handleCopyPrompt = async () => {
    if (!music.prompt) return;
    try {
      await navigator.clipboard.writeText(music.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  // 分享
  const handleShare = async () => {
    if (!taskId) return;
    setIsSharing(true);
    try {
      const result = await createShareLink('music', taskId);

      // Web 端使用 navigator.share
      if (navigator.share) {
        await navigator.share({
          title: displayTitle,
          text: `Check out this AI-generated music: ${displayTitle}`,
          url: result.url,
        });
      } else {
        // 回退到复制链接并打开新窗口
        await navigator.clipboard.writeText(result.url);
        window.open(result.url, '_blank');
      }
    } catch (error) {
      console.error('Share failed:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
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

      {/* 弹窗内容 */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* 顶部按钮 */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          {/* 分享按钮 */}
          {taskId && (
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {isSharing ? (
                <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Share2 className="w-4 h-4 text-gray-600" />
              )}
            </button>
          )}
          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* 封面区域 */}
        <div className="relative aspect-video bg-gradient-to-br from-pink-500 to-rose-500">
          {music.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={music.cover_url}
              alt={displayTitle}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-20 h-20 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </div>
          )}
          {/* AI 标签 */}
          <div className="absolute top-4 left-4 px-2 py-0.5 bg-pink-500 rounded text-white text-xs font-medium">
            AI
          </div>

          {/* 播放按钮覆盖层 */}
          <button
            onClick={togglePlay}
            disabled={!music.audio_url}
            className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors disabled:cursor-not-allowed"
          >
            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              {isPlaying ? (
                <Pause className="w-8 h-8 text-pink-600" fill="currentColor" />
              ) : (
                <Play className="w-8 h-8 text-pink-600 ml-1" fill="currentColor" />
              )}
            </div>
          </button>
        </div>

        {/* 内容区域 */}
        <div className="p-6">
          {/* 标题 */}
          <h2 className="text-xl font-bold text-gray-900 mb-2">{displayTitle}</h2>

          {/* 进度条 */}
          <div
            className="w-full h-1.5 bg-gray-200 rounded-full cursor-pointer mb-2"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full relative transition-all"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-pink-500 rounded-full shadow" />
            </div>
          </div>

          {/* 时间显示 */}
          <div className="flex justify-between text-gray-400 text-xs mb-4">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          {/* 歌词/Prompt */}
          {displayLyrics && (
            <div className="mb-4 max-h-32 overflow-y-auto">
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                {displayLyrics}
              </p>
            </div>
          )}

          {/* Prompt 复制区域 */}
          {music.prompt && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-sm flex-1 truncate">
                {music.prompt}
              </p>
              <button
                onClick={handleCopyPrompt}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Copy prompt"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          )}

          {/* 模型版本标签 */}
          {music.model && (
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-gray-100 rounded-full text-gray-500 text-xs">
                {getModelDisplayName(music.model)}
              </span>
            </div>
          )}

          {/* 操作按钮 - Recreate Only 模式（公开音乐） */}
          {showRecreateOnly && onRecreate && (
            <button
              onClick={onRecreate}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity"
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
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
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
                className="flex-[2] flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
