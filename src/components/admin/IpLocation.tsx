'use client';

/**
 * IP 地理位置显示组件
 *
 * 使用 ipapi.co 免费服务获取 IP 地理位置（HTTPS，免费 1000 次/天）
 */

import { useState } from 'react';

interface IpLocationProps {
  ip: string | null;
}

interface LocationData {
  country: string;
  countryCode: string;
  city: string;
  region: string;
}

// 缓存 IP 位置信息，避免重复请求
const locationCache = new Map<string, LocationData | null>();

// 国家代码转旗帜 emoji
const getFlagEmoji = (countryCode: string) => {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

export default function IpLocation({ ip }: IpLocationProps) {
  const [location, setLocation] = useState<LocationData | null>(() => {
    // 初始化时检查缓存
    if (ip && locationCache.has(ip)) {
      return locationCache.get(ip) || null;
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [fetched, setFetched] = useState(() => {
    // 如果缓存中有数据，标记为已获取
    return ip ? locationCache.has(ip) : false;
  });

  if (!ip) {
    return <span className="text-xs text-gray-400">-</span>;
  }

  // 点击获取位置
  const handleFetch = async () => {
    if (loading || fetched) return;

    setLoading(true);
    setError(false);

    try {
      // 使用 ipapi.co 免费服务（HTTPS，限制：1000 请求/天）
      const response = await fetch(`https://ipapi.co/${ip}/json/`);
      const data = await response.json();

      if (!data.error) {
        const locationData: LocationData = {
          country: data.country_name || '',
          countryCode: data.country_code || '',
          city: data.city || '',
          region: data.region || '',
        };
        locationCache.set(ip, locationData);
        setLocation(locationData);
      } else {
        locationCache.set(ip, null);
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setFetched(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 border border-gray-300 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-gray-400">查询中...</span>
      </div>
    );
  }

  if (fetched && (error || !location)) {
    return (
      <span className="text-xs text-gray-500" title={ip}>
        {ip}
      </span>
    );
  }

  if (location) {
    return (
      <div
        className="flex items-center gap-1.5"
        title={`${ip}\n${location.city}, ${location.region}, ${location.country}`}
      >
        <span className="text-base">{getFlagEmoji(location.countryCode)}</span>
        <span className="text-sm text-gray-700">
          {location.city || location.region || location.country}
        </span>
      </div>
    );
  }

  // 未获取时显示点击查询按钮
  return (
    <button
      onClick={handleFetch}
      className="text-xs text-purple-600 hover:text-purple-700 hover:underline"
      title={`点击查询 ${ip} 的位置`}
    >
      查询位置
    </button>
  );
}
