'use client';

import { useEffect, useRef } from 'react';
import { getBannerConfig, isBannerEnabled } from '@/config/ads/adsterra';

/**
 * Adsterra Banner 广告组件
 *
 * 728x90 Leaderboard 横幅广告
 */
export default function AdsterraBanner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    // 检查是否启用
    if (!isBannerEnabled()) return;

    // 防止重复加载
    if (scriptLoadedRef.current) return;

    const config = getBannerConfig();

    // 设置 atOptions 到 window
    (window as Record<string, unknown>).atOptions = {
      key: config.key,
      format: 'iframe',
      height: config.height,
      width: config.width,
      params: {},
    };

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

    script.onload = () => {
      scriptLoadedRef.current = true;
      console.log('[AdsterraBanner] Script loaded successfully');
    };

    script.onerror = () => {
      // 广告脚本加载失败是正常情况（可能被广告拦截器阻止）
      console.warn('[AdsterraBanner] Failed to load script (may be blocked by ad blocker)');
    };

    // 添加到容器
    if (containerRef.current) {
      containerRef.current.appendChild(script);
    }

    return () => {
      // 组件卸载时不移除脚本
    };
  }, []);

  // 如果未启用，返回 null
  if (!isBannerEnabled()) {
    return null;
  }

  const config = getBannerConfig();

  return (
    <div className="w-full py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <div
            ref={containerRef}
            style={{ width: config.width, height: config.height }}
            className="overflow-hidden"
          />
        </div>
      </div>
    </div>
  );
}
