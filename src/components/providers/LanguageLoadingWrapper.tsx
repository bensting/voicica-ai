'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

/**
 * App Loading Wrapper
 *
 * 策略：使用 CSS opacity 隐藏内容，直到以下条件都满足：
 * - 语言文件加载完成
 * - 用户认证状态检查完成
 *
 * 这样可以避免：
 * - 闪现翻译 key
 * - 用户登录状态闪烁
 * - 不会阻塞 SSR
 * - 平滑过渡效果
 */
export default function LanguageLoadingWrapper({ children }: { children: ReactNode }) {
  const { isReady: isLanguageReady } = useLanguage();
  const { loading: isAuthLoading } = useFirebaseAuth();
  const pathname = usePathname();

  // 等待语言和认证状态
  const isAppReady = isLanguageReady && !isAuthLoading;

  // 判断是否是 Native 路由（深色主题）
  const isNativeRoute = pathname?.startsWith('/native');

  return (
    <>
      {/* 加载指示器 - 只在未就绪时显示 */}
      {!isAppReady && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center ${
            isNativeRoute
              ? 'bg-[#0a0a1a]'
              : 'bg-gradient-to-b from-white to-purple-50'
          }`}
        >
          <div className="flex flex-col items-center gap-4">
            {/* 加载动画 */}
            <div
              className={`w-16 h-16 border-4 rounded-full animate-spin ${
                isNativeRoute
                  ? 'border-gray-700 border-t-purple-500'
                  : 'border-purple-200 border-t-purple-600'
              }`}
            />
            {/* 加载文本 - 使用静态文本而不是翻译 key */}
            <p
              className={`text-sm font-medium ${
                isNativeRoute ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              Loading...
            </p>
          </div>
        </div>
      )}

      {/* 内容区域 - 使用 opacity 控制可见性 */}
      <div
        className={`transition-opacity duration-300 ${
          isAppReady ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {children}
      </div>
    </>
  );
}