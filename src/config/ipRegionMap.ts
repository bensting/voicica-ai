/**
 * IP 地理位置查询
 *
 * 使用 geoip-lite 离线数据库查询 IP 所属国家
 */

import geoip from 'geoip-lite';

interface RegionInfo {
  country: string;
  countryCode: string;
  city?: string;
}

// 国家代码到国家名的映射（常见国家）
const countryNames: Record<string, string> = {
  CN: 'China',
  US: 'United States',
  JP: 'Japan',
  KR: 'South Korea',
  TW: 'Taiwan',
  HK: 'Hong Kong',
  SG: 'Singapore',
  MY: 'Malaysia',
  TH: 'Thailand',
  VN: 'Vietnam',
  ID: 'Indonesia',
  PH: 'Philippines',
  IN: 'India',
  AU: 'Australia',
  NZ: 'New Zealand',
  GB: 'United Kingdom',
  DE: 'Germany',
  FR: 'France',
  IT: 'Italy',
  ES: 'Spain',
  NL: 'Netherlands',
  BE: 'Belgium',
  CH: 'Switzerland',
  AT: 'Austria',
  SE: 'Sweden',
  NO: 'Norway',
  DK: 'Denmark',
  FI: 'Finland',
  PL: 'Poland',
  RU: 'Russia',
  UA: 'Ukraine',
  CA: 'Canada',
  MX: 'Mexico',
  BR: 'Brazil',
  AR: 'Argentina',
  CL: 'Chile',
  CO: 'Colombia',
  PE: 'Peru',
  ZA: 'South Africa',
  EG: 'Egypt',
  NG: 'Nigeria',
  KE: 'Kenya',
  AE: 'UAE',
  SA: 'Saudi Arabia',
  IL: 'Israel',
  TR: 'Turkey',
  IR: 'Iran',
  PK: 'Pakistan',
  BD: 'Bangladesh',
};

// 国家代码转旗帜 emoji
export function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

/**
 * 根据 IP 地址获取地区信息
 */
export function getRegionByIp(ip: string | null): RegionInfo | null {
  if (!ip) return null;

  const geo = geoip.lookup(ip);
  if (!geo || !geo.country) return null;

  return {
    country: countryNames[geo.country] || geo.country,
    countryCode: geo.country,
    city: geo.city || undefined,
  };
}
