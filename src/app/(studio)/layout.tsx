'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import StudioSidebar from '@/components/layout/studio/StudioSidebar';
import StudioTopNav from '@/components/layout/studio/StudioTopNav';
import UpgradeModal from '@/components/features/pricing/UpgradeModal';
import { StudioProvider, useStudio } from '@/contexts/StudioContext';
import { useCredits } from '@/contexts/CreditsContext';
import AdsterraSocialBar from '@/components/ads/AdsterraSocialBar';

// 动态导入每日任务弹窗
const DailyTasksModal = dynamic(
  () => import('@/components/features/daily-tasks/DailyTasksModal'),
  { ssr: false }
);

function StudioLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isDailyTasksModalOpen, setIsDailyTasksModalOpen] = useState(false);
  const { refreshCredits } = useCredits();

  const handleUpgradeClick = () => {
    setIsUpgradeModalOpen(true);
  };

  // 手动点击打开弹窗
  const handleDailyTasksClick = useCallback(() => {
    // 如果弹窗已经打开，不重复打开
    if (isDailyTasksModalOpen) return;
    setIsDailyTasksModalOpen(true);
  }, [isDailyTasksModalOpen]);

  // 关闭弹窗
  const handleDailyTasksClose = useCallback(() => {
    setIsDailyTasksModalOpen(false);
  }, []);

  // 注册打开每日任务弹窗的回调到 StudioContext，供子组件调用
  const { setDailyTasksCallback } = useStudio();
  useEffect(() => {
    setDailyTasksCallback(handleDailyTasksClick);
  }, [setDailyTasksCallback, handleDailyTasksClick]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ========== 顶部导航 (响应式，移动端和桌面端统一) ========== */}
      <StudioTopNav
        onUpgradeClick={handleUpgradeClick}
        onDailyTasksClick={handleDailyTasksClick}
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
          paddingTop: 'calc(60px + var(--safe-area-inset-top, 0px))'
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

      {/* ========== Daily Tasks Modal ========== */}
      {isDailyTasksModalOpen && (
        <DailyTasksModal
          isOpen={isDailyTasksModalOpen}
          onClose={handleDailyTasksClose}
          onCreditsUpdated={refreshCredits}
          onUpgradeClick={handleUpgradeClick}
        />
      )}

      {/* ========== Social Bar 广告 ========== */}
      <AdsterraSocialBar />
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