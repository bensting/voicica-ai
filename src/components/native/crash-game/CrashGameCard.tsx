'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCrashGameHomeConfig } from '@/config/appConfig';

/**
 * Crash Game 入口卡片 - 显示在 Explore 首页
 * 深色玻璃风格，与 TotalAssetsCard 统一设计语言
 * 可见性和副标题由 appConfig.mining_economy.crash_game 控制
 */
export default function CrashGameCard() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();
  const config = getCrashGameHomeConfig();
  const [navigating, setNavigating] = useState(false);

  // pathname 变化后清除 loading
  useEffect(() => {
    if (navigating) setNavigating(false);
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNavigate = useCallback(() => {
    setNavigating(true);
    router.push('/native/crash-game');
  }, [router]);

  if (!config.show_home_card) return null;

  return (
    <>
      <button onClick={handleNavigate} className="block mx-4 mt-3 w-[calc(100%-2rem)] text-left">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900/30 via-[#0a1a1a]/80 to-[#1a1a35]/80 border border-emerald-500/15 backdrop-blur-sm p-4">
          {/* Ambient glow */}
          <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-emerald-500/10 blur-[50px] animate-pulse" />
          <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-amber-500/[0.06] blur-[40px]" />

          <div className="relative flex items-center gap-4">
            {/* Left: rising chart icon */}
            <div className="shrink-0 w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                <polyline points="16 7 22 7 22 13" />
              </svg>
            </div>

            {/* Center: text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-bold text-white">
                  {t('native.crashGame.title')}
                </h3>
                <span className="relative flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase leading-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
              </div>
              <p className="mt-0.5 text-xs text-white/40 truncate">
                {config.subtitle}
              </p>
            </div>

            {/* Right: play arrow */}
            <div className="shrink-0 w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-400 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
      </button>

      {/* 导航 loading 遮罩 */}
      {navigating && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-[#060613]/90 backdrop-blur-sm flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
        </div>,
        document.body,
      )}
    </>
  );
}
