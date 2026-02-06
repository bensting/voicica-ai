'use client';

/**
 * Adsterra Native Banner 广告组件
 *
 * 使用 Adsterra 的网页 Native Banner 广告
 * 点击可以正常跳转，无需原生插件
 */

import { useEffect, useRef, useState } from 'react';
import BannerCarousel from './BannerCarousel';

// Adsterra 广告配置
const ADSTERRA_CONFIG = {
  scriptSrc: 'https://pl28577351.effectivegatecpm.com/681184527acc76cbc3fea2492006189f/invoke.js',
  containerId: 'container-681184527acc76cbc3fea2492006189f',
};

export default function AdsterraBanner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    // 防止重复加载
    if (scriptLoadedRef.current) return;

    // 检查是否已经存在脚本
    const existingScript = document.querySelector(`script[src="${ADSTERRA_CONFIG.scriptSrc}"]`);
    if (existingScript) {
      scriptLoadedRef.current = true;
      setLoaded(true);
      return;
    }

    // 动态加载 Adsterra 脚本
    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src = ADSTERRA_CONFIG.scriptSrc;

    script.onload = () => {
      setLoaded(true);
    };

    script.onerror = () => {
      setError(true);
    };

    // 插入脚本到容器
    if (containerRef.current) {
      containerRef.current.appendChild(script);
      scriptLoadedRef.current = true;
    }

    return () => {
      // 组件卸载时不移除脚本，因为广告可能还在显示
    };
  }, []);

  // 加载失败时显示 BannerCarousel
  if (error) {
    return <BannerCarousel />;
  }

  return (
    <div className="px-4">
      {/* 广告样式覆盖 */}
      <style>{`
        #${ADSTERRA_CONFIG.containerId} > div {
          display: block !important;
          grid-template-columns: 1fr !important;
        }
        #${ADSTERRA_CONFIG.containerId} > div > div:not(:first-child) {
          display: none !important;
        }
        /* 缩小字体 */
        #${ADSTERRA_CONFIG.containerId} *,
        #${ADSTERRA_CONFIG.containerId} a,
        #${ADSTERRA_CONFIG.containerId} span,
        #${ADSTERRA_CONFIG.containerId} div,
        #${ADSTERRA_CONFIG.containerId} p {
          font-size: 10px !important;
          line-height: 1.3 !important;
        }
      `}</style>
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-2xl p-[3px] bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500"
      >
        {/* Adsterra 广告容器 */}
        <div id={ADSTERRA_CONFIG.containerId} className="rounded-xl overflow-hidden bg-gray-900"></div>

        {/* 加载占位 */}
        {!loaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-2xl animate-pulse min-h-[100px]" />
        )}
      </div>
    </div>
  );
}
