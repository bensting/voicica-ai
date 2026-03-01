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
 * Native 路由：品牌化启动屏（Logo + 动画）
 * Web 路由：简洁 spinner
 */
export default function AppSplashWrapper({ children }: { children: ReactNode }) {
  const { isReady: isLanguageReady } = useLanguage();
  const { loading: isAuthLoading } = useFirebaseAuth();
  const pathname = usePathname();

  const isAppReady = isLanguageReady && !isAuthLoading;
  const isNativeRoute = pathname?.startsWith('/native');

  return (
    <>
      {/* 加载指示器 - 只在未就绪时显示 */}
      {!isAppReady && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center ${
            isNativeRoute
              ? 'bg-[#060613]'
              : 'bg-gradient-to-b from-white to-purple-50'
          }`}
        >
          {isNativeRoute ? (
            /* Native: 品牌化启动屏 */
            <div className="flex flex-col items-center">
              {/* 环境光效 */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-purple-600/15 blur-[100px] animate-pulse" />
                <div className="absolute bottom-1/3 left-1/3 w-[200px] h-[200px] rounded-full bg-amber-500/10 blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
              </div>

              {/* Logo */}
              <div className="relative mb-8">
                {/* 光环动画 */}
                <div className="absolute inset-0 -m-3 rounded-full border-2 border-purple-500/20 animate-ping" style={{ animationDuration: '2s' }} />
                <div className="absolute inset-0 -m-1.5 rounded-full border border-purple-400/10 animate-pulse" />
                <picture>
                  <source srcSet="/logo/logo-transparent-256.webp" type="image/webp" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo/logo-transparent.png"
                    alt="VoicicaAI"
                    width={80}
                    height={80}
                    className="w-20 h-20 relative z-10"
                  />
                </picture>
              </div>

              {/* 品牌名 */}
              <h1 className="text-white/90 text-xl font-bold tracking-wider mb-2">VoicicaAI</h1>
              <p className="text-white/30 text-xs font-medium tracking-widest uppercase mb-10">AI Creative Studio</p>

              {/* 进度条动画 */}
              <div className="w-40 h-0.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-amber-400 rounded-full"
                  style={{
                    animation: 'loading-bar 2s ease-in-out infinite',
                  }}
                />
              </div>

              <style>{`
                @keyframes loading-bar {
                  0% { width: 0%; margin-left: 0%; }
                  50% { width: 60%; margin-left: 20%; }
                  100% { width: 0%; margin-left: 100%; }
                }
              `}</style>
            </div>
          ) : (
            /* Web: 简洁 spinner */
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-4 rounded-full animate-spin border-purple-200 border-t-purple-600" />
              <p className="text-sm font-medium text-gray-600">Loading...</p>
            </div>
          )}
        </div>
      )}

      {/* 内容区域 */}
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
