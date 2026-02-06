'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { HOME_SHOWCASE_CONFIG } from '@/config/homeShowcase';

interface AudioCardProps {
  title: string;
  subtitle: string;
  audioUrl: string;
  coverImage?: string;
  showWaveform?: boolean;
}

// Waveform bar heights (deterministic to avoid hydration issues)
const WAVEFORM_HEIGHTS = [
  4, 6, 8, 5, 10, 7, 4, 9, 6, 8, 12, 6, 9, 5, 7, 11, 5, 8, 6, 10,
  5, 7, 9, 6, 11, 8, 5, 10, 7, 9, 13, 7, 10, 6, 8, 12, 6, 9, 7, 11,
];

// Waveform background component
function WaveformBackground() {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900">
      {/* Waveform SVG */}
      <svg
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-24"
        viewBox="0 0 120 30"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        {/* Waveform bars */}
        {WAVEFORM_HEIGHTS.map((height, i) => {
          const x = i * 3;
          return (
            <rect
              key={i}
              x={x}
              y={15 - height / 2}
              width="2"
              height={height}
              rx="1"
              fill="url(#waveGradient)"
              opacity={0.9}
            />
          );
        })}
      </svg>
    </div>
  );
}

function AudioCard({ title, subtitle, audioUrl, coverImage, showWaveform }: AudioCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <button
      onClick={togglePlay}
      className="group relative flex flex-1 flex-col items-center justify-center overflow-hidden rounded-xl h-28 transition-all"
    >
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Background - either waveform or cover image */}
      {showWaveform ? (
        <WaveformBackground />
      ) : coverImage ? (
        <Image
          src={coverImage}
          alt={title}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="120px"
        />
      ) : null}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 transition-colors group-hover:from-black/70" />

      {/* Play button */}
      <div className="relative z-10 mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-colors group-hover:bg-white/30">
        {isPlaying ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </div>

      {/* Info - at bottom */}
      <div className="relative z-10">
        <p className="text-xs font-medium text-white">{title}:</p>
        <p className="text-[10px] text-gray-300">{subtitle}</p>
      </div>
    </button>
  );
}

export default function AudioShowcase() {
  const { voiceSample, musicSample } = HOME_SHOWCASE_CONFIG;

  return (
    <div className="flex gap-2">
      {/* AI Voice - with waveform background */}
      <AudioCard
        title={voiceSample.title}
        subtitle={voiceSample.subtitle}
        audioUrl={voiceSample.audioUrl}
        showWaveform={true}
      />

      {/* AI Music - with cover image */}
      <AudioCard
        title={musicSample.title}
        subtitle={musicSample.subtitle}
        audioUrl={musicSample.audioUrl}
        coverImage={musicSample.coverImage}
      />
    </div>
  );
}
