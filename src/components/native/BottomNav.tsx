'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useBottomNav } from '@/contexts/BottomNavContext';
import { useLanguage } from '@/contexts/LanguageContext';

// 首页图标
const HomeIcon = ({ active }: { active: boolean }) => (
  <svg
    className={`w-6 h-6 ${active ? 'text-white' : 'text-gray-500'}`}
    viewBox="0 0 24 24"
    fill={active ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    {!active && <path d="M9 22V12h6v10" />}
  </svg>
);

// 我的图标
const UserIcon = ({ active }: { active: boolean }) => (
  <svg
    className={`w-6 h-6 ${active ? 'text-white' : 'text-gray-500'}`}
    viewBox="0 0 24 24"
    fill={active ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M20 21a8 8 0 10-16 0" />
  </svg>
);

// 团队图标
const TeamIcon = ({ active }: { active: boolean }) => (
  <svg
    className={`w-6 h-6 ${active ? 'text-white' : 'text-gray-500'}`}
    viewBox="0 0 24 24"
    fill={active ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="9" cy="7" r="3" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
    <path d="M17 14a3 3 0 013 3v2" />
  </svg>
);

/**
 * 底部导航栏
 * Explore / Team / Me
 */
export default function BottomNav() {
  const pathname = usePathname();
  const { isVisible } = useBottomNav();
  const { t } = useLanguage();

  const isExploreActive = pathname === '/native' || pathname.startsWith('/native/explore');
  const isTeamActive = pathname.startsWith('/native/referral-earnings');
  const isMeActive = pathname.startsWith('/native/me');

  // 通过 context 控制显示/隐藏
  if (!isVisible) return null;

  return (
    <>
      {/* 底部导航 */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-t border-white/5 lg:static lg:shrink-0"
        style={{ paddingBottom: 'var(--safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-around h-16">
          {/* Explore */}
          <Link
            href="/native"
            className="flex flex-col items-center justify-center flex-1 h-full active:scale-95 transition-transform"
          >
            <HomeIcon active={isExploreActive} />
            <span
              className={`text-xs mt-1 ${isExploreActive ? 'text-white font-medium' : 'text-slate-500'
                }`}
            >
              {t('native.bottomNav.explore')}
            </span>
          </Link>

          {/* Team */}
          <Link
            href="/native/referral-earnings"
            className="flex flex-col items-center justify-center flex-1 h-full active:scale-95 transition-transform"
          >
            <TeamIcon active={isTeamActive} />
            <span
              className={`text-xs mt-1 ${isTeamActive ? 'text-white font-medium' : 'text-slate-500'
                }`}
            >
              {t('native.bottomNav.team')}
            </span>
          </Link>

          {/* Me */}
          <Link
            href="/native/me"
            className="flex flex-col items-center justify-center flex-1 h-full"
          >
            <UserIcon active={isMeActive} />
            <span
              className={`text-xs mt-1 ${isMeActive ? 'text-white' : 'text-gray-500'
                }`}
            >
              {t('native.bottomNav.me')}
            </span>
          </Link>
        </div>
      </nav>
    </>
  );
}
