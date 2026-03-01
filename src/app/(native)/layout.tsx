'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import NativeNavbar from '@/components/native/NativeNavbar';
import BottomNav, { type TabType } from '@/components/native/BottomNav';
import WebUpdatePrompt from '@/components/native/WebUpdatePrompt';
import { BottomNavProvider } from '@/contexts/BottomNavContext';
import { DailyTasksProvider } from '@/contexts/DailyTasksContext';
import { initNotifications, registerNotificationClickListener } from '@/lib/notifications';
import { initPushNotifications } from '@/lib/push-notifications';
import ReferralDetectModal from '@/components/native/ReferralDetectModal';
import { detectReferralCode, confirmReferralCode, dismissReferralDetect } from '@/utils/native/referral-detect';
import { processReferralCode } from '@/actions/referral';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
// Explore tab 子组件
import NativeBannerAd from '@/components/native/NativeBannerAd';
import TotalAssetsCard from '@/components/native/TotalAssetsCard';
import FeatureGrid from '@/components/native/FeatureGrid';
import ExploreSection from '@/components/native/ExploreSection';
// Team tab
import ReferralPage from '@/components/native/ReferralPage';
// Me tab
import MePageContent from '@/components/native/me/MePageContent';
// Crash Game
import CrashGameCard from '@/components/native/crash-game/CrashGameCard';
import { getCrashGameHomeConfig } from '@/config/appConfig';

// 不显示顶部导航的路径
const hideNavbarPaths = ['/native/me', '/native/settings', '/native/create', '/native/tools', '/native/video', '/native/voice/task', '/native/subscribe', '/native/payment', '/native/lucky-draw', '/native/crash-game'];

// 不显示底部导航的路径
const hideBottomNavPaths = ['/native/settings', '/native/create', '/native/tools', '/native/video', '/native/voice/task', '/native/subscribe', '/native/payment', '/native/lucky-draw', '/native/crash-game'];

// 三个主 Tab 的 pathname 前缀映射
const pathnameToTab = (pathname: string): TabType | null => {
  if (pathname === '/native' || pathname.startsWith('/native/explore')) return 'explore';
  if (pathname.startsWith('/native/referral-earnings')) return 'team';
  if (pathname === '/native/me') return 'me';
  return null;
};

/**
 * Native App 专用布局
 * 用于 WebView 加载的原生应用页面
 * 与网页端完全独立，不共享导航栏和侧边栏
 *
 * 三个主 Tab（Explore / Team / Me）同时渲染，通过 CSS display 切换
 * 保持页面状态不丢失
 */
export default function NativeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useFirebaseAuth();

  // 根据初始 pathname 设定默认 activeTab
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    return pathnameToTab(pathname) || 'explore';
  });

  // 判断当前是否在主 Tab 页面（非子页面）
  const isInSubPage = hideBottomNavPaths.some((p) => pathname.startsWith(p));
  const isMainTab = !isInSubPage && pathnameToTab(pathname) !== null;

  // 当用户通过浏览器后退/前进或直接访问 URL 时，同步 activeTab
  useEffect(() => {
    const tab = pathnameToTab(pathname);
    if (tab) {
      setActiveTab(tab);
    }
  }, [pathname]);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  // 捕获 URL 中的推荐码参数并存入 localStorage
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const refCode = params.get('ref');
      if (refCode) {
        localStorage.setItem('pending_referral_code', refCode);
        console.log('[NativeLayout] Saved referral code:', refCode);
      }
    } catch { /* ignore */ }
  }, []);

  // 添加 native-app class 来禁用非输入元素的文本选择
  useEffect(() => {
    document.body.classList.add('native-app');
    return () => {
      document.body.classList.remove('native-app');
    };
  }, []);

  // 初始化本地推送通知
  useEffect(() => {
    initNotifications();

    // 注册通知点击监听
    const cleanup = registerNotificationClickListener((path) => {
      console.log('[NativeLayout] Notification clicked, navigating to:', path);
      router.push(path);
    });

    return cleanup;
  }, [router]);

  // 初始化 FCM 远程推送
  useEffect(() => {
    initPushNotifications().catch(console.error);
  }, []);

  // 推荐码剪贴板检测
  const [referralDetect, setReferralDetect] = useState<{ show: boolean; code: string }>({ show: false, code: '' });

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const code = await detectReferralCode();
        if (code) {
          setReferralDetect({ show: true, code });
        }
      } catch { /* ignore */ }
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const showNavbar = !hideNavbarPaths.some((path) => pathname.startsWith(path));
  const showBottomNav = !isInSubPage;

  // Memoize tab content to prevent re-init when navigating to/from sub-pages
  const showCrashGame = getCrashGameHomeConfig().show_home_card;
  const exploreTab = useMemo(() => (
    <div className="pt-2 pb-20">
      <NativeBannerAd />
      <TotalAssetsCard />
      {showCrashGame && (
        <>
          <div className="px-5 mt-5 mb-1">
            <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Play &amp; Earn</h2>
          </div>
          <CrashGameCard />
        </>
      )}
      <div className="px-5 mt-5 mb-1">
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">AI Creative Tools</h2>
      </div>
      <FeatureGrid />
      <ExploreSection />
    </div>
  ), [showCrashGame]);

  const teamTab = useMemo(() => <ReferralPage isActive={activeTab === 'team'} />, [activeTab]);
  const meTab = useMemo(() => <MePageContent isActive={activeTab === 'me'} />, [activeTab]);

  return (
    <BottomNavProvider>
    <DailyTasksProvider>
      {/* PC 端外层背景 */}
      <div className="min-h-screen bg-black lg:flex lg:items-start lg:justify-center">
        {/* 手机比例容器：移动端全屏，PC 端限制为手机宽度并居中 */}
        <div className="native-phone-frame min-h-screen w-full lg:max-w-[430px] lg:h-screen lg:overflow-hidden lg:flex lg:flex-col lg:relative lg:shadow-2xl lg:shadow-purple-900/20 bg-gradient-to-br from-slate-950 via-[#0a0a1a] to-slate-950 text-white selection:bg-purple-500/30">
          {/* 顶部环境光效 - 确保在最底层且不影响触摸 */}
          <div
            className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
            aria-hidden="true"
            style={{ transform: 'translateZ(0)' }}
          >
            <div className="absolute top-0 left-0 right-0 h-[50vh] bg-purple-900/10 blur-[100px]" />
            <div className="absolute bottom-0 right-0 w-[50vh] h-[50vh] bg-blue-900/10 blur-[100px]" />
          </div>

          {/* 顶部导航 - 主 Tab 模式下根据 activeTab 控制，子页面根据 pathname */}
          {(isMainTab ? activeTab !== 'me' : showNavbar) && <NativeNavbar />}

          {/* 主内容区域 */}
          <main className="relative lg:flex-1 lg:overflow-y-auto lg:min-h-0">
            {/* 三个主 Tab 始终挂载，CSS display 切换，进子页面不卸载 */}
            <div style={{ display: isMainTab && activeTab === 'explore' ? 'block' : 'none' }}>
              {exploreTab}
            </div>
            <div style={{ display: isMainTab && activeTab === 'team' ? 'block' : 'none' }}>
              {teamTab}
            </div>
            <div style={{ display: isMainTab && activeTab === 'me' ? 'block' : 'none' }}>
              {meTab}
            </div>
            {/* 子页面 */}
            {!isMainTab && children}
          </main>

          {/* 底部导航 - 子页面不显示 */}
          {showBottomNav && (
            <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
          )}

          {/* Web 内容更新提示 */}
          <WebUpdatePrompt />

          {/* 推荐码检测弹窗 */}
          <ReferralDetectModal
            isOpen={referralDetect.show}
            code={referralDetect.code}
            onConfirm={async () => {
              const code = referralDetect.code;
              setReferralDetect({ show: false, code: '' });
              if (user) {
                // 已登录，直接绑定
                try {
                  const result = await processReferralCode(code);
                  console.log('[Referral] bind result:', result);
                } catch (e) {
                  console.error('[Referral] bind error:', e);
                }
                // 清剪贴板
                confirmReferralCode(code);
              } else {
                // 未登录，存 localStorage 等登录后自动绑定
                confirmReferralCode(code);
              }
            }}
            onDismiss={() => {
              dismissReferralDetect();
              setReferralDetect({ show: false, code: '' });
            }}
          />
        </div>
      </div>
    </DailyTasksProvider>
    </BottomNavProvider>
  );
}
