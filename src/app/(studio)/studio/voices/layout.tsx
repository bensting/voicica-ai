'use client';

import MobileBottomNav from '@/components/features/studio/MobileBottomNav';

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
      <div className="pb-0 lg:pb-0">
        {children}
      </div>

      {/* Mobile Bottom Navigation - only shown on mobile */}
      <div className="lg:hidden">
        <MobileBottomNav />
      </div>
    </>
  );
}