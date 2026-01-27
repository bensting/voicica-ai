'use client';

import { useEffect, useRef } from 'react';
import { getAdseterraNativeBannerConfig, isNativeBannerEnabled } from '@/config/ads/adsterra';

/**
 * Adsterra Native Banner 广告组件
 *
 * 动态加载 Adsterra 广告脚本并显示原生横幅广告
 */
export default function AdsterraNativeBanner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (!isNativeBannerEnabled()) return;
    if (scriptLoadedRef.current) return;

    const config = getAdseterraNativeBannerConfig();

    // 检查脚本是否已加载
    const existingScript = document.querySelector(`script[src="${config.scriptUrl}"]`);
    if (existingScript) {
      scriptLoadedRef.current = true;
      return;
    }

    // 动态加载广告脚本
    const script = document.createElement('script');
    script.src = config.scriptUrl;
    script.async = true;
    script.setAttribute('data-cfasync', 'false');

    script.onload = () => {
      scriptLoadedRef.current = true;
    };

    script.onerror = () => {
      console.error('[AdsterraNativeBanner] Failed to load ad script');
    };

    // 将脚本添加到容器前面
    if (containerRef.current) {
      containerRef.current.parentNode?.insertBefore(script, containerRef.current);
    } else {
      document.body.appendChild(script);
    }

    return () => {
      // 组件卸载时不移除脚本，因为可能被其他实例使用
    };
  }, []);

  if (!isNativeBannerEnabled()) return null;

  const config = getAdseterraNativeBannerConfig();

  return (
    <div className="w-full max-w-[320px] max-h-[200px] overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-2">
      <div id={config.containerId} ref={containerRef} className="w-full" />
    </div>
  );
}
