'use client';

/**
 * IP 地理位置显示组件
 *
 * 解析 ip|country_code 格式的 IP 字段
 * 显示国旗和国家名称
 */

interface IpLocationProps {
  ip: string | null;
}

// 国家代码到国家名的映射
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
function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// 解析 ip|country_code 格式
function parseIpField(ipField: string | null): {
  ip: string | null;
  countryCode: string | null;
} {
  if (!ipField) {
    return { ip: null, countryCode: null };
  }

  const parts = ipField.split('|');
  return {
    ip: parts[0] || null,
    countryCode: parts[1] || null,
  };
}

export default function IpLocation({ ip }: IpLocationProps) {
  if (!ip) {
    return <span className="text-xs text-gray-400">-</span>;
  }

  const { ip: ipAddress, countryCode } = parseIpField(ip);

  if (countryCode) {
    const countryName = countryNames[countryCode] || countryCode;
    const title = `${ipAddress}\n${countryName}`;

    return (
      <div className="flex items-center gap-1.5" title={title}>
        <span className="text-base">{getFlagEmoji(countryCode)}</span>
        <span className="text-sm text-gray-700">{countryName}</span>
      </div>
    );
  }

  // 没有国家代码，只显示 IP
  return (
    <span className="text-xs text-gray-500" title={ipAddress || ip}>
      {ipAddress || ip}
    </span>
  );
}
