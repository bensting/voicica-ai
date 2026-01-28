'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Pause } from 'lucide-react';
import type { SharedMusicData } from '@/actions/share';

interface SharedMusicPlayerProps {
  music: SharedMusicData;
}

// 格式化时间 (秒 -> mm:ss)
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 提取 prompt 和歌词
function extractPromptAndLyrics(text: string | null): { prompt: string | null; lyrics: string | null } {
  if (!text) return { prompt: null, lyrics: null };
  // 歌词标记通常以 [Intro], [Verse], [Chorus], [Bridge], [Outro], [Hook] 等开头
  const lyricsMatch = text.match(/\[(Intro|Verse|Chorus|Bridge|Outro|Hook|Pre-Chorus|Refrain).*?\]/i);
  if (lyricsMatch && lyricsMatch.index !== undefined) {
    const prompt = text.substring(0, lyricsMatch.index).trim() || null;
    const lyrics = text.substring(lyricsMatch.index).trim();
    return { prompt, lyrics };
  }
  // 没有歌词标记，整段作为 prompt
  return { prompt: text.trim(), lyrics: null };
}

export default function SharedMusicPlayer({ music }: SharedMusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(music.duration || 0);

  const displayTitle = music.title || 'AI Music';
  const { lyrics: displayLyrics } = extractPromptAndLyrics(music.lyrics);

  // 播放/暂停
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // 更新播放进度
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // 加载元数据
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  // 播放结束
  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // 进度条点击
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    audioRef.current.currentTime = percent * duration;
    setCurrentTime(percent * duration);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="h-screen bg-[#0a0a1a] flex flex-col overflow-hidden">
      {/* 隐藏的音频元素 */}
      {music.audio_url && (
        <audio
          ref={audioRef}
          src={music.audio_url}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
        />
      )}

      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo/logo-transparent.png"
            alt="Voicica AI"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <span className="text-white font-semibold text-lg">Voicica.AI</span>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-4 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-full hover:opacity-90 transition-opacity"
        >
          Try Free
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center px-6 py-4 min-h-0 overflow-hidden">
        {/* 上半部分：封面 + 标题 */}
        <div className="flex-shrink-0 flex flex-col items-center">
          {/* 封面 */}
          <div className="relative w-44 h-44 mb-3 rounded-2xl overflow-hidden shadow-2xl">
            {music.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={music.cover_url}
                alt={displayTitle}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <svg className="w-16 h-16 text-white/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </div>
            )}
            {/* AI 标签 */}
            <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-purple-500 rounded text-white text-[10px] font-medium">
              AI
            </div>
          </div>

          {/* 标题 */}
          <h1 className="text-xl font-bold text-white mb-1 text-center">{displayTitle}</h1>
        </div>

        {/* 歌词区域 - 弹性空间，可滚动 */}
        {displayLyrics && (
          <div className="flex-1 w-full max-w-sm overflow-y-auto my-3 min-h-[80px]">
            <p className="text-gray-300 text-sm text-center whitespace-pre-wrap leading-relaxed">
              {displayLyrics}
            </p>
          </div>
        )}

        {/* 下半部分：播放控制 + CTA */}
        <div className="flex-shrink-0 w-full max-w-sm">
          {/* 播放按钮 */}
          <button
            onClick={togglePlay}
            disabled={!music.audio_url}
            className="mx-auto mb-2 w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-white" fill="white" />
            ) : (
              <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
            )}
          </button>

          {/* 进度条 */}
          <div
            className="w-full h-1.5 bg-gray-700 rounded-full cursor-pointer mb-2"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full relative transition-all"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow" />
            </div>
          </div>

          {/* 时间显示 */}
          <div className="flex justify-between text-gray-500 text-xs mb-3">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          {/* CTA */}
          <div className="text-center">
            <p className="text-gray-400 text-xs mb-1.5">Create your own AI music</p>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-full hover:opacity-90 transition-opacity"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Create Now
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex-shrink-0 py-2.5 flex items-center justify-center gap-2 border-t border-white/10">
        <span className="text-gray-500 text-xs">Powered by</span>
        <Link href="/" className="flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity">
          <Image
            src="/logo/logo-transparent.png"
            alt="Voicica AI"
            width={20}
            height={20}
            className="h-5 w-5"
          />
          <span className="text-white text-sm font-medium">Voicica.AI</span>
        </Link>
      </footer>
    </div>
  );
}
