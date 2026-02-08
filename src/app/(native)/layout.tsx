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
  const showNavbar = !hideNavbarPaths.some((path) => pathname.startsWith(path));
  const showBottomNav = !hideBottomNavPaths.some((path) => pathname.startsWith(path));

  return (
    <BottomNavProvider>
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

          {/* 顶部导航 - 部分页面不显示 */}
          {showNavbar && <NativeNavbar />}

          {/* 主内容区域 - PC 端为 flex 滚动区域 */}
          <main className="relative z-10 lg:flex-1 lg:overflow-y-auto lg:min-h-0">{children}</main>

          {/* 底部导航 - 部分页面不显示 */}
          {showBottomNav && <BottomNav />}

          {/* Web 内容更新提示 */}
          <WebUpdatePrompt />
        </div>
      </div>
    </BottomNavProvider>
  );
}
