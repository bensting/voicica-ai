'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCrashGameHomeConfig } from '@/config/appConfig';

/**
 * Crash Game 入口卡片 - 显示在 Explore 首页
 * 可见性和副标题由 appConfig.mining_economy.crash_game 控制
 */
export default function CrashGameCard() {
  const { t } = useLanguage();
  const config = getCrashGameHomeConfig();

  if (!config.show_home_card) return null;

  return (
    <Link href="/native/crash-game" className="block mx-4 mt-4">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-500 p-5 shadow-lg shadow-purple-900/30">
        {/* Background decoration */}
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-xl" />
        <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-white/10 blur-lg" />

        <div className="relative flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">
              {t('native.crashGame.title')}
            </h3>
            <p className="mt-1 text-sm text-white/80">
              {config.subtitle}
            </p>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-3xl">🚀</div>
            <span className="mt-1 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {t('native.crashGame.playNow')}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
