'use client';

import { useState, useRef, useEffect } from 'react';
import { useBottomNav } from '@/contexts/BottomNavContext';
import { Share } from '@capacitor/share';
import { createShareLink } from '@/actions/share';
import PlayerModalHeader from './PlayerModalHeader';
import ProviderIcon from '@/components/ui/icons/ProviderIcon';
import { getCountryFlag } from '@/utils/countryFlags';
import { User, UserRound } from 'lucide-react';

/**
 * Voice 详情接口
 */
export interface VoiceDetails {
  displayName: string | null;
  avatarUrl: string;
  gender: string;
  provider: string;
  locale: string;
  country: string;
}

/**
 * 公开语音数据接口（用于 Explore 展示）
 */
export interface PublicVoiceData {
  id: number;
  taskId: string;
  text: string;
  voiceName: string;
  language: string | null;
  duration: number | null;
  audioUrl: string | null;
  user: string;
  createdAt: string;
  voice: VoiceDetails | null;
}

interface VoicePlayerModalProps {
  voice: PublicVoiceData;
  onClose: () => void;
  /** 重新创建回调 */
  onRecreate?: () => void;
}

// 格式化时间 (秒 -> mm:ss)
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 语音播放器弹窗组件
 * 用于 Explore 页面展示公开的 TTS 语音
 */
export default function VoicePlayerModal({
  voice,
  onClose,
  onRecreate,
}: VoicePlayerModalProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(voice.duration || 0);
  const [isSharing, setIsSharing] = useState(false);
  const { hideAll, showAll } = useBottomNav();

  // 隐藏顶部和底部导航栏
  useEffect(() => {
    hideAll();
    return () => showAll();
  }, [hideAll, showAll]);

  // 截取前50个字符作为显示标题
  const displayTitle = voice.text.length > 50
    ? voice.text.substring(0, 50) + '...'
    : voice.text;

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

  // 分享
  const handleShare = async () => {
    setIsSharing(true);
    try {
      const result = await createShareLink('tts', voice.taskId);

      // 使用 Capacitor Share 插件
      await Share.share({
        title: 'AI Voice',
        text: `Check out this AI-generated voice: ${displayTitle}`,
        url: result.url,
        dialogTitle: 'Share Voice',
      });
    } catch (error) {
      console.error('Share failed:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0a0a1a] flex flex-col">
      {/* 隐藏的音频元素 */}
      {voice.audioUrl && (
        <audio
          ref={audioRef}
          src={voice.audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
        />
      )}

      {/* 顶部导航 */}
      <PlayerModalHeader
        onClose={onClose}
        onShare={handleShare}
        isSharing={isSharing}
        contentType="tts"
        contentId={voice.taskId}
      />

      {/* 可滚动内容区域 */}
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        {/* 头像 */}
        <div className="flex justify-center mb-6">
          <div className="relative w-32 h-32 rounded-full overflow-hidden shadow-2xl">
            {voice.voice?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={voice.voice.avatarUrl}
                alt={voice.voice.displayName || voice.voiceName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-cyan-600 to-purple-600 flex items-center justify-center">
                <svg className="w-12 h-12 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* 语音名称 */}
        <div className="text-center mb-1">
          <h2 className="text-xl font-semibold text-white">
            {voice.voice?.displayName || voice.voiceName}
          </h2>
        </div>

        {/* 图标行：国家 · 性别 · 供应商 */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {voice.voice?.country && (
            <span className="text-base">{getCountryFlag(voice.voice.country)}</span>
          )}
          {voice.voice?.gender && (
            voice.voice.gender === 'male' ? (
              <User className="w-4 h-4 text-blue-400" />
            ) : voice.voice.gender === 'female' ? (
              <UserRound className="w-4 h-4 text-pink-400" />
            ) : null
          )}
          {voice.voice?.provider && (
            <ProviderIcon provider={voice.voice.provider.toLowerCase()} className="w-4 h-4" />
          )}
        </div>

        {/* 文本内容 */}
        <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
            {voice.text}
          </p>
        </div>

        {/* 创建者信息 */}
        <div className="text-center text-gray-500 text-xs">
          Created by {voice.user}
        </div>
      </div>

      {/* 底部播放器和操作按钮 - 固定在底部 */}
      <div
        className="flex-shrink-0 px-6 pt-4 bg-[#0a0a1a] border-t border-gray-800/50"
        style={{ paddingBottom: 'calc(var(--safe-area-inset-bottom, 0px) + 24px)' }}
      >
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
            disabled={!voice.audioUrl}
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

        {/* Recreate 按钮 */}
        {onRecreate && (
          <button
            onClick={onRecreate}
            className="w-full flex items-center justify-center gap-1.5 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Recreate
          </button>
        )}
      </div>
    </div>
  );
}
