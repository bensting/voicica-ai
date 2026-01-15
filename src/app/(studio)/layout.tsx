'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import StudioSidebar from '@/components/layout/studio/StudioSidebar';
import StudioTopNav from '@/components/layout/studio/StudioTopNav';
import UpgradeModal from '@/components/features/pricing/UpgradeModal';
import { StudioProvider, useStudio } from '@/contexts/StudioContext';
import { useCredits } from '@/contexts/CreditsContext';
import { useDailyTasks } from '@/hooks/useDailyTasks';

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

  // 每日任务 - 统一在 layout 管理，避免重复弹窗
  const {
    shouldShowPopup,
    markPopupShown,
    dismissPopup,
  } = useDailyTasks();

  // 用于追踪是否已经处理过自动弹窗
  const autoPopupHandledRef = useRef(false);

  // 自动弹窗逻辑
  useEffect(() => {
    // 如果应该显示弹窗且弹窗当前未打开且尚未处理过
    if (shouldShowPopup && !isDailyTasksModalOpen && !autoPopupHandledRef.current) {
      console.log('[DailyTasks] Auto-popup triggered');
      autoPopupHandledRef.current = true;
      setIsDailyTasksModalOpen(true);
    }
    // 当 shouldShowPopup 变为 false 时，重置标志以允许下次自动弹窗
    if (!shouldShowPopup) {
      autoPopupHandledRef.current = false;
    }
  }, [shouldShowPopup, isDailyTasksModalOpen]);

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
    markPopupShown(); // 记录已显示时间
    dismissPopup();   // 标记为已 dismiss
    setIsDailyTasksModalOpen(false);
    autoPopupHandledRef.current = false; // 重置，允许下一个周期自动弹窗
  }, [markPopupShown, dismissPopup]);

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