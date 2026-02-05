/**
 * IP 地理位置查询工具（服务端）
 *
 * 使用 geoip-lite 离线数据库查询 IP 所属国家
 * 保存格式：ip|country_code（如 192.168.1.1|CN）
 */

import geoip from 'geoip-lite';

/**
 * 根据 IP 查询国家代码
 */
export function getCountryCode(ip: string | null | undefined): string | null {
  if (!ip) return null;

  const geo = geoip.lookup(ip);
  return geo?.country || null;
}

/**
 * 格式化 IP 地址（包含国家代码）
 * 格式：ip|country_code
 */
export function formatIpWithCountry(ip: string | null | undefined): string | null {
  if (!ip) return null;

  const countryCode = getCountryCode(ip);
  if (countryCode) {
    return `${ip}|${countryCode}`;
  }
  return ip;
}

/**
 * 解析 IP 字段（提取 IP 和国家代码）
 */
export function parseIpField(ipField: string | null): {
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
