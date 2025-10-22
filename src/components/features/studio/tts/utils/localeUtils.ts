/**
 * 从 locale 提取语言代码（例如：en-US -> en）
 */
export function getLanguageFromLocale(locale: string): string {
  return locale.split('-')[0].toLowerCase();
}

/**
 * 从 locale 提取国家代码（例如：en-US -> US）
 */
export function getCountryFromLocale(locale: string): string {
  const parts = locale.split('-');
  if (parts.length >= 2) {
    // 处理特殊格式如 zh-CN-sichuan
    return parts[1].toUpperCase();
  }
  return '';
}
