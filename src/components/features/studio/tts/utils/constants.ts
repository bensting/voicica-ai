/**
 * 每种语言的优先国家列表配置
 */
export const PRIORITY_COUNTRIES: Record<string, string[]> = {
  'en': ['US', 'GB'],
  'zh-CN': ['CN', 'HK', 'TW', 'US', 'GB'],
  'zh-TW': ['TW', 'CN', 'HK', 'US', 'GB'],
};

/**
 * 国家代码映射（用于特殊情况）
 */
export const COUNTRY_CODE_MAP: Record<string, string> = {
  'UK': 'GB',
};
