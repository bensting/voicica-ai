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
      console.error('[AdsterraNativeBanner] Failed to load script');
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
        <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-4">
            {/* Sponsored 标签 */}
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-3">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 9h6v6H9z" />
              </svg>
              <span>Sponsored · {position}</span>
            </div>

            {/* Adsterra Native Banner 容器 */}
            <div
              ref={containerRef}
              id={config.containerId}
              className="min-h-[200px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
