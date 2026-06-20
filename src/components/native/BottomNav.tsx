'use client';

import { useRouter } from 'next/navigation';
import { useBottomNav } from '@/contexts/BottomNavContext';
import { useLanguage } from '@/contexts/LanguageContext';

export type TabType = 'explore' | 'me';

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

interface BottomNavProps {
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const router = useRouter();
  const { isVisible } = useBottomNav();
  const { t } = useLanguage();

  const isExploreActive = activeTab === 'explore';
  const isMeActive = activeTab === 'me';

  if (!isVisible) return null;

  const handleTabClick = (tab: TabType) => {
    if (onTabChange) {
      onTabChange(tab);
    }
    const urlMap: Record<TabType, string> = {
      explore: '/native',
      me: '/native/me',
    };
    router.replace(urlMap[tab]);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-t border-white/5 lg:static lg:shrink-0"
      style={{ paddingBottom: 'var(--safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-16">
        {/* Explore */}
        <button
          type="button"
          onClick={() => handleTabClick('explore')}
          className="flex flex-col items-center justify-center flex-1 h-full active:scale-95 transition-transform"
        >
          <HomeIcon active={isExploreActive} />
          <span className={`text-xs mt-1 ${isExploreActive ? 'text-white font-medium' : 'text-slate-500'}`}>
            {t('native.bottomNav.explore')}
          </span>
        </button>

        {/* Me */}
        <button
          type="button"
          onClick={() => handleTabClick('me')}
          className="flex flex-col items-center justify-center flex-1 h-full active:scale-95 transition-transform"
        >
          <UserIcon active={isMeActive} />
          <span className={`text-xs mt-1 ${isMeActive ? 'text-white' : 'text-gray-500'}`}>
            {t('native.bottomNav.me')}
          </span>
        </button>
      </div>
    </nav>
  );
}
