'use client';

import StoryBottomNav from '@/components/layout/studio/StoryBottomNav';

/**
 * Story Layout
 *
 * Provides desktop/mobile specific layouts for Story pages:
 * - Desktop: Standard content layout
 * - Mobile: Content with bottom navigation bar
 */
export default function StoryLayout({
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
      <div
        className="lg:hidden flex flex-col"
        style={{
          height: 'calc(100vh - 60px - var(--safe-area-inset-top, 0px))'
        }}
      >
        {/* Content area */}
        <div className="flex-1 min-h-0 safe-area-bottom-margin">
          <div className="h-full">
            {children}
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <StoryBottomNav />
      </div>
    </>
  );
}
