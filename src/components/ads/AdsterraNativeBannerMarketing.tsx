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
 * PC端横向排列，移动端竖向排列
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
        {/* Adsterra Native Banner 容器 */}
        {/* 使用 CSS Grid 强制 PC 端横向排列，移动端单列 */}
        <div
          ref={containerRef}
          id={config.containerId}
          className="w-full native-banner-grid"
        />
      </div>
      {/*
        CSS 用于覆盖 Adsterra 注入的广告布局
        Adsterra 会在容器内注入多个广告卡片，默认可能是竖向排列
        这里使用 CSS 强制在 PC 端横向排列
      */}
      <style jsx global>{`
        /* Native Banner Grid Layout */
        .native-banner-grid {
          display: grid !important;
          grid-template-columns: 1fr;
          gap: 16px;
        }

        /* 平板端: 2 列 */
        @media (min-width: 640px) {
          .native-banner-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        /* PC 端: 4 列 */
        @media (min-width: 1024px) {
          .native-banner-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        /* Adsterra 注入的广告卡片样式 */
        .native-banner-grid > * {
          width: 100% !important;
          max-width: 100% !important;
        }
      `}</style>
    </div>
  );
}
