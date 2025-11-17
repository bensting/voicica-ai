'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface AudioPlayerProps {
  audioUrl: string;
  duration: number;
  isPlaying: boolean;
  onPlay: () => void;
  onDownload: () => void;
  voiceAvatar?: string;
  voiceName?: string;
  voiceDisplayName?: string;
}

export default function AudioPlayer({
  audioUrl,
  duration,
  isPlaying,
  onPlay,
  onDownload,
  voiceAvatar,
  voiceName,
  voiceDisplayName
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);

  // Get display name
  const displayName = voiceDisplayName || voiceName || 'Voice';

  // Generate mock waveform data
  const generateWaveform = () => {
    const bars = 50;
    const waveform = [];
    for (let i = 0; i < bars; i++) {
      waveform.push(Math.random() * 0.8 + 0.2);
    }
    return waveform;
  };

  const [waveform] = useState(generateWaveform());

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / duration) * 100);
    };

    const handleEnded = () => {
      setCurrentTime(0);
      setProgress(0);
      onPlay(); // Toggle to stop
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [duration, onPlay]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
    setProgress(percentage * 100);
  };

  return (
    <div className="flex items-center gap-4">
      {/* Hidden audio element */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Voice Avatar and Name */}
      <div className="flex flex-col items-center gap-1 flex-shrink-0">
        {/* Play/Pause Button with Avatar */}
        <button
          onClick={onPlay}
          className="relative w-12 h-12 rounded-full overflow-hidden group"
        >
          {/* Avatar or Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-purple-600">
            {voiceAvatar ? (
              <Image
                src={voiceAvatar}
                alt={displayName}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-2xl">🎤</span>
              </div>
            )}
          </div>

          {/* Play/Pause Icon Overlay */}
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-center justify-center">
            {isPlaying ? (
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </div>
        </button>

        {/* Voice Name */}
        <span className="text-xs text-gray-600 font-medium max-w-[4rem] truncate text-center">
          {displayName}
        </span>
      </div>

      {/* Waveform */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-gray-500 min-w-[2rem]">
            {formatTime(currentTime)}
          </span>

          <div
            className="flex-1 h-8 flex items-center gap-0.5 cursor-pointer"
            onClick={handleWaveformClick}
          >
            {waveform.map((height, index) => (
              <div
                key={index}
                className="flex-1 bg-gray-300 rounded-sm transition-colors hover:bg-gray-400"
                style={{
                  height: `${height * 100}%`,
                  backgroundColor: index < (progress / 100) * waveform.length
                    ? '#1f2937'
                    : '#d1d5db'
                }}
              />
            ))}
          </div>

          <span className="text-xs text-gray-500 min-w-[2rem] text-right">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={onDownload}
        className="flex items-center justify-center w-10 h-10 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors"
        title="Download"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v13m0 0l-4-4m4 4l4-4m5 6v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2" />
        </svg>
      </button>
    </div>
  );
}
