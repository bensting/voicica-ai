import { LocaleOption } from '@/types/config';

/**
 * 语言代码到显示信息的映射
 * 使用 ISO 3166-1 alpha-2 国家代码来渲染国旗图标
 */
const LOCALE_MAP: Record<string, { name: string; countryCode: string }> = {
  'zh-CN': { name: '简体中文', countryCode: 'CN' },
  'zh-TW': { name: '繁體中文', countryCode: 'TW' },
  'en-US': { name: 'English(US)', countryCode: 'US' },
  'ja-JP': { name: '日本語', countryCode: 'JP' },
  'ko-KR': { name: '한국어', countryCode: 'KR' },
  'es-ES': { name: 'Español', countryCode: 'ES' },
  'fr-FR': { name: 'Français', countryCode: 'FR' },
  'de-DE': { name: 'Deutsch', countryCode: 'DE' },
  'it-IT': { name: 'Italiano', countryCode: 'IT' },
  'pt-BR': { name: 'Português', countryCode: 'BR' },
  'ru-RU': { name: 'Русский', countryCode: 'RU' },
  'ar-SA': { name: 'العربية', countryCode: 'SA' },
  'hi-IN': { name: 'हिन्दी', countryCode: 'IN' },
  'th-TH': { name: 'ไทย', countryCode: 'TH' },
  'vi-VN': { name: 'Tiếng Việt', countryCode: 'VN' },
};

/**
 * 将语言代码数组转换为 LocaleOption 数组
 */
export function mapLocaleCodesToOptions(localeCodes: string[]): LocaleOption[] {
  return localeCodes
    .map((code) => {
      const localeInfo = LOCALE_MAP[code];
      if (!localeInfo) {
        console.warn(`⚠️ Unknown locale code: ${code}`);
        return null;
      }
      return {
        code,
        name: localeInfo.name,
        countryCode: localeInfo.countryCode,
      };
    })
    .filter((option): option is LocaleOption => option !== null);
}

/**
 * 获取单个语言的信息
 */
export function getLocaleInfo(code: string): LocaleOption | null {
  const localeInfo = LOCALE_MAP[code];
  if (!localeInfo) return null;

  return {
    code,
    name: localeInfo.name,
    countryCode: localeInfo.countryCode,
  };
}