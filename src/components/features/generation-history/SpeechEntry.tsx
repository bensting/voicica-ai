'use client';

import { useState } from 'react';
import AudioPlayer from './AudioPlayer';

interface Generation {
  id: string;
  text: string;
  timestamp: string;
  duration: number;
  characterCount: number;
  audioUrl: string;
}

interface SpeechEntryProps {
  generation: Generation;
  onDelete: () => void;
  onDownload: () => void;
}

export default function SpeechEntry({ generation, onDelete, onDownload }: SpeechEntryProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6">
      {/* Timestamp and Actions */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">{generation.timestamp}</span>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
            {generation.characterCount} characters
          </span>
          <button
            onClick={onDelete}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Generated Text */}
      <div className="mb-4">
        <p className="text-gray-900 text-lg leading-relaxed">
          "{generation.text}"
        </p>
      </div>

      {/* Audio Player */}
      <AudioPlayer
        audioUrl={generation.audioUrl}
        duration={generation.duration}
        isPlaying={isPlaying}
        onPlay={handlePlay}
        onDownload={onDownload}
      />
    </div>
  );
}
