/**
 * 国旗 emoji 工具函数
 * 根据国家代码生成对应的国旗 emoji
 */

/**
 * 将国家代码转换为国旗 emoji
 * @param countryCode - ISO 3166-1 alpha-2 国家代码（如 'US', 'CN'）
 * @returns 国旗 emoji 字符串
 */
export function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) {
    return '🏳️'; // 默认白旗
  }

  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));

  return String.fromCodePoint(...codePoints);
}

/**
 * 获取带国旗的国家名称
 * @param countryCode - 国家代码
 * @param countryName - 国家名称
 * @returns 格式化的字符串，如 "🇺🇸 United States"
 */
export function getCountryWithFlag(countryCode: string, countryName: string): string {
  const flag = getCountryFlag(countryCode);
  return `${flag} ${countryName}`;
}