'use client';

import Image from 'next/image';
import { Play, Pause, Check } from 'lucide-react';
import type { Voice } from '@/types/voice';

interface VoiceGridItemProps {
  voice: Voice;
  voiceName: string;
  isPlaying: boolean;
  isSelected: boolean;
  onPlay: (voice: Voice) => void;
  onSelect: (voice: Voice) => void;
  priority?: boolean;
}

/**
 * Voice grid item - circular avatar with name
 */
export default function VoiceGridItem({
  voice,
  voiceName,
  isPlaying,
  isSelected,
  onPlay,
  onSelect,
  priority = false,
}: VoiceGridItemProps) {
  return (
    <button
      onClick={() => onSelect(voice)}
      className="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all hover:bg-gray-100 active:scale-95"
    >
      {/* Avatar with play overlay */}
      <div className="relative">
        <div
          className={`w-14 h-14 rounded-full overflow-hidden ring-2 transition-all ${
            isSelected
              ? 'ring-purple-500 ring-offset-2 ring-offset-white'
              : 'ring-transparent'
          }`}
        >
          {voice.avatar_url ? (
            <Image
              src={voice.avatar_url}
              alt={voiceName}
              width={56}
              height={56}
              className="w-full h-full object-cover"
              priority={priority}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-lg font-bold">
              {voiceName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Play button - top right */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlay(voice);
          }}
          className={`absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full flex items-center justify-center shadow-md transition-all ${
            isPlaying
              ? 'bg-purple-500 text-white'
              : 'bg-white text-gray-700 hover:bg-purple-100'
          }`}
        >
          {isPlaying ? (
            <Pause className="w-3 h-3" />
          ) : (
            <Play className="w-3 h-3 ml-0.5" />
          )}
        </button>

        {/* Selected checkmark */}
        {isSelected && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center shadow-md">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {/* Name */}
      <span className={`text-xs text-center line-clamp-1 max-w-[72px] ${
        isSelected ? 'text-purple-600 font-medium' : 'text-gray-600'
      }`}>
        {voiceName}
      </span>
    </button>
  );
}