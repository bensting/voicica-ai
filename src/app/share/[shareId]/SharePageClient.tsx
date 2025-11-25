'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Download, Play, Pause } from 'lucide-react';
import type { SharedTtsRecord } from '@/actions/tts';
import { useLanguage } from '@/contexts/LanguageContext';

interface SharePageClientProps {
  record: SharedTtsRecord;
}

/**
 * 分享页面客户端组件
 * 包含音频播放器和交互功能
 */
export default function SharePageClient({ record }: SharePageClientProps) {
  const { t } = useLanguage();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);

  // 音频播放控制
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration > 0) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      setProgress(0);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  // 播放/暂停
  const handleTogglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  // 点击进度条跳转
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * record.duration;

    audio.currentTime = newTime;
    setCurrentTime(newTime);
    setProgress(percentage * 100);
  };

  // 下载音频
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = record.audio_url;
    link.download = `ai-voice-${record.share_id}.mp3`;
    link.click();
  };

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 格式化日期
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const voiceDisplayName = record.voice?.display_name || record.voice?.name || 'AI Voice';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hidden audio element */}
      <audio ref={audioRef} src={record.audio_url} preload="metadata" />

      <div className="max-w-2xl mx-auto px-4 py-8 md:py-16">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
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
            <span className="text-xl font-bold text-gray-900">AI Voice Labs</span>
          </Link>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Text Content */}
          <div className="p-6 md:p-8 border-b border-gray-100">
            <p className="text-gray-900 text-lg leading-relaxed whitespace-pre-wrap">
              {record.text}
            </p>
          </div>

          {/* Audio Player */}
          <div className="p-6 md:p-8 bg-gray-50">
            <div className="flex items-center gap-4">
              {/* Voice Avatar & Play Button */}
              <button
                onClick={handleTogglePlay}
                className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 shadow-md"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-purple-600">
                  {record.voice?.avatar_url ? (
                    <Image
                      src={record.voice.avatar_url}
                      alt={voiceDisplayName}
                      width={56}
                      height={56}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-2xl">🎤</span>
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/40 hover:bg-black/50 transition-colors flex items-center justify-center">
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-white" fill="white" />
                  ) : (
                    <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
                  )}
                </div>
              </button>

              {/* Progress & Info */}
              <div className="flex-1 min-w-0">
                {/* Voice Name */}
                <div className="text-sm font-medium text-gray-700 mb-2">
                  {voiceDisplayName}
                </div>

                {/* Progress Bar */}
                <div
                  className="relative h-2 bg-purple-100 rounded-full cursor-pointer mb-2"
                  onClick={handleProgressClick}
                >
                  <div
                    className="absolute inset-y-0 left-0 bg-purple-500 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Time Display */}
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(record.duration)}</span>
                </div>
              </div>

              {/* Download Button */}
              <button
                onClick={handleDownload}
                className="flex-shrink-0 p-3 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
                title={t('share.download')}
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Meta Info */}
          <div className="px-6 md:px-8 py-4 text-sm text-gray-500 flex items-center justify-between border-t border-gray-100">
            <span>{formatDate(record.created_at)}</span>
            <span>{record.character_count} {t('share.characters')}</span>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('share.ctaTitle')}
            </h3>
            <p className="text-gray-600 mb-4">
              {t('share.ctaDescription')}
            </p>
            <Link
              href="/studio/tts"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:from-purple-600 hover:to-pink-600 transition-colors"
            >
              {t('share.tryNow')}
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Powered by{' '}
            <Link href="/" className="text-purple-600 hover:underline">
              AI Voice Labs
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}