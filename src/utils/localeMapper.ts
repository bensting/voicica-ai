import { LocaleOption } from '@/types/config';

/**
 * 语言代码到显示信息的映射
 * 使用 ISO 3166-1 alpha-2 国家代码来渲染国旗图标
 * 支持 Microsoft Azure TTS 所有可用语言区域
 */
const LOCALE_MAP: Record<string, { name: string; countryCode: string }> = {
  // === 非洲南荷兰语 (Afrikaans) ===
  'af-ZA': { name: 'Afrikaans (South Africa)', countryCode: 'ZA' },

  // === 阿姆哈拉语 (Amharic) ===
  'am-ET': { name: 'አማርኛ (Ethiopia)', countryCode: 'ET' },

  // === 阿拉伯语 (Arabic) ===
  'ar-AE': { name: 'العربية (United Arab Emirates)', countryCode: 'AE' },
  'ar-BH': { name: 'العربية (Bahrain)', countryCode: 'BH' },
  'ar-DZ': { name: 'العربية (Algeria)', countryCode: 'DZ' },
  'ar-EG': { name: 'العربية (Egypt)', countryCode: 'EG' },
  'ar-IQ': { name: 'العربية (Iraq)', countryCode: 'IQ' },
  'ar-JO': { name: 'العربية (Jordan)', countryCode: 'JO' },
  'ar-KW': { name: 'العربية (Kuwait)', countryCode: 'KW' },
  'ar-LB': { name: 'العربية (Lebanon)', countryCode: 'LB' },
  'ar-LY': { name: 'العربية (Libya)', countryCode: 'LY' },
  'ar-MA': { name: 'العربية (Morocco)', countryCode: 'MA' },
  'ar-OM': { name: 'العربية (Oman)', countryCode: 'OM' },
  'ar-QA': { name: 'العربية (Qatar)', countryCode: 'QA' },
  'ar-SA': { name: 'العربية (Saudi Arabia)', countryCode: 'SA' },
  'ar-SY': { name: 'العربية (Syria)', countryCode: 'SY' },
  'ar-TN': { name: 'العربية (Tunisia)', countryCode: 'TN' },
  'ar-YE': { name: 'العربية (Yemen)', countryCode: 'YE' },

  // === 阿萨姆语 (Assamese) ===
  'as-IN': { name: 'অসমীয়া (India)', countryCode: 'IN' },

  // === 阿塞拜疆语 (Azerbaijani) ===
  'az-AZ': { name: 'Azərbaycan (Azerbaijan)', countryCode: 'AZ' },

  // === 保加利亚语 (Bulgarian) ===
  'bg-BG': { name: 'Български (Bulgaria)', countryCode: 'BG' },

  // === 孟加拉语 (Bengali) ===
  'bn-BD': { name: 'বাংলা (Bangladesh)', countryCode: 'BD' },
  'bn-IN': { name: 'বাংলা (India)', countryCode: 'IN' },

  // === 波斯尼亚语 (Bosnian) ===
  'bs-BA': { name: 'Bosanski (Bosnia and Herzegovina)', countryCode: 'BA' },

  // === 加泰罗尼亚语 (Catalan) ===
  'ca-ES': { name: 'Català (Spain)', countryCode: 'ES' },

  // === 捷克语 (Czech) ===
  'cs-CZ': { name: 'Čeština (Czech Republic)', countryCode: 'CZ' },

  // === 威尔士语 (Welsh) ===
  'cy-GB': { name: 'Cymraeg (United Kingdom)', countryCode: 'GB' },

  // === 丹麦语 (Danish) ===
  'da-DK': { name: 'Dansk (Denmark)', countryCode: 'DK' },

  // === 德语 (German) ===
  'de-AT': { name: 'Deutsch (Austria)', countryCode: 'AT' },
  'de-CH': { name: 'Deutsch (Switzerland)', countryCode: 'CH' },
  'de-DE': { name: 'Deutsch (Germany)', countryCode: 'DE' },

  // === 希腊语 (Greek) ===
  'el-GR': { name: 'Ελληνικά (Greece)', countryCode: 'GR' },

  // === 英语 (English) ===
  'en-AU': { name: 'English (Australia)', countryCode: 'AU' },
  'en-CA': { name: 'English (Canada)', countryCode: 'CA' },
  'en-GB': { name: 'English (United Kingdom)', countryCode: 'GB' },
  'en-HK': { name: 'English (Hong Kong)', countryCode: 'HK' },
  'en-IE': { name: 'English (Ireland)', countryCode: 'IE' },
  'en-IN': { name: 'English (India)', countryCode: 'IN' },
  'en-KE': { name: 'English (Kenya)', countryCode: 'KE' },
  'en-NG': { name: 'English (Nigeria)', countryCode: 'NG' },
  'en-NZ': { name: 'English (New Zealand)', countryCode: 'NZ' },
  'en-PH': { name: 'English (Philippines)', countryCode: 'PH' },
  'en-SG': { name: 'English (Singapore)', countryCode: 'SG' },
  'en-TZ': { name: 'English (Tanzania)', countryCode: 'TZ' },
  'en-US': { name: 'English (United States)', countryCode: 'US' },
  'en-ZA': { name: 'English (South Africa)', countryCode: 'ZA' },

  // === 西班牙语 (Spanish) ===
  'es-AR': { name: 'Español (Argentina)', countryCode: 'AR' },
  'es-BO': { name: 'Español (Bolivia)', countryCode: 'BO' },
  'es-CL': { name: 'Español (Chile)', countryCode: 'CL' },
  'es-CO': { name: 'Español (Colombia)', countryCode: 'CO' },
  'es-CR': { name: 'Español (Costa Rica)', countryCode: 'CR' },
  'es-CU': { name: 'Español (Cuba)', countryCode: 'CU' },
  'es-DO': { name: 'Español (Dominican Republic)', countryCode: 'DO' },
  'es-EC': { name: 'Español (Ecuador)', countryCode: 'EC' },
  'es-ES': { name: 'Español (Spain)', countryCode: 'ES' },
  'es-GQ': { name: 'Español (Equatorial Guinea)', countryCode: 'GQ' },
  'es-GT': { name: 'Español (Guatemala)', countryCode: 'GT' },
  'es-HN': { name: 'Español (Honduras)', countryCode: 'HN' },
  'es-MX': { name: 'Español (Mexico)', countryCode: 'MX' },
  'es-NI': { name: 'Español (Nicaragua)', countryCode: 'NI' },
  'es-PA': { name: 'Español (Panama)', countryCode: 'PA' },
  'es-PE': { name: 'Español (Peru)', countryCode: 'PE' },
  'es-PR': { name: 'Español (Puerto Rico)', countryCode: 'PR' },
  'es-PY': { name: 'Español (Paraguay)', countryCode: 'PY' },
  'es-SV': { name: 'Español (El Salvador)', countryCode: 'SV' },
  'es-US': { name: 'Español (United States)', countryCode: 'US' },
  'es-UY': { name: 'Español (Uruguay)', countryCode: 'UY' },
  'es-VE': { name: 'Español (Venezuela)', countryCode: 'VE' },

  // === 爱沙尼亚语 (Estonian) ===
  'et-EE': { name: 'Eesti (Estonia)', countryCode: 'EE' },

  // === 巴斯克语 (Basque) ===
  'eu-ES': { name: 'Euskara (Spain)', countryCode: 'ES' },

  // === 波斯语 (Persian) ===
  'fa-IR': { name: 'فارسی (Iran)', countryCode: 'IR' },

  // === 芬兰语 (Finnish) ===
  'fi-FI': { name: 'Suomi (Finland)', countryCode: 'FI' },

  // === 菲律宾语 (Filipino) ===
  'fil-PH': { name: 'Filipino (Philippines)', countryCode: 'PH' },

  // === 法语 (French) ===
  'fr-BE': { name: 'Français (Belgium)', countryCode: 'BE' },
  'fr-CA': { name: 'Français (Canada)', countryCode: 'CA' },
  'fr-CH': { name: 'Français (Switzerland)', countryCode: 'CH' },
  'fr-FR': { name: 'Français (France)', countryCode: 'FR' },

  // === 爱尔兰语 (Irish) ===
  'ga-IE': { name: 'Gaeilge (Ireland)', countryCode: 'IE' },

  // === 加利西亚语 (Galician) ===
  'gl-ES': { name: 'Galego (Spain)', countryCode: 'ES' },

  // === 古吉拉特语 (Gujarati) ===
  'gu-IN': { name: 'ગુજરાતી (India)', countryCode: 'IN' },

  // === 希伯来语 (Hebrew) ===
  'he-IL': { name: 'עברית (Israel)', countryCode: 'IL' },

  // === 印地语 (Hindi) ===
  'hi-IN': { name: 'हिन्दी (India)', countryCode: 'IN' },

  // === 克罗地亚语 (Croatian) ===
  'hr-HR': { name: 'Hrvatski (Croatia)', countryCode: 'HR' },

  // === 匈牙利语 (Hungarian) ===
  'hu-HU': { name: 'Magyar (Hungary)', countryCode: 'HU' },

  // === 亚美尼亚语 (Armenian) ===
  'hy-AM': { name: 'Հdelays (Armenia)', countryCode: 'AM' },

  // === 印度尼西亚语 (Indonesian) ===
  'id-ID': { name: 'Bahasa Indonesia (Indonesia)', countryCode: 'ID' },

  // === 冰岛语 (Icelandic) ===
  'is-IS': { name: 'Íslenska (Iceland)', countryCode: 'IS' },

  // === 意大利语 (Italian) ===
  'it-IT': { name: 'Italiano (Italy)', countryCode: 'IT' },

  // === 因纽特语 (Inuktitut) ===
  'iu-Cans-CA': { name: 'ᐃᓄᒃᑎᑐᑦ (Canada)', countryCode: 'CA' },
  'iu-Latn-CA': { name: 'Inuktitut (Canada)', countryCode: 'CA' },

  // === 日语 (Japanese) ===
  'ja-JP': { name: '日本語 (Japan)', countryCode: 'JP' },

  // === 爪哇语 (Javanese) ===
  'jv-ID': { name: 'Basa Jawa (Indonesia)', countryCode: 'ID' },

  // === 格鲁吉亚语 (Georgian) ===
  'ka-GE': { name: 'ქართული (Georgia)', countryCode: 'GE' },

  // === 哈萨克语 (Kazakh) ===
  'kk-KZ': { name: 'Қазақ (Kazakhstan)', countryCode: 'KZ' },

  // === 高棉语 (Khmer) ===
  'km-KH': { name: 'ភាសាខ្មែរ (Cambodia)', countryCode: 'KH' },

  // === 卡纳达语 (Kannada) ===
  'kn-IN': { name: 'ಕನ್ನಡ (India)', countryCode: 'IN' },

  // === 韩语 (Korean) ===
  'ko-KR': { name: '한국어 (South Korea)', countryCode: 'KR' },

  // === 老挝语 (Lao) ===
  'lo-LA': { name: 'ລາວ (Laos)', countryCode: 'LA' },

  // === 立陶宛语 (Lithuanian) ===
  'lt-LT': { name: 'Lietuvių (Lithuania)', countryCode: 'LT' },

  // === 拉脱维亚语 (Latvian) ===
  'lv-LV': { name: 'Latviešu (Latvia)', countryCode: 'LV' },

  // === 马其顿语 (Macedonian) ===
  'mk-MK': { name: 'Македонски (North Macedonia)', countryCode: 'MK' },

  // === 马拉雅拉姆语 (Malayalam) ===
  'ml-IN': { name: 'മലയാളം (India)', countryCode: 'IN' },

  // === 蒙古语 (Mongolian) ===
  'mn-MN': { name: 'Монгол (Mongolia)', countryCode: 'MN' },

  // === 马拉地语 (Marathi) ===
  'mr-IN': { name: 'मराठी (India)', countryCode: 'IN' },

  // === 马来语 (Malay) ===
  'ms-MY': { name: 'Bahasa Melayu (Malaysia)', countryCode: 'MY' },

  // === 马耳他语 (Maltese) ===
  'mt-MT': { name: 'Malti (Malta)', countryCode: 'MT' },

  // === 缅甸语 (Burmese) ===
  'my-MM': { name: 'မြန်မာ (Myanmar)', countryCode: 'MM' },

  // === 挪威语 (Norwegian Bokmål) ===
  'nb-NO': { name: 'Norsk Bokmål (Norway)', countryCode: 'NO' },

  // === 尼泊尔语 (Nepali) ===
  'ne-NP': { name: 'नेपाली (Nepal)', countryCode: 'NP' },

  // === 荷兰语 (Dutch) ===
  'nl-BE': { name: 'Nederlands (Belgium)', countryCode: 'BE' },
  'nl-NL': { name: 'Nederlands (Netherlands)', countryCode: 'NL' },

  // === 奥里亚语 (Odia) ===
  'or-IN': { name: 'ଓଡ଼ିଆ (India)', countryCode: 'IN' },

  // === 旁遮普语 (Punjabi) ===
  'pa-IN': { name: 'ਪੰਜਾਬੀ (India)', countryCode: 'IN' },

  // === 波兰语 (Polish) ===
  'pl-PL': { name: 'Polski (Poland)', countryCode: 'PL' },

  // === 普什图语 (Pashto) ===
  'ps-AF': { name: 'پښتو (Afghanistan)', countryCode: 'AF' },

  // === 葡萄牙语 (Portuguese) ===
  'pt-BR': { name: 'Português (Brazil)', countryCode: 'BR' },
  'pt-PT': { name: 'Português (Portugal)', countryCode: 'PT' },

  // === 罗马尼亚语 (Romanian) ===
  'ro-RO': { name: 'Română (Romania)', countryCode: 'RO' },

  // === 俄语 (Russian) ===
  'ru-RU': { name: 'Русский (Russia)', countryCode: 'RU' },

  // === 僧伽罗语 (Sinhala) ===
  'si-LK': { name: 'සිංහල (Sri Lanka)', countryCode: 'LK' },

  // === 斯洛伐克语 (Slovak) ===
  'sk-SK': { name: 'Slovenčina (Slovakia)', countryCode: 'SK' },

  // === 斯洛文尼亚语 (Slovenian) ===
  'sl-SI': { name: 'Slovenščina (Slovenia)', countryCode: 'SI' },

  // === 索马里语 (Somali) ===
  'so-SO': { name: 'Soomaali (Somalia)', countryCode: 'SO' },

  // === 阿尔巴尼亚语 (Albanian) ===
  'sq-AL': { name: 'Shqip (Albania)', countryCode: 'AL' },

  // === 塞尔维亚语 (Serbian) ===
  'sr-Latn-RS': { name: 'Srpski (Serbia)', countryCode: 'RS' },
  'sr-RS': { name: 'Српски (Serbia)', countryCode: 'RS' },

  // === 巽他语 (Sundanese) ===
  'su-ID': { name: 'Basa Sunda (Indonesia)', countryCode: 'ID' },

  // === 瑞典语 (Swedish) ===
  'sv-SE': { name: 'Svenska (Sweden)', countryCode: 'SE' },

  // === 斯瓦希里语 (Swahili) ===
  'sw-KE': { name: 'Kiswahili (Kenya)', countryCode: 'KE' },
  'sw-TZ': { name: 'Kiswahili (Tanzania)', countryCode: 'TZ' },

  // === 泰米尔语 (Tamil) ===
  'ta-IN': { name: 'தமிழ் (India)', countryCode: 'IN' },
  'ta-LK': { name: 'தமிழ் (Sri Lanka)', countryCode: 'LK' },
  'ta-MY': { name: 'தமிழ் (Malaysia)', countryCode: 'MY' },
  'ta-SG': { name: 'தமிழ் (Singapore)', countryCode: 'SG' },

  // === 泰卢固语 (Telugu) ===
  'te-IN': { name: 'తెలుగు (India)', countryCode: 'IN' },

  // === 泰语 (Thai) ===
  'th-TH': { name: 'ไทย (Thailand)', countryCode: 'TH' },

  // === 土耳其语 (Turkish) ===
  'tr-TR': { name: 'Türkçe (Turkey)', countryCode: 'TR' },

  // === 乌克兰语 (Ukrainian) ===
  'uk-UA': { name: 'Українська (Ukraine)', countryCode: 'UA' },

  // === 乌尔都语 (Urdu) ===
  'ur-IN': { name: 'اردو (India)', countryCode: 'IN' },
  'ur-PK': { name: 'اردو (Pakistan)', countryCode: 'PK' },

  // === 乌兹别克语 (Uzbek) ===
  'uz-UZ': { name: "O'zbek (Uzbekistan)", countryCode: 'UZ' },

  // === 越南语 (Vietnamese) ===
  'vi-VN': { name: 'Tiếng Việt (Vietnam)', countryCode: 'VN' },

  // === 吴语 (Wu Chinese) ===
  'wuu-CN': { name: '吴语 (China)', countryCode: 'CN' },

  // === 粤语 (Cantonese) ===
  'yue-CN': { name: '粤语 (China)', countryCode: 'CN' },

  // === 中文 (Chinese) ===
  'zh-CN': { name: '简体中文 (China)', countryCode: 'CN' },
  'zh-CN-guangxi': { name: '简体中文 (Guangxi)', countryCode: 'CN' },
  'zh-CN-henan': { name: '简体中文 (Henan)', countryCode: 'CN' },
  'zh-CN-liaoning': { name: '简体中文 (Liaoning)', countryCode: 'CN' },
  'zh-CN-shaanxi': { name: '简体中文 (Shaanxi)', countryCode: 'CN' },
  'zh-CN-shandong': { name: '简体中文 (Shandong)', countryCode: 'CN' },
  'zh-CN-sichuan': { name: '简体中文 (Sichuan)', countryCode: 'CN' },
  'zh-HK': { name: '粤語 (Hong Kong)', countryCode: 'HK' },
  'zh-TW': { name: '繁體中文 (Taiwan)', countryCode: 'TW' },

  // === 祖鲁语 (Zulu) ===
  'zu-ZA': { name: 'IsiZulu (South Africa)', countryCode: 'ZA' },
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