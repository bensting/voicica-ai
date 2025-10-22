/**
 * 国家和语言的配置
 * 数据来源：后端 API /api/v1/enums/countries 和 /api/v1/enums/voice-languages-by-country
 * 翻译来源：src/i18n/locales/*.json
 */

/**
 * 支持的语言代码列表
 * 从后端 API 获取：/api/v1/enums/voice-languages-by-country
 */
export const SUPPORTED_LANGUAGES = [
  'af', 'am', 'ar', 'as', 'az', 'bg', 'bn', 'bs', 'ca', 'cs', 'cy', 'da', 'de', 'el',
  'en', 'es', 'et', 'eu', 'fa', 'fi', 'fil', 'fr', 'ga', 'gl', 'gu', 'he', 'hi', 'hr',
  'hu', 'hy', 'id', 'is', 'it', 'iu', 'ja', 'jv', 'ka', 'kk', 'km', 'kn', 'ko', 'lo',
  'lt', 'lv', 'mk', 'ml', 'mn', 'mr', 'ms', 'mt', 'my', 'nb', 'ne', 'nl', 'or', 'pa',
  'pl', 'ps', 'pt', 'ro', 'ru', 'si', 'sk', 'sl', 'so', 'sq', 'sr', 'su', 'sv', 'sw',
  'ta', 'te', 'th', 'tr', 'uk', 'ur', 'uz', 'vi', 'wuu', 'yue', 'zh', 'zu'
] as const;

/**
 * 支持的国家代码列表
 * 从后端 API 获取：/api/v1/enums/countries
 */
export const SUPPORTED_COUNTRIES = [
  'AE', 'AF', 'AL', 'AM', 'AR', 'AT', 'AU', 'AZ', 'BA', 'BD', 'BE', 'BG', 'BH', 'BO',
  'BR', 'CA', 'CH', 'CL', 'CN', 'CO', 'CR', 'CU', 'CY', 'CZ', 'DE', 'DK', 'DO', 'DZ',
  'EC', 'EE', 'EG', 'ES', 'ET', 'FI', 'FR', 'GB', 'GE', 'GR', 'HK', 'HR', 'HU', 'ID',
  'IE', 'IL', 'IN', 'IQ', 'IR', 'IS', 'IT', 'JO', 'JP', 'KE', 'KH', 'KR', 'KW', 'KZ',
  'LB', 'LK', 'LT', 'LV', 'LY', 'MA', 'MM', 'MN', 'MT', 'MX', 'MY', 'NG', 'NL', 'NO',
  'NP', 'NZ', 'OM', 'PE', 'PH', 'PK', 'PL', 'PT', 'QA', 'RO', 'RS', 'RU', 'SA', 'SE',
  'SG', 'SI', 'SK', 'SY', 'TH', 'TN', 'TR', 'TW', 'TZ', 'UA', 'UK', 'US', 'UY', 'UZ',
  'VE', 'VN', 'YE', 'ZA'
] as const;

/**
 * 国家与语言的映射关系
 * 需要根据实际的 voice 数据来维护这个映射
 */
export const COUNTRY_LANGUAGE_MAP: Record<string, string[]> = {
  // 这个映射需要根据实际数据库中的 voice 来填充
  // 暂时使用常见的映射关系
  'US': ['en'],
  'GB': ['en'],
  'UK': ['en'],
  'CA': ['en', 'fr'],
  'AU': ['en'],
  'NZ': ['en'],
  'IE': ['en'],
  'CN': ['zh', 'wuu', 'yue'],
  'HK': ['zh', 'yue'],
  'TW': ['zh'],
  'JP': ['ja'],
  'KR': ['ko'],
  'FR': ['fr'],
  'DE': ['de'],
  'IT': ['it'],
  'ES': ['es'],
  'PT': ['pt'],
  'BR': ['pt'],
  'RU': ['ru'],
  'IN': ['hi', 'en', 'bn', 'te', 'mr', 'ta', 'gu', 'kn', 'ml', 'or', 'pa', 'as'],
  'MX': ['es'],
  'AR': ['es'],
  'CL': ['es'],
  'CO': ['es'],
  'PE': ['es'],
  'VE': ['es'],
  'NL': ['nl'],
  'BE': ['nl', 'fr'],
  'CH': ['de', 'fr', 'it'],
  'AT': ['de'],
  'SE': ['sv'],
  'NO': ['nb'],
  'DK': ['da'],
  'FI': ['fi'],
  'PL': ['pl'],
  'CZ': ['cs'],
  'GR': ['el'],
  'TR': ['tr'],
  'TH': ['th'],
  'VN': ['vi'],
  'ID': ['id'],
  'MY': ['ms'],
  'PH': ['fil', 'en'],
  'SG': ['en', 'zh'],
  'SA': ['ar'],
  'AE': ['ar'],
  'EG': ['ar'],
  'IL': ['he'],
  'ZA': ['en', 'af', 'zu'],
  'UA': ['uk'],
  'RO': ['ro'],
  'HU': ['hu'],
  'BG': ['bg'],
  'HR': ['hr'],
  'RS': ['sr'],
  'SK': ['sk'],
  'SI': ['sl'],
  'LT': ['lt'],
  'LV': ['lv'],
  'EE': ['et'],
  'IS': ['is'],
  'MT': ['mt'],
  'CY': ['el', 'tr'],
  'GE': ['ka'],
  'AM': ['hy'],
  'AZ': ['az'],
  'KZ': ['kk', 'ru'],
  'UZ': ['uz'],
  'MN': ['mn'],
  'BD': ['bn'],
  'PK': ['ur'],
  'AF': ['ps', 'fa'],
  'IR': ['fa'],
  'IQ': ['ar'],
  'SY': ['ar'],
  'LB': ['ar'],
  'JO': ['ar'],
  'KW': ['ar'],
  'QA': ['ar'],
  'BH': ['ar'],
  'OM': ['ar'],
  'YE': ['ar'],
  'LY': ['ar'],
  'TN': ['ar'],
  'DZ': ['ar'],
  'MA': ['ar'],
  'LK': ['si'],
  'MM': ['my'],
  'KH': ['km'],
  'NP': ['ne'],
  'ET': ['am'],
  'KE': ['sw'],
  'NG': ['en'],
  'TZ': ['sw'],
  'BA': ['bs'],
  'AL': ['sq'],
  'BO': ['es'],
  'CR': ['es'],
  'CU': ['es'],
  'DO': ['es'],
  'EC': ['es'],
  'UY': ['es'],
};

/**
 * 根据国家代码获取该国家支持的语言列表
 */
export function getLanguagesByCountry(countryCode: string): string[] {
  return COUNTRY_LANGUAGE_MAP[countryCode] || [];
}

/**
 * 获取所有国家代码列表
 */
export function getAllCountryCodes(): string[] {
  return [...SUPPORTED_COUNTRIES];
}

/**
 * 获取所有语言代码列表
 */
export function getAllLanguageCodes(): string[] {
  return [...SUPPORTED_LANGUAGES];
}