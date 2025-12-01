'use client';

import Image from 'next/image';
import { ChevronRight, User, UserRound } from 'lucide-react';
import * as FlagIcons from 'country-flag-icons/react/3x2';
import type { Voice } from '@/types/voice';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCountryCode } from '@/utils/localeMapper';
import ProviderIcon from '@/components/ui/icons/ProviderIcon';

interface VoiceSelectButtonProps {
  voice: Voice | null;
  selectedStyle?: string | null;
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
  selectedStyle,
  onClick,
  disabled = false,
  size = 'large',
  showDetails = true,
  className = '',
}: VoiceSelectButtonProps) {
  const { t } = useLanguage();

  // Get style label with i18n (defaults to "default" if no style selected)
  const getStyleLabel = (style: string | null | undefined): string => {
    // 翻译文件的 key 是小写的，需要转换
    const styleKey = style || 'default';
    const translated = t(`voiceStyles.${styleKey}`);
    // If translation not found, t() returns the key, so check and return original style
    return translated === `voiceStyles.${styleKey}` ? styleKey : translated;
  };

  // Size configurations
  const sizeConfig = {
    small: {
      container: 'p-3',
      avatar: 'w-10 h-10',
      name: 'text-sm',
      details: 'text-xs',
      icon: 'w-4 h-4',
      flag: 'w-3.5 h-3.5',
    },
    medium: {
      container: 'p-3.5',
      avatar: 'w-11 h-11',
      name: 'text-sm',
      details: 'text-xs',
      icon: 'w-5 h-5',
      flag: 'w-4 h-4',
    },
    large: {
      container: 'p-3',
      avatar: 'w-11 h-11',
      name: 'text-sm',
      details: 'text-xs',
      icon: 'w-5 h-5',
      flag: 'w-3.5 h-3.5',
    },
  };

  const config = sizeConfig[size];
  const voiceName = voice?.display_name || t('tts.selectVoice');

  // Get Flag Icon component
  const getFlagIcon = (locale: string) => {
    const countryCode = getCountryCode(locale);
    const FlagComponent = (FlagIcons as Record<string, React.ComponentType<{ className?: string }>>)[countryCode];

    if (FlagComponent) {
      return <FlagComponent className={`${config.flag} rounded-sm`} />;
    }
    return <span className="text-xs">🌐</span>;
  };

  // Get gender icon
  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'male':
        return <User className={`${config.flag} text-blue-500`} />;
      case 'female':
        return <UserRound className={`${config.flag} text-pink-500`} />;
      default:
        return <User className={`${config.flag} text-gray-500`} />;
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
              priority
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
            <div className={`flex items-center gap-1.5 ${config.details}`}>
              {getFlagIcon(voice.locale)}
              {getGenderIcon(voice.gender)}
              <ProviderIcon provider={voice.provider} className={config.flag} />
            </div>
          )}
        </div>
      </div>

      {/* Style Badge & Arrow Icon */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Style Badge - only show when voice is selected */}
        {voice && (
          <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700">
            {getStyleLabel(selectedStyle)}
          </span>
        )}
        <ChevronRight className={`text-gray-400 ${config.icon}`} />
      </div>
    </button>
  );
}