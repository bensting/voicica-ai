'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { HOME_SHOWCASE_CONFIG } from '@/config/homeShowcase';

interface AudioCardProps {
  title: string;
  subtitle: string;
  audioUrl: string;
  coverImage: string;
  accentColor: string;
  icon: React.ReactNode;
}

function AudioCard({
  title,
  subtitle,
  audioUrl,
  coverImage,
  accentColor,
  icon,
}: AudioCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative overflow-hidden rounded-xl bg-gray-800/50 p-3 backdrop-blur-sm">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <div className="flex items-center gap-3">
        {/* Cover Image */}
        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg">
          <Image
            src={coverImage}
            alt={title}
            fill
            className="object-cover"
            sizes="48px"
          />
          {/* Play/Pause overlay */}
          <button
            onClick={togglePlay}
            className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-colors hover:bg-black/50 ${accentColor}`}
          >
            {isPlaying ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`${accentColor}`}>{icon}</span>
            <span className="text-sm font-medium text-white">{title}</span>
          </div>
          <p className="truncate text-xs text-gray-400">{subtitle}</p>

          {/* Progress bar */}
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-gray-700">
              <div
                className={`h-full rounded-full transition-all ${accentColor.replace('text-', 'bg-')}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            {duration > 0 && (
              <span className="text-[10px] text-gray-500">
                {formatTime(duration)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AudioShowcase() {
  const { voiceSample, musicSample } = HOME_SHOWCASE_CONFIG;

  return (
    <div className="flex flex-col gap-3">
      {/* AI Voice */}
      <AudioCard
        title={voiceSample.title}
        subtitle={voiceSample.subtitle}
        audioUrl={voiceSample.audioUrl}
        coverImage={voiceSample.coverImage}
        accentColor="text-cyan-400"
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        }
      />

      {/* AI Music */}
      <AudioCard
        title={musicSample.title}
        subtitle={musicSample.subtitle}
        audioUrl={musicSample.audioUrl}
        coverImage={musicSample.coverImage}
        accentColor="text-purple-400"
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>
        }
      />
    </div>
  );
}
