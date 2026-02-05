/**
 * IP 地理位置查询工具（服务端）
 *
 * 优先使用 Vercel 提供的地理位置 headers（生产环境）
 * 本地开发使用 geoip-lite 离线数据库
 * 保存格式：ip|country_code（如 192.168.1.1|CN）
 */

import type { Lookup } from 'geoip-lite';

// 缓存 geoip 模块（本地开发用）
let geoipModule: { lookup: (ip: string) => Lookup | null } | null = null;
let geoipLoaded = false;

/**
 * 延迟加载 geoip-lite 模块（本地开发用）
 */
async function getGeoip() {
  if (geoipLoaded) return geoipModule;

  geoipLoaded = true;
  try {
    const mod = await import('geoip-lite');
    geoipModule = mod.default || mod;
    console.log('✅ geoip-lite 加载成功');
  } catch (err) {
    console.warn('⚠️ geoip-lite 加载失败，将依赖 Vercel geo headers');
    geoipModule = null;
  }
  return geoipModule;
}

/**
 * 根据 IP 查询国家代码（本地开发用）
 */
async function getCountryCodeByGeoip(ip: string): Promise<string | null> {
  try {
    const geoip = await getGeoip();
    if (!geoip) return null;

    const geo = geoip.lookup(ip);
    return geo?.country || null;
  } catch {
    return null;
  }
}

/**
 * 格式化 IP 地址（包含国家代码）
 * 格式：ip|country_code
 *
 * @param ip - IP 地址
 * @param vercelCountry - Vercel 提供的国家代码（从 x-vercel-ip-country header 获取）
 */
export async function formatIpWithCountry(
  ip: string | null | undefined,
  vercelCountry?: string | null
): Promise<string | null> {
  if (!ip) return null;

  // 优先使用 Vercel 提供的国家代码（生产环境）
  let countryCode = vercelCountry || null;

  // 如果没有 Vercel 国家代码，使用 geoip-lite（本地开发）
  if (!countryCode) {
    countryCode = await getCountryCodeByGeoip(ip);
  }

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
