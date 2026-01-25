'use client';

import Link from 'next/link';

interface AppDownloadButtonsProps {
  /** 显示变体：dark 深色背景，light 浅色背景 */
  variant?: 'dark' | 'light';
  /** 是否显示 Web Version 链接 */
  showWebLink?: boolean;
  /** Web Version 链接地址 */
  webLinkHref?: string;
  /** 自定义类名 */
  className?: string;
}

// Google Play 图标
const GooglePlayIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
  </svg>
);

// Apple 图标
const AppleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

// 箭头图标
const ArrowRightIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);

/**
 * 应用下载按钮组件
 * 可复用于多个页面，展示 Google Play 和 App Store 下载链接
 */
export default function AppDownloadButtons({
  variant = 'dark',
  showWebLink = true,
  webLinkHref = '/studio',
  className = '',
}: AppDownloadButtonsProps) {
  const isDark = variant === 'dark';

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* 下载按钮行 */}
      <div className="flex flex-wrap items-start justify-center gap-3">
        {/* Google Play */}
        <a
          href="https://play.google.com/store/apps/details?id=ai.voicica.app"
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all hover:scale-105 ${
            isDark
              ? 'bg-black border-gray-700 text-white hover:border-gray-500'
              : 'bg-black border-gray-300 text-white hover:border-gray-400'
          }`}
        >
          <GooglePlayIcon />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wide opacity-80">Get it on</span>
            <span className="text-sm font-semibold -mt-0.5">Google Play</span>
          </div>
        </a>

        {/* App Store + Coming Soon */}
        <div className="flex flex-col items-center">
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border ${
              isDark
                ? 'bg-gray-800/50 border-gray-700 text-gray-400'
                : 'bg-gray-100 border-gray-300 text-gray-500'
            }`}
          >
            <AppleIcon />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wide opacity-80">Download on the</span>
              <span className="text-sm font-semibold -mt-0.5">App Store</span>
            </div>
          </div>
          {/* Coming Soon 文字 */}
          <span className={`text-xs mt-1.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            iOS Coming Soon
          </span>
        </div>
      </div>

      {/* Web Version 链接 */}
      {showWebLink && (
        <Link
          href={webLinkHref}
          className={`flex items-center gap-1.5 text-base font-medium transition-colors ${
            isDark
              ? 'text-gray-300 hover:text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span>Web Version</span>
          <ArrowRightIcon />
        </Link>
      )}
    </div>
  );
}
