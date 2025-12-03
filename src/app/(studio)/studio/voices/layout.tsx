'use client';

import MobileBottomNav from '@/components/layout/studio/MobileBottomNav';

/**
 * Voices Layout
 *
 * Provides desktop/mobile specific layouts for Voices pages:
 * - Desktop: Standard content layout
 * - Mobile: Content with bottom navigation bar and appropriate padding
 */
export default function VoicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Children rendered once with responsive padding */}
      {/* mobile-bottom-nav-space: 移动端底部留出导航栏 + 安全区域空间 */}
      <div className="mobile-bottom-nav-space">
        {children}
      </div>

      {/* Mobile Bottom Navigation - only shown on mobile */}
      <div className="lg:hidden">
        <MobileBottomNav />
      </div>
    </>
  );
}