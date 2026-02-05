/**
 * IP 地理位置工具（服务端）
 *
 * 使用 Vercel 提供的地理位置 headers（x-vercel-ip-country）
 * 保存格式：ip|country_code（如 192.168.1.1|CN）
 */

/**
 * 格式化 IP 地址（包含国家代码）
 * 格式：ip|country_code
 *
 * @param ip - IP 地址
 * @param vercelCountry - Vercel 提供的国家代码（从 x-vercel-ip-country header 获取）
 */
export function formatIpWithCountry(
  ip: string | null | undefined,
  vercelCountry?: string | null
): string | null {
  if (!ip) return null;

  if (vercelCountry) {
    return `${ip}|${vercelCountry}`;
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
