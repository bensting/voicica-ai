'use client';

import { useState, useRef, useEffect } from 'react';
import { Download, Pencil } from 'lucide-react';
import type { TtsRecord } from '@/actions/tts';
import GradientButton from '@/components/ui/GradientButton';
import DeleteConfirmDialog from '@/components/native/ui/DeleteConfirmDialog';
import { useBottomNav } from '@/contexts/BottomNavContext';
import { formatTime } from './utils';

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
  const { hide, show } = useBottomNav();

  // 隐藏底部导航
  useEffect(() => {
    hide();
    return () => show();
  }, [hide, show]);

  const displayTitle = voice.voice_name || 'AI Voice';
  const displayText = voice.text || '';

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

  const handleDownload = () => {
    if (!voice.audio_url) return;
    window.open(voice.audio_url, '_blank');
  };

  const handleConfirmDelete = async () => {
    await onDelete(voice);
    setShowDeleteDialog(false);
    onClose();
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
      <div
        className="flex items-center justify-between px-4 pb-2"
        style={{ paddingTop: 'calc(var(--safe-area-inset-top, 0px) + 12px)' }}
      >
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
        {/* 图标 */}
        <div className="flex justify-center mb-4">
          <div className="relative w-48 h-48 rounded-xl overflow-hidden shadow-2xl">
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-900 to-purple-900">
              <svg className="w-16 h-16 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z" />
                <path d="M19 10v2a7 7 0 01-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
            </div>
            {/* AI 标签 */}
            <div className="absolute top-2 right-2 px-2 py-0.5 bg-cyan-500 rounded text-white text-xs font-medium">
              TTS
            </div>
          </div>
        </div>

        {/* 标题 */}
        <h1 className="text-2xl font-bold text-white text-center mb-4">{displayTitle}</h1>

        {/* 文本内容 */}
        {displayText && (
          <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap mb-6 max-h-48 overflow-y-auto">
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

        <div className="flex gap-3">
          <button
            onClick={onRecreate}
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
            disabled={!voice.audio_url}
            className="flex-[2] !py-3"
          >
            Download
          </GradientButton>
        </div>
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
