'use client';

import Image from 'next/image';
import type { VoiceModel } from '@/hooks/useTTSGenerator';

interface MobileVoiceSelectorProps {
  selectedVoice: VoiceModel | null;
  onOpenVoiceModal: () => void;
  disabled?: boolean;
}

/**
 * Mobile Voice Selector Component
 *
 * Compact voice selector button for mobile TTS
 * Shows current voice avatar and name, opens modal on click
 */
export default function MobileVoiceSelector({
  selectedVoice,
  onOpenVoiceModal,
  disabled = false,
}: MobileVoiceSelectorProps) {
  return (
    <button
      type="button"
      onClick={onOpenVoiceModal}
      disabled={disabled}
      className="w-full flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-2xl hover:border-purple-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="flex items-center gap-3">
        {/* Voice Avatar */}
        <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center flex-shrink-0">
          {selectedVoice?.avatar_url ? (
            <Image
              src={selectedVoice.avatar_url}
              alt={selectedVoice.name}
              width={48}
              height={48}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl text-white">🎤</span>
          )}
        </div>

        {/* Voice Name */}
        <div className="text-left">
          <div className="text-base font-semibold text-gray-900">
            {selectedVoice?.display_name?.zh || selectedVoice?.name || '晓臻'}
          </div>
          {selectedVoice && (
            <div className="text-xs text-gray-500">
              {selectedVoice.locale} • {selectedVoice.gender}
            </div>
          )}
        </div>
      </div>

      {/* Arrow Icon */}
      <svg
        className="w-5 h-5 text-gray-400 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}