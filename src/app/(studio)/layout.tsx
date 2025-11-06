'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import StudioSidebar from '@/components/layout/studio/StudioSidebar';
import StudioTopNav from '@/components/layout/studio/StudioTopNav';
import MobileSideMenu from '@/components/layout/studio/MobileSideMenu';
import { StudioProvider, useStudio } from '@/contexts/StudioContext';

function StudioLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleUpgradeClick = () => {
    router.push('/subscription');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ========== 顶部导航 (响应式，移动端和桌面端统一) ========== */}
      <StudioTopNav
        onUpgradeClick={handleUpgradeClick}
        isMenuOpen={isMobileMenuOpen}
        onMenuToggle={setIsMobileMenuOpen}
      />

      {/* ========== 桌面端侧边栏 (lg+) ========== */}
      <div className="hidden lg:block">
        <StudioSidebar variant="desktop" />
      </div>

      {/* ========== 移动端侧边菜单 (<lg) ========== */}
      <div className="lg:hidden">
        <MobileSideMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
      </div>

      {/* ========== 主内容区域 ========== */}
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