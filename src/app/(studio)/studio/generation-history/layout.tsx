'use client';

import MobileBottomNav from '@/components/layout/studio/MobileBottomNav';

/**
 * Generation History Layout
 *
 * Provides desktop/mobile specific layouts for Generation History pages:
 * - Desktop: Standard content layout
 * - Mobile: Content with bottom navigation bar and appropriate padding
 */
export default function GenerationHistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Unified layout - children rendered once */}
      {children}

      {/* Mobile Bottom Navigation - only shown on mobile */}
      <div className="lg:hidden">
        <MobileBottomNav />
      </div>
    </>
  );
}