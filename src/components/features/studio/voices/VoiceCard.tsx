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
  onPlay: (voice: Voice, style: string | null) => void;
  onSelect: (voice: Voice, style: string | null) => void;
  priority?: boolean; // For LCP optimization - set true for above-the-fold images
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
  priority = false,
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
    // 完整的 locale 映射表
    const countryMap: Record<string, string> = {
      // 中文
      'zh-CN': 'CN',
      'zh-TW': 'TW',
      'zh-HK': 'HK',
      // 英语
      'en-US': 'US',
      'en-GB': 'GB',
      'en-AU': 'AU',
      'en-CA': 'CA',
      'en-IN': 'IN',
      'en-IE': 'IE',
      'en-NZ': 'NZ',
      'en-ZA': 'ZA',
      // 日语
      'ja-JP': 'JP',
      // 韩语
      'ko-KR': 'KR',
      // 西班牙语
      'es-ES': 'ES',
      'es-MX': 'MX',
      'es-AR': 'AR',
      'es-CO': 'CO',
      // 法语
      'fr-FR': 'FR',
      'fr-CA': 'CA',
      'fr-BE': 'BE',
      'fr-CH': 'CH',
      // 德语
      'de-DE': 'DE',
      'de-AT': 'AT',
      'de-CH': 'CH',
      // 意大利语
      'it-IT': 'IT',
      // 葡萄牙语
      'pt-BR': 'BR',
      'pt-PT': 'PT',
      // 俄语
      'ru-RU': 'RU',
      // 阿拉伯语
      'ar-SA': 'SA',
      'ar-AE': 'AE',
      'ar-EG': 'EG',
      'ar-BH': 'BH',
      'ar-DZ': 'DZ',
      'ar-IQ': 'IQ',
      'ar-JO': 'JO',
      'ar-KW': 'KW',
      'ar-LB': 'LB',
      'ar-LY': 'LY',
      'ar-MA': 'MA',
      'ar-OM': 'OM',
      'ar-QA': 'QA',
      'ar-SY': 'SY',
      'ar-TN': 'TN',
      'ar-YE': 'YE',
      // 其他语言
      'nl-NL': 'NL',
      'nl-BE': 'BE',
      'pl-PL': 'PL',
      'tr-TR': 'TR',
      'sv-SE': 'SE',
      'no-NO': 'NO',
      'da-DK': 'DK',
      'fi-FI': 'FI',
      'el-GR': 'GR',
      'cs-CZ': 'CZ',
      'hu-HU': 'HU',
      'ro-RO': 'RO',
      'th-TH': 'TH',
      'vi-VN': 'VN',
      'id-ID': 'ID',
      'ms-MY': 'MY',
      'fil-PH': 'PH',
      'uk-UA': 'UA',
      'bg-BG': 'BG',
      'hr-HR': 'HR',
      'sk-SK': 'SK',
      'sl-SI': 'SI',
      'et-EE': 'EE',
      'lv-LV': 'LV',
      'lt-LT': 'LT',
      'he-IL': 'IL',
      'hi-IN': 'IN',
      'bn-IN': 'IN',
      'ta-IN': 'IN',
      'te-IN': 'IN',
      'mr-IN': 'IN',
      'gu-IN': 'IN',
      'kn-IN': 'IN',
      'ml-IN': 'IN',
      'ur-PK': 'PK',
      'fa-IR': 'IR',
      'am-ET': 'ET',
      'af-ZA': 'ZA',
      'sw-KE': 'KE',
      'zu-ZA': 'ZA',
    };

    // 如果有精确匹配，返回映射的国家代码
    if (countryMap[locale]) {
      return countryMap[locale];
    }

    // 否则尝试从 locale 中提取国家代码（例如 "ar-SA" -> "SA"）
    const parts = locale.split('-');
    if (parts.length === 2) {
      return parts[1].toUpperCase();
    }

    // 如果无法提取，返回 null（不显示国旗）
    return '';
  };

  // Get Flag Icon component
  const getFlagIcon = (locale: string) => {
    const countryCode = getCountryCode(locale);

    if (!countryCode) {
      return <span className="text-xs">🌐</span>;
    }

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
            priority={priority}
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-sm font-bold">
            {voiceName.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Play button overlay */}
        <button
          onClick={() => onPlay(voice, selectedStyle)}
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
        onClick={() => onSelect(voice, selectedStyle)}
        className="w-9 h-9 rounded-lg bg-purple-100 hover:bg-purple-600 border-2 border-purple-300 hover:border-purple-600 flex items-center justify-center flex-shrink-0 transition-all shadow-sm hover:shadow-md group"
      >
        <ArrowRight className="w-5 h-5 text-purple-600 group-hover:text-white transition-colors" />
      </button>
    </div>
  );
}