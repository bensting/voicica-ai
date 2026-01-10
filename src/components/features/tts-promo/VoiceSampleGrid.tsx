'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Play, Pause, Loader2 } from 'lucide-react';
import { getVoiceSampleUrl } from '@/types/voice';
import type { Voice } from '@/types/voice';

interface VoiceSampleGridProps {
  voices: Voice[];
  loading: boolean;
  emptyText?: string;
}

/**
 * Voice Sample Grid - 用于 TTS 落地页的语音样本展示
 *
 * 特点：
 * - 圆形头像 + 播放控制
 * - 移动端 4 列，桌面端 12+10 布局
 * - 内置音频播放状态管理
 */
export default function VoiceSampleGrid({
  voices,
  loading,
  emptyText = 'No voices available',
}: VoiceSampleGridProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Handle voice sample play/pause
  const handlePlayVoice = (voice: Voice) => {
    if (playingId === voice.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      setLoadingId(null);
    } else if (loadingId === voice.id) {
      return;
    } else {
      audioRef.current?.pause();
      setPlayingId(null);

      const sampleUrl = getVoiceSampleUrl(voice);
      if (sampleUrl) {
        setLoadingId(voice.id);
        const audio = new Audio(sampleUrl);

        audio.oncanplaythrough = () => {
          setLoadingId(null);
          setPlayingId(voice.id);
          audio.play().catch(() => {
            setPlayingId(null);
            setLoadingId(null);
          });
        };

        audio.onended = () => {
          setPlayingId(null);
          setLoadingId(null);
        };

        audio.onerror = () => {
          setPlayingId(null);
          setLoadingId(null);
        };

        audio.load();
        audioRef.current = audio;
      }
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  // Stop audio when voices change (language/role filter change)
  useEffect(() => {
    audioRef.current?.pause();
    setPlayingId(null);
    setLoadingId(null);
  }, [voices]);

  // Loading skeleton
  if (loading) {
    return (
      <>
        {/* Mobile: 4 columns */}
        <div className="grid grid-cols-4 gap-3 md:hidden">
          {[...Array(22)].map((_, i) => (
            <div key={i} className="aspect-square rounded-full bg-gray-800 animate-pulse" />
          ))}
        </div>
        {/* Desktop: 12 + 10 layout */}
        <div className="hidden md:block">
          <div className="flex justify-center gap-4 mb-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="w-16 h-16 lg:w-20 lg:h-20 flex-shrink-0 rounded-full bg-gray-800 animate-pulse" />
            ))}
          </div>
          <div className="flex justify-center gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="w-16 h-16 lg:w-20 lg:h-20 flex-shrink-0 rounded-full bg-gray-800 animate-pulse" />
            ))}
          </div>
        </div>
      </>
    );
  }

  // Empty state
  if (voices.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">{emptyText}</p>
      </div>
    );
  }

  // Voice item component
  const VoiceItem = ({ voice, size = 'desktop' }: { voice: Voice; size?: 'mobile' | 'desktop' }) => {
    const isPlaying = playingId === voice.id;
    const isLoading = loadingId === voice.id;

    return (
      <div className="flex flex-col items-center gap-1 md:gap-2 flex-shrink-0">
        <button
          onClick={() => handlePlayVoice(voice)}
          className={`group relative overflow-hidden transition-transform hover:scale-105 md:hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
            size === 'mobile'
              ? 'aspect-square w-full rounded-full'
              : 'w-16 h-16 lg:w-20 lg:h-20 rounded-full'
          }`}
        >
          {voice.avatar_url ? (
            <Image
              src={voice.avatar_url}
              alt={voice.display_name}
              fill
              className="object-cover"
              sizes={size === 'mobile' ? '25vw' : '80px'}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400" />
          )}
          {/* Always visible play icon overlay */}
          <div className={`absolute inset-0 flex items-center justify-center transition-all ${
            isPlaying || isLoading ? 'bg-black/50' : 'group-hover:bg-black/30'
          }`}>
            {isLoading ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-6 h-6 text-white" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center group-hover:bg-purple-600 transition-colors shadow-lg">
                <Play className="w-4 h-4 text-white ml-0.5" />
              </div>
            )}
          </div>
          {isPlaying && (
            <div className="absolute inset-0 border-3 border-purple-500 rounded-full animate-pulse" />
          )}
        </button>
        <span className={`text-gray-400 text-center truncate ${
          size === 'mobile'
            ? 'text-[10px] w-full px-1'
            : 'text-xs w-16 lg:w-20'
        }`}>
          {voice.display_name}
        </span>
      </div>
    );
  };

  return (
    <>
      {/* Mobile: 4 columns grid */}
      <div className="grid grid-cols-4 gap-3 md:hidden">
        {voices.map((voice) => (
          <VoiceItem key={voice.id} voice={voice} size="mobile" />
        ))}
      </div>

      {/* Desktop: First row 12, second row 10 */}
      <div className="hidden md:block">
        {/* First row: 12 voices */}
        <div className="flex justify-center gap-4 mb-6">
          {voices.slice(0, 12).map((voice) => (
            <VoiceItem key={voice.id} voice={voice} size="desktop" />
          ))}
        </div>
        {/* Second row: remaining voices (up to 10) */}
        {voices.length > 12 && (
          <div className="flex justify-center gap-4">
            {voices.slice(12, 22).map((voice) => (
              <VoiceItem key={voice.id} voice={voice} size="desktop" />
            ))}
          </div>
        )}
      </div>
    </>
  );
}