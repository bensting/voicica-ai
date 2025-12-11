'use client';

import { useEffect, useRef } from 'react';

// AdSense 发布商 ID（需要替换为你的实际 ID）
const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || '';

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
 *
 * 使用前需要：
 * 1. 在 .env.local 中设置 NEXT_PUBLIC_ADSENSE_CLIENT_ID
 * 2. 在 AdSense 控制台创建广告单元获取 adSlot
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
    // 仅在生产环境且有 client ID 时加载广告
    if (!ADSENSE_CLIENT_ID || process.env.NODE_ENV !== 'production') {
      return;
    }

    // 防止重复加载
    if (isAdLoaded.current) {
      return;
    }

    try {
      // 推送广告请求
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      isAdLoaded.current = true;
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, []);

  // 开发环境显示占位符
  if (!ADSENSE_CLIENT_ID || process.env.NODE_ENV !== 'production') {
    return (
      <div
        className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 ${className}`}
        style={{ minHeight: '100px', ...style }}
      >
        <span className="text-sm">广告位 (AdSlot: {adSlot})</span>
      </div>
    );
  }

  return (
    <ins
      ref={adRef}
      className={`adsbygoogle ${className}`}
      style={{ display: 'block', ...style }}
      data-ad-client={ADSENSE_CLIENT_ID}
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      data-full-width-responsive={fullWidthResponsive}
    />
  );
}