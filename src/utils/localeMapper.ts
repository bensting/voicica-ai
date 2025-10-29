import { LocaleOption } from '@/types/config';

/**
 * 语言代码到显示信息的映射
 * 使用 ISO 3166-1 alpha-2 国家代码来渲染国旗图标
 */
const LOCALE_MAP: Record<string, { name: string; countryCode: string }> = {
  // 中文
  'zh-CN': { name: '简体中文', countryCode: 'CN' },
  'zh-TW': { name: '繁體中文', countryCode: 'TW' },

  // 英语变体
  'en-US': { name: 'English (US)', countryCode: 'US' },
  'en-GB': { name: 'English (UK)', countryCode: 'GB' },
  'en-AU': { name: 'English (Australia)', countryCode: 'AU' },
  'en-CA': { name: 'English (Canada)', countryCode: 'CA' },
  'en-IN': { name: 'English (India)', countryCode: 'IN' },
  'en-IE': { name: 'English (Ireland)', countryCode: 'IE' },
  'en-NZ': { name: 'English (New Zealand)', countryCode: 'NZ' },
  'en-ZA': { name: 'English (South Africa)', countryCode: 'ZA' },
  'en-SG': { name: 'English (Singapore)', countryCode: 'SG' },
  'en-PH': { name: 'English (Philippines)', countryCode: 'PH' },
  'en-HK': { name: 'English (Hongkong)', countryCode: 'HK' },
  'en-NG': { name: 'English (Nigeria)', countryCode: 'NG' },
  'en-KE': { name: 'English (Kenya)', countryCode: 'KE' },
  'en-TZ': { name: 'English (Tanzania)', countryCode: 'TZ' },

  // 日语
  'ja-JP': { name: '日本語', countryCode: 'JP' },

  // 韩语
  'ko-KR': { name: '한국어', countryCode: 'KR' },

  // 西班牙语
  'es-ES': { name: 'Español (España)', countryCode: 'ES' },
  'es-MX': { name: 'Español (México)', countryCode: 'MX' },
  'es-AR': { name: 'Español (Argentina)', countryCode: 'AR' },
  'es-CO': { name: 'Español (Colombia)', countryCode: 'CO' },

  // 法语
  'fr-FR': { name: 'Français (France)', countryCode: 'FR' },
  'fr-CA': { name: 'Français (Canada)', countryCode: 'CA' },

  // 德语
  'de-DE': { name: 'Deutsch (Deutschland)', countryCode: 'DE' },
  'de-AT': { name: 'Deutsch (Österreich)', countryCode: 'AT' },
  'de-CH': { name: 'Deutsch (Schweiz)', countryCode: 'CH' },

  // 意大利语
  'it-IT': { name: 'Italiano (Italia)', countryCode: 'IT' },

  // 葡萄牙语
  'pt-BR': { name: 'Português (Brasil)', countryCode: 'BR' },
  'pt-PT': { name: 'Português (Portugal)', countryCode: 'PT' },

  // 俄语
  'ru-RU': { name: 'Русский', countryCode: 'RU' },

  // 阿拉伯语
  'ar-SA': { name: 'العربية', countryCode: 'SA' },

  // 印地语
  'hi-IN': { name: 'हिन्दी', countryCode: 'IN' },

  // 泰语
  'th-TH': { name: 'ไทย', countryCode: 'TH' },

  // 越南语
  'vi-VN': { name: 'Tiếng Việt', countryCode: 'VN' },

  // 荷兰语
  'nl-NL': { name: 'Nederlands', countryCode: 'NL' },

  // 波兰语
  'pl-PL': { name: 'Polski', countryCode: 'PL' },

  // 土耳其语
  'tr-TR': { name: 'Türkçe', countryCode: 'TR' },

  // 瑞典语
  'sv-SE': { name: 'Svenska', countryCode: 'SE' },

  // 挪威语
  'nb-NO': { name: 'Norsk', countryCode: 'NO' },

  // 丹麦语
  'da-DK': { name: 'Dansk', countryCode: 'DK' },

  // 芬兰语
  'fi-FI': { name: 'Suomi', countryCode: 'FI' },
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

/**
 * 获取所有支持的语言选项
 */
export function getAllLocaleOptions(): LocaleOption[] {
  return Object.entries(LOCALE_MAP).map(([code, info]) => ({
    code,
    name: info.name,
    countryCode: info.countryCode,
  }));
}