'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import NativeNavbar from '@/components/native/NativeNavbar';
import BottomNav from '@/components/native/BottomNav';
import WebUpdatePrompt from '@/components/native/WebUpdatePrompt';
import { BottomNavProvider } from '@/contexts/BottomNavContext';
import { initNotifications, registerNotificationClickListener } from '@/lib/notifications';

// 不显示顶部导航的路径
const hideNavbarPaths = ['/native/me', '/native/settings', '/native/create', '/native/video', '/native/voice/task', '/native/subscribe', '/native/payment'];

// 不显示底部导航的路径
const hideBottomNavPaths = ['/native/settings', '/native/create', '/native/video', '/native/voice/task', '/native/subscribe', '/native/payment'];

/**
 * Native App 专用布局
 * 用于 WebView 加载的原生应用页面
 * 与网页端完全独立，不共享导航栏和侧边栏
 */
export default function NativeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

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
  const showNavbar = !hideNavbarPaths.some((path) => pathname.startsWith(path));
  const showBottomNav = !hideBottomNavPaths.some((path) => pathname.startsWith(path));

  return (
    <BottomNavProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0a0a1a] to-slate-950 text-white selection:bg-purple-500/30">
        {/* 顶部环境光效 */}
        <div className="fixed top-0 left-0 right-0 h-[50vh] bg-purple-900/10 blur-[100px] pointer-events-none" />
        <div className="fixed bottom-0 right-0 w-[50vh] h-[50vh] bg-blue-900/10 blur-[100px] pointer-events-none" />

        {/* 顶部导航 - 部分页面不显示 */}
        {showNavbar && <NativeNavbar />}

        {/* 主内容区域 */}
        <main className="relative z-10">{children}</main>

        {/* 底部导航 - 部分页面不显示 */}
        {showBottomNav && <BottomNav />}

        {/* Web 内容更新提示 */}
        <WebUpdatePrompt />
      </div>
    </BottomNavProvider>
  );
}
