/**
 * TTS 推广页语言配置
 * 所有支持的语言列表、统计数据、落地页链接等共享配置
 */

export interface LanguageOption {
  code: string;
  name: string;
  flag: string;
}

export interface LanguagePageItem {
  code: string;
  name: string;
  flag: string;
  href: string;
}

// 统计数值 - 所有页面共享
export const STATS_VALUES = {
  voices: '3200+',
  languages: '190+',
  free: '100%',
} as const;

// 语言落地页链接 - 所有页面共享
export const EXPLORE_LANGUAGE_PAGES: LanguagePageItem[] = [
  { code: 'en-US', name: 'English', flag: '🇺🇸', href: '/tts/english' },
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳', href: '/tts/chinese' },
  { code: 'zh-TW', name: '繁體中文', flag: '🇹🇼', href: '/tts/chinese-traditional' },
  { code: 'ja-JP', name: '日本語', flag: '🇯🇵', href: '/tts/japanese' },
  { code: 'ko-KR', name: '한국어', flag: '🇰🇷', href: '/tts/korean' },
  { code: 'th-TH', name: 'ภาษาไทย', flag: '🇹🇭', href: '/tts/thai' },
  { code: 'vi-VN', name: 'Tiếng Việt', flag: '🇻🇳', href: '/tts/vietnamese' },
  { code: 'id-ID', name: 'Bahasa Indonesia', flag: '🇮🇩', href: '/tts/indonesian' },
  { code: 'es-ES', name: 'Español', flag: '🇪🇸', href: '/tts/spanish' },
  { code: 'pt-BR', name: 'Português', flag: '🇧🇷', href: '/tts/portuguese' },
];

// 所有支持的语言列表
export const ALL_LANGUAGES: LanguageOption[] = [
  { code: 'en-US', name: 'English', flag: '🇺🇸' },
  { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
  { code: 'en-AU', name: 'English (AU)', flag: '🇦🇺' },
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
  { code: 'zh-TW', name: '繁體中文', flag: '🇹🇼' },
  { code: 'ja-JP', name: '日本語', flag: '🇯🇵' },
  { code: 'ko-KR', name: '한국어', flag: '🇰🇷' },
  { code: 'es-ES', name: 'Español', flag: '🇪🇸' },
  { code: 'fr-FR', name: 'Français', flag: '🇫🇷' },
  { code: 'de-DE', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'ar-SA', name: 'العربية', flag: '🇸🇦' },
  { code: 'ru-RU', name: 'Русский', flag: '🇷🇺' },
  { code: 'pt-BR', name: 'Português', flag: '🇧🇷' },
  { code: 'tr-TR', name: 'Turkish', flag: '🇹🇷' },
  { code: 'nb-NO', name: 'Norwegian', flag: '🇳🇴' },
  { code: 'sk-SK', name: 'Slovak', flag: '🇸🇰' },
  { code: 'hi-IN', name: 'Hindi', flag: '🇮🇳' },
  { code: 'sv-SE', name: 'Swedish', flag: '🇸🇪' },
  { code: 'ga-IE', name: 'Irish', flag: '🇮🇪' },
  { code: 'lv-LV', name: 'Latvian', flag: '🇱🇻' },
  { code: 'th-TH', name: 'ภาษาไทย', flag: '🇹🇭' },
  { code: 'id-ID', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'vi-VN', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'ms-MY', name: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'tl-PH', name: 'Filipino', flag: '🇵🇭' },
];

/**
 * 根据默认语言获取排序后的语言列表
 * 将默认语言放到第一位
 */
export function getLanguageOptions(defaultLanguage: string): LanguageOption[] {
  const defaultLang = ALL_LANGUAGES.find(l => l.code === defaultLanguage);
  const otherLangs = ALL_LANGUAGES.filter(l => l.code !== defaultLanguage);

  if (defaultLang) {
    return [defaultLang, ...otherLangs];
  }
  return ALL_LANGUAGES;
}