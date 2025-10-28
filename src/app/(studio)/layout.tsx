'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import StudioSidebar from '@/components/features/studio/StudioSidebar';
import StudioTopbar from '@/components/features/studio/StudioTopbar';
import MobileTopNav from '@/components/features/studio/MobileTopNav';
import MobileSideMenu from '@/components/features/studio/MobileSideMenu';
import { StudioProvider, useStudio } from '@/contexts/StudioContext';
import { useUserCredits } from '@/hooks/useUserCredits';

function StudioLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { title } = useStudio();
  const { credits, loading: creditsLoading } = useUserCredits();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleUpgradeClick = () => {
    router.push('/subscription');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ========== 桌面端布局 (lg+) ========== */}
      <div className="hidden lg:block">
        {/* 桌面端顶部栏 */}
        <div className="fixed top-0 left-0 right-0 z-30">
          <StudioTopbar
            title={title}
            credits={credits}
            creditsLoading={creditsLoading}
            onUpgradeClick={handleUpgradeClick}
          />
        </div>

        {/* 桌面端侧边栏 */}
        <StudioSidebar variant="desktop" />

        {/* 桌面端主内容 */}
        <div className="pt-[60px] ml-16">
          <main>
            {children}
          </main>
        </div>
      </div>

      {/* ========== 移动端布局 (<lg) ========== */}
      <div className="lg:hidden">
        {/* 移动端顶部导航 */}
        <MobileTopNav onMenuToggle={setIsMobileMenuOpen} />

        {/* 移动端侧边抽屉菜单 */}
        <MobileSideMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        {/* 移动端主内容 */}
        <div className="pt-[60px]">
          <main>
            {children}
          </main>
        </div>
      </div>
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