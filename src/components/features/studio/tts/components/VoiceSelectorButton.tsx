'use client';

import Image from 'next/image';
import { ChevronRight } from 'lucide-react';

interface VoiceSelectorButtonProps {
  voiceName: string;
  voiceAvatar?: string;
  disabled?: boolean;
  onClick: () => void;
}

/**
 * Voice Selector Button Component
 *
 * Simple button to show current voice and open voice selector
 */
export default function VoiceSelectorButton({
  voiceName,
  voiceAvatar,
  disabled = false,
  onClick,
}: VoiceSelectorButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl shadow-sm border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full"
    >
      {voiceAvatar ? (
        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
          <Image
            src={voiceAvatar}
            alt={voiceName}
            width={48}
            height={48}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
          </svg>
        </div>
      )}
      <span className="text-base font-medium text-gray-900 flex-1 text-left">
        {voiceName}
      </span>
      <ChevronRight className="w-5 h-5 text-gray-400" />
    </button>
  );
}