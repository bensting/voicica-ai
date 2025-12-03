'use client';

import { useState } from 'react';
import StudioSidebar from '@/components/layout/studio/StudioSidebar';
import StudioTopNav from '@/components/layout/studio/StudioTopNav';
import UpgradeModal from '@/components/features/pricing/UpgradeModal';
import { StudioProvider } from '@/contexts/StudioContext';

function StudioLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const handleUpgradeClick = () => {
    setIsUpgradeModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ========== 顶部导航 (响应式，移动端和桌面端统一) ========== */}
      <StudioTopNav
        onUpgradeClick={handleUpgradeClick}
        isMenuOpen={isMobileMenuOpen}
        onMenuToggle={setIsMobileMenuOpen}
      />

      {/* ========== 侧边栏（响应式，移动端和桌面端统一） ========== */}
      <StudioSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* ========== 主内容区域 ========== */}
      {/* padding-top 需要计算：导航栏高度(60px) + 安全区域顶部 */}
      <main
        className="lg:ml-16"
        style={{
          paddingTop: 'calc(60px + env(safe-area-inset-top, 0px))'
        }}
      >
        {children}
      </main>

      {/* ========== Upgrade Modal - 只在打开时渲染，避免预加载订阅数据 ========== */}
      {isUpgradeModalOpen && (
        <UpgradeModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
        />
      )}
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