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
      {/* 高度计算：100vh - 顶部导航(60px) - 安全区域顶部 */}
      <div
        className="lg:hidden flex flex-col"
        style={{
          height: 'calc(100vh - 60px - env(safe-area-inset-top, 0px))'
        }}
      >
        {/* Content area - 底部留出安全区域空间 */}
        <div className="flex-1 min-h-0 safe-area-bottom-margin">
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