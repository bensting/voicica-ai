'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import NativeNavbar from '@/components/native/NativeNavbar';
import BottomNav, { type TabType } from '@/components/native/BottomNav';
import WebUpdatePrompt from '@/components/native/WebUpdatePrompt';
import { BottomNavProvider } from '@/contexts/BottomNavContext';
import { DailyTasksProvider } from '@/contexts/DailyTasksContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { initNotifications, registerNotificationClickListener } from '@/lib/notifications';
import { initPushNotifications } from '@/lib/push-notifications';
// Explore tab 子组件
import NativeBannerAd from '@/components/native/NativeBannerAd';
import TotalAssetsCard from '@/components/native/TotalAssetsCard';
import FeatureGrid from '@/components/native/FeatureGrid';
import ExploreSection from '@/components/native/ExploreSection';
// Me tab
import MePageContent from '@/components/native/me/MePageContent';

const hideNavbarPaths = ['/native/me', '/native/settings', '/native/create', '/native/tools', '/native/video', '/native/voice/task', '/native/subscribe', '/native/payment', '/native/lucky-draw', '/native/crash-game', '/native/bull-bear'];
const hideBottomNavPaths = ['/native/settings', '/native/create', '/native/tools', '/native/video', '/native/voice/task', '/native/subscribe', '/native/payment', '/native/lucky-draw', '/native/crash-game', '/native/bull-bear'];

const pathnameToTab = (pathname: string): TabType | null => {
  const p = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  if (p === '/native' || p.startsWith('/native/explore')) return 'explore';
  if (p === '/native/me') return 'me';
  return null;
};

export default function NativeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<TabType>(() => pathnameToTab(pathname) || 'explore');

  const isInSubPage = hideBottomNavPaths.some((p) => pathname.startsWith(p));
  const isMainTab = !isInSubPage && pathnameToTab(pathname) !== null;

  useEffect(() => {
    const tab = pathnameToTab(pathname);
    if (tab) setActiveTab(tab);
  }, [pathname]);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  useEffect(() => {
    document.body.classList.add('native-app');
    return () => { document.body.classList.remove('native-app'); };
  }, []);

  useEffect(() => {
    initNotifications();
    const cleanup = registerNotificationClickListener((path) => {
      router.push(path);
    });
    return cleanup;
  }, [router]);

  useEffect(() => {
    initPushNotifications().catch(console.error);
  }, []);

  const showNavbar = !hideNavbarPaths.some((path) => pathname.startsWith(path));
  const showBottomNav = !isInSubPage;

  const exploreTab = useMemo(() => (
    <div className="pt-2 pb-20">
      <NativeBannerAd />
      <TotalAssetsCard />
      <div className="px-5 mt-5 mb-1">
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">{t('native.home.sectionCreativeTools')}</h2>
      </div>
      <FeatureGrid />
      <ExploreSection />
    </div>
  ), [t]);

  const meTab = useMemo(() => <MePageContent isActive={activeTab === 'me'} />, [activeTab]);

  return (
    <BottomNavProvider>
    <DailyTasksProvider>
      <div className="min-h-screen bg-black lg:flex lg:items-start lg:justify-center">
        <div className="native-phone-frame min-h-screen w-full lg:max-w-[430px] lg:h-screen lg:overflow-hidden lg:flex lg:flex-col lg:relative lg:shadow-2xl lg:shadow-purple-900/20 bg-gradient-to-br from-slate-950 via-[#0a0a1a] to-slate-950 text-white selection:bg-purple-500/30">
          <div
            className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
            aria-hidden="true"
            style={{ transform: 'translateZ(0)' }}
          >
            <div className="absolute top-0 left-0 right-0 h-[50vh] bg-purple-900/10 blur-[100px]" />
            <div className="absolute bottom-0 right-0 w-[50vh] h-[50vh] bg-blue-900/10 blur-[100px]" />
          </div>

          {(isMainTab ? activeTab !== 'me' : showNavbar) && <NativeNavbar />}

          <main className="relative lg:flex-1 lg:overflow-y-auto lg:min-h-0">
            <div style={{ display: isMainTab && activeTab === 'explore' ? 'block' : 'none' }}>
              {exploreTab}
            </div>
            <div style={{ display: isMainTab && activeTab === 'me' ? 'block' : 'none' }}>
              {meTab}
            </div>
            {!isMainTab && children}
          </main>

          {showBottomNav && (
            <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
          )}

          <WebUpdatePrompt />
        </div>
      </div>
    </DailyTasksProvider>
    </BottomNavProvider>
  );
}
