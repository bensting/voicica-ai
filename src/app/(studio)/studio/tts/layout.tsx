'use client';

import MobileBottomNav from '@/components/layout/studio/MobileBottomNav';

/**
 * TTS Layout
 *
 * Provides desktop/mobile specific layouts for TTS pages:
 * - Desktop: Standard content layout
 * - Mobile: Content with bottom navigation bar and appropriate padding
 *
 * Note: CreditsProvider is already in root layout, no need to duplicate here
 */
export default function TTSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* ========== 桌面端布局 (lg+) ========== */}
      <div className="hidden lg:block">
        {children}
      </div>

      {/* ========== 移动端布局 (<lg) ========== */}
      <div className="lg:hidden h-[calc(100vh-60px)] flex flex-col">
        {/* Content area */}
        <div className="flex-1 min-h-0">
          <div className="h-full">
            {children}
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
      </div>
    </>
  );
}