import { useState } from 'react';
import Image from 'next/image';
import { Play, Pause, ArrowRight, User, UserRound } from 'lucide-react';
import * as FlagIcons from 'country-flag-icons/react/3x2';
import type { Voice } from '@/types/voice';
import { useLanguage } from '@/contexts/LanguageContext';

interface VoiceCardProps {
  voice: Voice;
  voiceName: string;
  isPlaying: boolean;
  onPlay: (voice: Voice) => void;
  onSelect: (voice: Voice) => void;
}

/**
 * Voice card component displaying voice information and actions
 */
export default function VoiceCard({
  voice,
  voiceName,
  isPlaying,
  onPlay,
  onSelect,
}: VoiceCardProps) {
  const { t } = useLanguage();
  // Selected style state (local for now, functionality to be added later)
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);

  // Get style label with i18n
  const getStyleLabel = (style: string) => {
    const translated = t(`voiceStyles.${style}`);
    // If translation not found, t() returns the key, so check and return original style
    return translated === `voiceStyles.${style}` ? style : translated;
  };

  // Get country code from locale
  const getCountryCode = (locale: string): string => {
    const countryMap: Record<string, string> = {
      'zh-CN': 'CN',
      'zh-TW': 'TW',
      'en-US': 'US',
      'en-GB': 'GB',
      'ja-JP': 'JP',
      'ko-KR': 'KR',
      'es-ES': 'ES',
      'fr-FR': 'FR',
      'de-DE': 'DE',
      'it-IT': 'IT',
      'pt-BR': 'BR',
      'ru-RU': 'RU',
    };
    return countryMap[locale] || 'UN';
  };

  // Get Flag Icon component
  const getFlagIcon = (locale: string) => {
    const countryCode = getCountryCode(locale);
    const FlagComponent = (FlagIcons as Record<string, React.ComponentType<{ className?: string }>>)[countryCode];

    if (FlagComponent) {
      return <FlagComponent className="w-4 h-4 rounded-sm" />;
    }
    return <span className="text-xs">🌐</span>;
  };

  // Get gender icon
  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'male':
        return <User className="w-3.5 h-3.5 text-blue-500" />;
      case 'female':
        return <UserRound className="w-3.5 h-3.5 text-pink-500" />;
      default:
        return <User className="w-3.5 h-3.5 text-gray-500" />;
    }
  };
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 flex items-center gap-4 hover:shadow-md transition-shadow">
      {/* Avatar + Play button */}
      <div className="relative w-12 h-12 flex-shrink-0">
        {voice.avatar_url ? (
          <Image
            src={voice.avatar_url}
            alt={voiceName}
            width={48}
            height={48}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-sm font-bold">
            {voiceName.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Play button overlay */}
        <button
          onClick={() => onPlay(voice)}
          className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 rounded-full transition-all active:scale-95"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 text-white drop-shadow-lg" />
          ) : (
            <Play className="w-4 h-4 text-white drop-shadow-lg" />
          )}
        </button>
      </div>

      {/* Voice information */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-semibold text-gray-900 truncate">{voiceName}</h3>
          <div className="flex items-center gap-1 text-xs">
            {getFlagIcon(voice.locale)}
            {getGenderIcon(voice.gender)}
          </div>
        </div>

        {/* Style list */}
        {voice.style_list && voice.style_list.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {voice.style_list.map((style) => (
              <button
                key={style}
                onClick={() => setSelectedStyle(selectedStyle === style ? null : style)}
                className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                  selectedStyle === style
                    ? 'bg-purple-100 text-purple-700 border border-purple-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {getStyleLabel(style)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Select button */}
      <button
        onClick={() => onSelect(voice)}
        className="w-8 h-8 rounded-lg border border-gray-200 hover:border-purple-500 hover:bg-purple-50 flex items-center justify-center flex-shrink-0 transition-colors group"
      >
        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
      </button>
    </div>
  );
}