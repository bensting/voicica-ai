'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Pause } from 'lucide-react';
import type { SharedDialogueData } from '@/actions/share';

interface SharedDialoguePlayerProps {
  dialogue: SharedDialogueData;
}

interface DialogueItem {
  text: string;
  voice: string;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function SharedDialoguePlayer({ dialogue }: SharedDialoguePlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(dialogue.duration || 0);

  let dialogueItems: DialogueItem[] = [];
  try {
    dialogueItems = JSON.parse(dialogue.dialogue_json);
  } catch {
    // ignore
  }

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

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
      {dialogue.audio_url && (
        <audio
          ref={audioRef}
          src={dialogue.audio_url}
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
        {/* Icon + Title */}
        <div className="flex-shrink-0 flex flex-col items-center">
          <div className="relative w-44 h-44 mb-3 rounded-2xl overflow-hidden shadow-2xl">
            <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-pink-900 flex items-center justify-center">
              <svg className="w-16 h-16 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
                <path d="M8 9h8M8 13h4" />
              </svg>
            </div>
            <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-pink-500 rounded text-white text-[10px] font-medium">
              Dialogue
            </div>
          </div>
          <h1 className="text-xl font-bold text-white mb-1 text-center">AI Dialogue</h1>
        </div>

        {/* Dialogue content - scrollable */}
        {dialogueItems.length > 0 && (
          <div className="flex-1 w-full max-w-sm overflow-y-auto my-3 min-h-[80px] space-y-2">
            {dialogueItems.map((item, index) => (
              <div key={index} className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-purple-400 text-xs font-medium mb-1">{item.voice}</div>
                <div className="text-gray-300 text-sm leading-relaxed">{item.text}</div>
              </div>
            ))}
          </div>
        )}

        {/* Player controls + CTA */}
        <div className="flex-shrink-0 w-full max-w-sm">
          <button
            onClick={togglePlay}
            disabled={!dialogue.audio_url}
            className="mx-auto mb-2 w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-white" fill="white" />
            ) : (
              <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
            )}
          </button>

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

          <div className="flex justify-between text-gray-500 text-xs mb-3">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          <div className="text-center">
            <p className="text-gray-400 text-xs mb-1.5">Create your own AI dialogue</p>
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
