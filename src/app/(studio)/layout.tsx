'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import StudioSidebar from '@/components/layout/studio/StudioSidebar';
import StudioTopbar from '@/components/layout/studio/StudioTopbar';
import MobileTopNav from '@/components/layout/studio/MobileTopNav';
import MobileSideMenu from '@/components/layout/studio/MobileSideMenu';
import { StudioProvider, useStudio } from '@/contexts/StudioContext';

function StudioLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { title } = useStudio();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleUpgradeClick = () => {
    router.push('/subscription');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ========== 桌面端组件 (lg+) ========== */}
      <div className="hidden lg:block fixed top-0 left-0 right-0 z-30">
        <StudioTopbar
          title={title}
          onUpgradeClick={handleUpgradeClick}
        />
      </div>

      <div className="hidden lg:block">
        <StudioSidebar variant="desktop" />
      </div>

      {/* ========== 移动端组件 (<lg) ========== */}
      <div className="lg:hidden">
        <MobileTopNav
          isMenuOpen={isMobileMenuOpen}
          onMenuToggle={setIsMobileMenuOpen}
        />

        <MobileSideMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
      </div>

      {/* ========== 主内容区域 (统一渲染 children 一次) ========== */}
      <main className="pt-[60px] lg:ml-16">
        {children}
      </main>
    </div>
  );
}

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StudioProvider>
      <StudioLayoutContent>{children}</StudioLayoutContent>
    </StudioProvider>
  );
}