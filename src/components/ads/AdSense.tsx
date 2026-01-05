'use client';

import { useEffect, useRef } from 'react';
import { adsenseConfig } from '@/config/ads';

interface AdSenseProps {
  // 广告单元 ID
  adSlot: string;
  // 广告格式
  adFormat?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
  // 是否全宽响应
  fullWidthResponsive?: boolean;
  // 自定义样式
  style?: React.CSSProperties;
  // 自定义类名
  className?: string;
}

/**
 * Google AdSense 广告组件
 */
export default function AdSense({
  adSlot,
  adFormat = 'auto',
  fullWidthResponsive = true,
  style,
  className = '',
}: AdSenseProps) {
  const adRef = useRef<HTMLModElement>(null);
  const isAdLoaded = useRef(false);

  useEffect(() => {
    // 仅在启用时加载广告
    if (!adsenseConfig.enabled) {
      return;
    }

    // 防止重复加载
    if (isAdLoaded.current) {
      return;
    }

    try {
      // 推送广告请求
      const w = window as Window & { adsbygoogle?: unknown[] };
      w.adsbygoogle = w.adsbygoogle || [];
      w.adsbygoogle.push({});
      isAdLoaded.current = true;
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, []);

  // 未启用时显示占位符
  if (!adsenseConfig.enabled) {
    return (
      <div
        className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 ${className}`}
        style={{ minHeight: '100px', ...style }}
      >
        <span className="text-sm">Ad</span>
      </div>
    );
  }

  return (
    <ins
      ref={adRef}
      className={`adsbygoogle ${className}`}
      style={{ display: 'block', ...style }}
      data-ad-client={adsenseConfig.clientId}
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      data-full-width-responsive={fullWidthResponsive}
    />
  );
}