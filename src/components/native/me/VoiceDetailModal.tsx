'use client';

import { useState, useRef, useEffect } from 'react';
import type { TtsRecord } from '@/actions/tts';
import { Share } from '@capacitor/share';
import { createShareLink } from '@/actions/share';
import DetailModalHeader from './DetailModalHeader';
import DetailActionBar from './DetailActionBar';
import DeleteConfirmDialog from '@/components/native/ui/DeleteConfirmDialog';
import { useBottomNav } from '@/contexts/BottomNavContext';
import { formatTime } from './utils';
import ProviderIcon from '@/components/ui/icons/ProviderIcon';
import { User, UserRound, Users } from 'lucide-react';

interface VoiceDetailModalProps {
  voice: TtsRecord;
  onClose: () => void;
  onRecreate: () => void;
  onDelete: (voice: TtsRecord) => void;
}

export default function VoiceDetailModal({
  voice,
  onClose,
  onRecreate,
  onDelete,
}: VoiceDetailModalProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(voice.duration || 0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const { hide, show } = useBottomNav();

  // 隐藏底部导航
  useEffect(() => {
    hide();
    return () => show();
  }, [hide, show]);

  // 预先生成分享链接（用于"在浏览器打开"功能）
  useEffect(() => {
    if (voice.task_id) {
      createShareLink('tts', voice.task_id)
        .then((result) => setShareUrl(result.url))
        .catch((err) => console.error('Failed to create share link:', err));
    }
  }, [voice.task_id]);

  // 使用关联的语音信息
  const voiceInfo = voice.voice;
  const displayName = voiceInfo?.display_name || voice.voice_name || 'AI Voice';
  const displayText = voice.text || '';

  // 性别图标
  const GenderIcon = () => {
    if (!voiceInfo?.gender) return null;
    if (voiceInfo.gender === 'male') return <User className="w-4 h-4 text-blue-400" />;
    if (voiceInfo.gender === 'female') return <UserRound className="w-4 h-4 text-pink-400" />;
    return <Users className="w-4 h-4 text-gray-400" />;
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    audioRef.current.currentTime = percent * duration;
    setCurrentTime(percent * duration);
  };

  const handleConfirmDelete = async () => {
    await onDelete(voice);
    setShowDeleteDialog(false);
    onClose();
  };

  // 分享
  const handleShare = async () => {
    if (!voice.task_id) return;
    setIsSharing(true);
    try {
      const result = await createShareLink('tts', voice.task_id);

      // 检查是否支持分享
      const canShare = await Share.canShare();
      if (!canShare.value) {
        // 回退到复制链接
        await navigator.clipboard.writeText(result.url);
        return;
      }

      // 使用 Capacitor Share 插件
      await Share.share({
        title: displayName,
        text: `Check out this AI-generated voice: ${displayName}`,
        url: result.url,
        dialogTitle: 'Share Voice',
      });
    } catch (error) {
      console.error('Share failed:', error);
      // 回退到复制链接
      try {
        const result = await createShareLink('tts', voice.task_id);
        await navigator.clipboard.writeText(result.url);
      } catch (e) {
        console.error('Fallback copy failed:', e);
      }
    } finally {
      setIsSharing(false);
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0a0a1a] flex flex-col">
      {voice.audio_url && (
        <audio
          ref={audioRef}
          src={voice.audio_url}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
        />
      )}

      {/* 顶部导航 */}
      <DetailModalHeader
        onClose={onClose}
        onShare={handleShare}
        onDelete={() => setShowDeleteDialog(true)}
        isSharing={isSharing}
        shareDisabled={!voice.task_id}
        browserUrl={shareUrl || undefined}
      />

      {/* 可滚动内容区域 */}
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        {/* 头像 */}
        <div className="flex justify-center mb-4">
          <div className="relative w-32 h-32 rounded-full overflow-hidden shadow-2xl">
            {voiceInfo?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={voiceInfo.avatar_url}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-900 to-purple-900">
                <svg className="w-12 h-12 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z" />
                  <path d="M19 10v2a7 7 0 01-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* 语音名称 */}
        <h1 className="text-xl font-bold text-white text-center mb-1">{displayName}</h1>

        {/* 语音信息行：locale · gender · provider */}
        <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-4">
          {voiceInfo ? (
            <>
              <span>{voiceInfo.locale}</span>
              <span>·</span>
              <GenderIcon />
              <span>·</span>
              <ProviderIcon provider={voiceInfo.provider.toLowerCase()} className="w-4 h-4" />
            </>
          ) : (
            <span>{voice.voice_name}</span>
          )}
        </div>

        {/* 文本内容 */}
        {displayText && (
          <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap mb-6 max-h-48 overflow-y-auto bg-gray-800/50 rounded-xl p-4">
            {displayText}
          </div>
        )}
      </div>

      {/* 底部播放器和操作按钮 */}
      <div
        className="flex-shrink-0 px-6 bg-[#0a0a1a]"
        style={{ paddingBottom: 'calc(var(--safe-area-inset-bottom, 0px) + 24px)' }}
      >
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

        <div className="flex justify-between text-gray-500 text-xs mb-4">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        <div className="flex justify-center mb-4">
          <button
            onClick={togglePlay}
            disabled={!voice.audio_url}
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

        <div className="flex items-center justify-between mb-3">
          <p className="text-gray-500 text-sm flex-1 truncate">
            {voice.character_count} characters
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

        <DetailActionBar
          showRecreate
          onRecreate={onRecreate}
          fileUrl={voice.audio_url || undefined}
          fileName={`voicica_tts_${voice.task_id}.mp3`}
          fileType="audio"
        />
      </div>

      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        title="Confirm delete voice?"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </div>
  );
}
