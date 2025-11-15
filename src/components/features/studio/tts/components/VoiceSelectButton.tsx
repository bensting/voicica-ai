'use client';

import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import type { Voice } from '@/types/voice';
import { useLanguage } from '@/contexts/LanguageContext';

interface VoiceSelectButtonProps {
  voice: Voice | null;
  onClick: () => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
  className?: string;
}

/**
 * Reusable Voice Selection Button Component
 *
 * Used in:
 * - Mobile TTS page (large size with details)
 * - Desktop TTS page (medium size with details)
 * - Voice selector modal (small size)
 */
export default function VoiceSelectButton({
  voice,
  onClick,
  disabled = false,
  size = 'large',
  showDetails = true,
  className = '',
}: VoiceSelectButtonProps) {
  const { t } = useLanguage();

  // Size configurations
  const sizeConfig = {
    small: {
      container: 'p-3',
      avatar: 'w-10 h-10',
      name: 'text-sm',
      details: 'text-xs',
      icon: 'w-4 h-4',
    },
    medium: {
      container: 'p-3.5',
      avatar: 'w-11 h-11',
      name: 'text-sm',
      details: 'text-xs',
      icon: 'w-5 h-5',
    },
    large: {
      container: 'p-4',
      avatar: 'w-12 h-12',
      name: 'text-base',
      details: 'text-xs',
      icon: 'w-5 h-5',
    },
  };

  const config = sizeConfig[size];
  const voiceName = voice?.display_name || t('studio.selectVoice');

  // Get gender display text
  const getGenderText = (gender: string) => {
    switch (gender) {
      case 'male':
        return t('voiceFilters.male');
      case 'female':
        return t('voiceFilters.female');
      default:
        return t('voiceFilters.neutral');
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full flex items-center justify-between
        bg-white border-2 border-gray-200 rounded-2xl
        hover:border-purple-300 active:border-purple-400
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${config.container}
        ${className}
      `}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Voice Avatar */}
        <div
          className={`
            ${config.avatar}
            rounded-full overflow-hidden
            bg-gradient-to-br from-purple-400 to-purple-600
            flex items-center justify-center flex-shrink-0
          `}
        >
          {voice?.avatar_url ? (
            <Image
              src={voice.avatar_url}
              alt={voiceName}
              width={48}
              height={48}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xl text-white">🎤</span>
          )}
        </div>

        {/* Voice Info */}
        <div className="text-left min-w-0 flex-1">
          <div className={`font-semibold text-gray-900 truncate ${config.name}`}>
            {voiceName}
          </div>
          {showDetails && voice && (
            <div className={`text-gray-500 truncate ${config.details}`}>
              {voice.locale} • {getGenderText(voice.gender)}
            </div>
          )}
        </div>
      </div>

      {/* Arrow Icon */}
      <ChevronRight className={`text-gray-400 flex-shrink-0 ${config.icon}`} />
    </button>
  );
}