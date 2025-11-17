'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { ReactNode } from 'react';

/**
 * Language Loading Wrapper
 *
 * 策略：使用 CSS opacity 隐藏内容，直到语言文件加载完成
 * - 避免闪现翻译 key
 * - 不会阻塞 SSR
 * - 平滑过渡效果
 */
export default function LanguageLoadingWrapper({ children }: { children: ReactNode }) {
  const { isReady } = useLanguage();

  return (
    <>
      {/* 加载指示器 - 只在未就绪时显示 */}
      {!isReady && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-white to-purple-50">
          <div className="flex flex-col items-center gap-4">
            {/* 加载动画 */}
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
            {/* 加载文本 - 使用静态文本而不是翻译 key */}
            <p className="text-gray-600 text-sm font-medium">Loading...</p>
          </div>
        </div>
      )}

      {/* 内容区域 - 使用 opacity 控制可见性 */}
      <div
        className={`transition-opacity duration-300 ${
          isReady ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {children}
      </div>
    </>
  );
}