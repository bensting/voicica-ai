'use client';

import { useEffect, useRef } from 'react';
import { getAdseterraNativeBannerConfig, isNativeBannerEnabled } from '@/config/ads/adsterra';

interface AdsterraNativeBannerMarketingProps {
  /** 广告位置标识（用于调试） */
  position?: string;
}

/**
 * Adsterra Native Banner 广告组件 (Marketing 页面专用)
 *
 * 显示 4 个卡片样式的原生广告
 */
export default function AdsterraNativeBannerMarketing({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  position = 'Below Hero'
}: AdsterraNativeBannerMarketingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    // 检查是否启用
    if (!isNativeBannerEnabled()) return;

    // 防止重复加载
    if (scriptLoadedRef.current) return;

    const config = getAdseterraNativeBannerConfig();

    // 检查脚本是否已存在
    const existingScript = document.querySelector(`script[src="${config.scriptUrl}"]`);
    if (existingScript) {
      scriptLoadedRef.current = true;
      return;
    }

    // 创建并加载脚本
    const script = document.createElement('script');
    script.src = config.scriptUrl;
    script.async = true;
    script.setAttribute('data-cfasync', 'false');

    script.onload = () => {
      scriptLoadedRef.current = true;
      console.log('[AdsterraNativeBanner] Script loaded successfully');
    };

    script.onerror = () => {
      // 广告脚本加载失败是正常情况（可能被广告拦截器阻止）
      console.warn('[AdsterraNativeBanner] Failed to load script (may be blocked by ad blocker)');
    };

    // 添加到 body
    document.body.appendChild(script);

    return () => {
      // 组件卸载时不移除脚本
    };
  }, []);

  // 如果未启用，返回 null
  if (!isNativeBannerEnabled()) {
    return null;
  }

  const config = getAdseterraNativeBannerConfig();

  return (
    <div className="w-full py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Adsterra Native Banner 容器 - 给予足够宽度让广告横向排列 */}
        <div
          ref={containerRef}
          id={config.containerId}
          className="w-full"
        />
      </div>
    </div>
  );
}
