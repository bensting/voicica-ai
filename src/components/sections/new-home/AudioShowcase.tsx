'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { HOME_SHOWCASE_CONFIG } from '@/config/homeShowcase';

interface AudioCardProps {
  title: string;
  subtitle: string;
  audioUrl: string;
  coverImage: string;
}

function AudioCard({ title, subtitle, audioUrl, coverImage }: AudioCardProps) {
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
      className="group relative flex flex-col items-center overflow-hidden rounded-xl bg-gray-800/60 p-2 backdrop-blur-sm transition-all hover:bg-gray-800/80"
    >
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Cover Image with Play Icon */}
      <div className="relative mb-2 h-16 w-16 overflow-hidden rounded-lg">
        <Image
          src={coverImage}
          alt={title}
          fill
          className="object-cover"
          sizes="64px"
        />
        {/* Play/Pause overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/40">
          {isPlaying ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </div>
      </div>

      {/* Info */}
      <p className="text-[10px] font-medium text-white">{title}:</p>
      <p className="text-[9px] text-gray-400">{subtitle}</p>
    </button>
  );
}

export default function AudioShowcase() {
  const { voiceSample, musicSample } = HOME_SHOWCASE_CONFIG;

  return (
    <div className="flex gap-2">
      {/* AI Voice */}
      <AudioCard
        title={voiceSample.title}
        subtitle={voiceSample.subtitle}
        audioUrl={voiceSample.audioUrl}
        coverImage={voiceSample.coverImage}
      />

      {/* AI Music */}
      <AudioCard
        title={musicSample.title}
        subtitle={musicSample.subtitle}
        audioUrl={musicSample.audioUrl}
        coverImage={musicSample.coverImage}
      />
    </div>
  );
}
