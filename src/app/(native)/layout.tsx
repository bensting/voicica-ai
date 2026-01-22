'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import NativeNavbar from '@/components/native/NativeNavbar';
import BottomNav from '@/components/native/BottomNav';
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
    <div className="min-h-screen bg-[#0a0a1a]">
      {/* 顶部导航 - 部分页面不显示 */}
      {showNavbar && <NativeNavbar />}

      {/* 主内容区域 */}
      <main>{children}</main>

      {/* 底部导航 - 部分页面不显示 */}
      {showBottomNav && <BottomNav />}
    </div>
  );
}
