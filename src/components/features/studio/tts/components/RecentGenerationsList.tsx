'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Download, Trash2, Play, Pause, ChevronRight } from 'lucide-react';
import type { Generation } from '@/types/tts';
import { TaskStatus } from '@/types/tts';
import { useLanguage } from '@/contexts/LanguageContext';

interface RecentGenerationsListProps {
  generations: Generation[];
  loading: boolean;
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
  // Deprecated: no longer needed, processing state is in generations list
  isGenerating?: boolean;
  generatingText?: string;
  taskProgress?: number;
}

/**
 * Simplified Recent Generations List for TTS Page
 * Shows last 6 generations in a compact format
 */
export default function RecentGenerationsList({
  generations,
  loading,
  onDelete,
  onDownload,
}: RecentGenerationsListProps) {
  const { t } = useLanguage();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Track playback progress
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      if (audio.duration > 0) {
        setPlaybackProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleEnded = () => {
      setPlayingId(null);
      setPlaybackProgress(0);
      audioRef.current = null;
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [playingId]);

  const handlePlay = (id: string, audioUrl: string) => {
    // 如果点击的是当前正在播放的音频
    if (playingId === id && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlayingId(null);
      setPlaybackProgress(0);
      return;
    }

    // 停止当前播放的音频（如果有）
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // 播放新的音频
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setPlayingId(id);
    setPlaybackProgress(0);

    audio.play().catch((error) => {
      console.error('Failed to play audio:', error);
      setPlayingId(null);
      setPlaybackProgress(0);
      audioRef.current = null;
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 flex-shrink-0">
        <h3 className="text-base font-semibold text-gray-900">{t('studio.recentAuditions')}</h3>
        <Link
          href="/studio/generation-history"
          className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 transition-colors"
        >
          {t('studio.allRecords')}
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 bg-gray-50">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {/* Empty state */}
            {generations.length === 0 && (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                </div>
                <h3 className="text-base font-medium text-gray-900 mb-1">无语音记录</h3>
                <p className="text-sm text-gray-500">暂无语音记录</p>
              </div>
            )}

            {generations.map((gen) => {
              const isProcessing = gen.status === TaskStatus.PROCESSING || gen.status === TaskStatus.PENDING;
              const progress = gen.progress || 0;

              return (
                <div
                  key={gen.id}
                  className={`flex items-center gap-3 p-3 rounded-lg hover:shadow-sm transition-all ${
                    isProcessing
                      ? 'bg-purple-50 border-2 border-purple-200'
                      : 'bg-white border border-gray-200 hover:border-purple-300'
                  }`}
                >
                  {/* Play/Pause Button or Spinning Icon */}
                  <button
                    onClick={() => !isProcessing && handlePlay(gen.id, gen.audioUrl || '')}
                    className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors flex-shrink-0 ${
                      isProcessing
                        ? 'bg-purple-100 cursor-not-allowed'
                        : playingId === gen.id
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                    }`}
                    disabled={isProcessing || !gen.audioUrl}
                  >
                    {isProcessing ? (
                      <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                    ) : playingId === gen.id ? (
                      <Pause className="w-4 h-4" fill="currentColor" />
                    ) : (
                      <Play className="w-4 h-4" fill="currentColor" />
                    )}
                  </button>

                  {/* Text Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{gen.text}</p>
                  </div>

                  {/* Voice Info */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {gen.voiceAvatar ? (
                      <Image
                        src={gen.voiceAvatar}
                        alt={gen.voiceName || ''}
                        width={24}
                        height={24}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-xs text-purple-600">🎤</span>
                      </div>
                    )}
                    <span className="text-xs text-gray-600">{gen.voiceDisplayName || gen.voiceName}</span>
                  </div>

                  {/* Duration or Progress */}
                  <div className="text-xs flex-shrink-0 min-w-[3.5rem] text-right">
                    {isProcessing ? (
                      <span className="text-purple-600 font-medium">{progress}%</span>
                    ) : gen.duration ? (
                      <span className="text-gray-500">{gen.duration}s</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="w-32 h-1 bg-gray-200 rounded-full flex-shrink-0 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isProcessing ? 'bg-purple-600 duration-500' : 'bg-purple-400 duration-100'
                      }`}
                      style={{
                        width: isProcessing
                          ? `${progress}%`
                          : playingId === gen.id
                            ? `${playbackProgress}%`
                            : '0%'
                      }}
                    />
                  </div>

                  {/* Download Button */}
                  <button
                    onClick={() => onDownload(gen.id)}
                    className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex-shrink-0"
                    title="Download"
                    disabled={isProcessing || !gen.audioUrl}
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(gen.id);
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}