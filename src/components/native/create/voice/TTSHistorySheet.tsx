'use client';

import { useEffect, useRef, useState } from 'react';
import type { Generation } from '@/types/tts';
import { TaskStatus } from '@/types/tts';

interface TTSHistorySheetProps {
  isOpen: boolean;
  onClose: () => void;
  generations: Generation[];
  onDelete: (id: string) => void;
  onDownload: (id: string) => Promise<void>;
}

// 关闭图标
const CloseIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

// 播放图标
const PlayIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

// 暂停图标
const PauseIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
);

// 下载图标
const DownloadIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="7,10 12,15 17,10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

// 删除图标
const TrashIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3,6 5,6 21,6" />
    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

// 格式化时长
function formatDuration(seconds: number): string {
  if (!seconds || seconds === 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// 获取状态标签和颜色
function getStatusDisplay(status: TaskStatus): { label: string; color: string } {
  switch (status) {
    case TaskStatus.PENDING:
      return { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-400' };
    case TaskStatus.PROCESSING:
      return { label: 'Processing', color: 'bg-blue-500/20 text-blue-400' };
    case TaskStatus.SUCCESS:
      return { label: 'Success', color: 'bg-green-500/20 text-green-400' };
    case TaskStatus.FAILURE:
      return { label: 'Failed', color: 'bg-red-500/20 text-red-400' };
    default:
      return { label: status, color: 'bg-gray-500/20 text-gray-400' };
  }
}

/**
 * Native TTS History Bottom Sheet
 */
export default function NativeTTSHistorySheet({
  isOpen,
  onClose,
  generations,
  onDelete,
  onDownload,
}: TTSHistorySheetProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 禁止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // 清理音频
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // 关闭时停止播放
  useEffect(() => {
    if (!isOpen && audioRef.current) {
      audioRef.current.pause();
      setPlayingId(null);
    }
  }, [isOpen]);

  const handlePlay = (generation: Generation) => {
    if (!generation.audioUrl) return;

    if (playingId === generation.id) {
      // 暂停当前播放
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    // 停止之前的播放
    if (audioRef.current) {
      audioRef.current.pause();
    }

    // 播放新音频
    const audio = new Audio(generation.audioUrl);
    audioRef.current = audio;

    audio.onended = () => {
      setPlayingId(null);
    };

    audio.onerror = () => {
      setPlayingId(null);
    };

    audio.play().then(() => {
      setPlayingId(generation.id);
    }).catch(() => {
      setPlayingId(null);
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 bg-gray-900 rounded-t-3xl animate-slide-up flex flex-col"
        style={{ height: '80vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <h2 className="text-white font-semibold text-lg">History</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-white">
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {generations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <svg className="w-16 h-16 mb-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                <path d="M19 10v2a7 7 0 01-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
              <p className="text-sm">No generations yet</p>
              <p className="text-xs mt-1">Your TTS history will appear here</p>
            </div>
          ) : (
            <div className="space-y-3 pb-6">
              {generations.map((generation) => {
                const isPlaying = playingId === generation.id;
                const status = generation.status || TaskStatus.SUCCESS;
                const statusDisplay = getStatusDisplay(status);
                const isProcessing = status === TaskStatus.PROCESSING || status === TaskStatus.PENDING;
                const isFailed = status === TaskStatus.FAILURE;
                const canPlay = status === TaskStatus.SUCCESS && !!generation.audioUrl;

                return (
                  <div
                    key={generation.id}
                    className="bg-gray-800/60 rounded-xl p-3 space-y-2"
                  >
                    {/* Top row: Voice info + Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {generation.voiceAvatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={generation.voiceAvatar}
                            alt={generation.voiceDisplayName || ''}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 text-xs">
                            {(generation.voiceDisplayName || 'V').charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="text-white text-sm font-medium">
                            {generation.voiceDisplayName || generation.voiceName || 'Unknown Voice'}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {generation.timestamp}
                          </div>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-xs ${statusDisplay.color}`}>
                        {statusDisplay.label}
                      </span>
                    </div>

                    {/* Text preview */}
                    <p className="text-gray-300 text-sm line-clamp-2">
                      {generation.text}
                    </p>

                    {/* Progress bar for processing */}
                    {isProcessing && (
                      <div className="relative h-1 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-purple-500 rounded-full transition-all duration-300"
                          style={{ width: `${generation.progress || 0}%` }}
                        />
                      </div>
                    )}

                    {/* Error message */}
                    {isFailed && generation.errorMessage && (
                      <p className="text-red-400 text-xs">
                        {generation.errorMessage}
                      </p>
                    )}

                    {/* Bottom row: Duration + Actions */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="text-gray-500 text-xs">
                        {generation.characterCount} chars
                        {generation.duration > 0 && ` · ${formatDuration(generation.duration)}`}
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Play button */}
                        {canPlay && (
                          <button
                            onClick={() => handlePlay(generation)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                              isPlaying
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            {isPlaying ? <PauseIcon /> : <PlayIcon />}
                          </button>
                        )}

                        {/* Download button */}
                        {canPlay && (
                          <button
                            onClick={() => onDownload(generation.id)}
                            className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                          >
                            <DownloadIcon />
                          </button>
                        )}

                        {/* Delete button */}
                        <button
                          onClick={() => onDelete(generation.id)}
                          className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-700 text-gray-300 hover:bg-red-600 hover:text-white transition-colors"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
