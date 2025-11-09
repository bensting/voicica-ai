'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import AudioPlayer from './AudioPlayer';
import { getStatusLabel, getStatusColor } from '@/lib/api/tts';
import type { Generation } from '@/types/tts';

interface MobileSpeechCardProps {
  generation: Generation;
  onDelete: () => void;
  onDownload: () => void;
}

export default function MobileSpeechCard({ generation, onDelete, onDownload }: MobileSpeechCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      {/* Header: Timestamp, Status, Character Count */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xs text-gray-500 whitespace-nowrap">{generation.timestamp}</span>
          {generation.status && (
            <span className={`px-2 py-0.5 text-xs font-medium rounded whitespace-nowrap ${getStatusColor(generation.status)}`}>
              {getStatusLabel(generation.status)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="px-2 py-0.5 text-xs font-medium text-gray-600 bg-gray-100 rounded whitespace-nowrap">
            {generation.characterCount} characters
          </span>
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Text Content */}
      <div className="mb-3">
        <p className="text-sm text-gray-900 line-clamp-2">{generation.text}</p>
      </div>

      {/* Audio Player */}
      {generation.audioUrl && (
        <AudioPlayer
          audioUrl={generation.audioUrl}
          duration={generation.duration}
          isPlaying={isPlaying}
          onPlay={() => setIsPlaying(!isPlaying)}
          onDownload={onDownload}
          voiceAvatar={generation.voiceAvatar}
          voiceName={generation.voiceName}
          voiceDisplayName={generation.voiceDisplayName}
        />
      )}
    </div>
  );
}