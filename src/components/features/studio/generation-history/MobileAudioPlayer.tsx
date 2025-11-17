'use client';

import { useState, useRef, useEffect } from 'react';
import { Download } from 'lucide-react';
import Image from 'next/image';

interface MobileAudioPlayerProps {
  audioUrl: string;
  duration: number;
  isPlaying: boolean;
  onPlay: () => void;
  onDownload: () => void;
  voiceAvatar?: string;
  voiceName?: string;
  voiceDisplayName?: string;
}

export default function MobileAudioPlayer({
  audioUrl,
  duration,
  isPlaying,
  onPlay,
  onDownload,
  voiceAvatar,
  voiceName,
  voiceDisplayName
}: MobileAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);

  // Get display name
  const displayName = voiceDisplayName || voiceName || 'Voice';

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

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
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
    <div className="flex items-center gap-3 max-w-full">
      {/* Hidden audio element */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Play/Pause Button with Avatar */}
      <button
        onClick={onPlay}
        className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0"
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
        <div className="absolute inset-0 bg-black/40 hover:bg-black/50 transition-colors flex items-center justify-center">
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

      {/* Progress Bar and Time */}
      <div className="flex-1 min-w-0 overflow-hidden">
        {/* Voice Name */}
        <div className="text-xs text-gray-600 font-medium truncate mb-1">
          {displayName}
        </div>

        {/* Progress Bar */}
        <div
          className="relative h-1.5 bg-purple-100 rounded-full cursor-pointer group"
          onClick={handleProgressClick}
        >
          <div
            className="absolute inset-y-0 left-0 bg-purple-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Time Display */}
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-500 flex-shrink-0">
            {formatTime(currentTime)}
          </span>
          <span className="text-xs text-gray-500 flex-shrink-0">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={onDownload}
        className="flex-shrink-0 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        title="Download"
      >
        <Download className="w-5 h-5" />
      </button>
    </div>
  );
}