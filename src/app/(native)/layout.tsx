'use client';

import NativeNavbar from '@/components/native/NativeNavbar';
import BottomNav from '@/components/native/BottomNav';

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
  return (
    <div className="min-h-screen bg-[#0a0a1a]">
      {/* 顶部导航 */}
      <NativeNavbar />

      {/* 主内容区域 */}
      <main>{children}</main>

      {/* 底部导航 */}
      <BottomNav />
    </div>
  );
}
