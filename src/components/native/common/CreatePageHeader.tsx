/**
 * 创建页面通用头部组件
 * 包含返回按钮、标题下拉、和可选的右侧内容
 */
'use client';

import { useState, useCallback } from 'react';
import CreateSheet from '@/components/native/CreateSheet';

interface CreatePageHeaderProps {
  /** 页面标题 */
  title: string;
  /** 是否显示 CreateSheet 下拉 */
  showCreateSheet?: boolean;
  /** 右侧自定义内容 */
  rightContent?: React.ReactNode;
}

// 返回图标
const BackIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

// 下拉箭头图标
const ChevronDownIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export default function CreatePageHeader({
  title,
  showCreateSheet = true,
  rightContent,
}: CreatePageHeaderProps) {
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);

  const goBack = useCallback(() => {
    window.location.href = '/native';
  }, []);

  return (
    <>
      <header
        className="sticky top-0 z-30 bg-[#0a0a1a]"
        style={{ paddingTop: 'var(--safe-area-inset-top, 0px)' }}
      >
        <div className="flex items-center justify-between px-4 h-14">
          {/* 返回按钮 */}
          <button
            onClick={goBack}
            className="p-2 -ml-2 text-white hover:text-gray-300 transition-colors"
          >
            <BackIcon />
          </button>

          {/* 标题（可点击打开 CreateSheet） */}
          {showCreateSheet ? (
            <button
              onClick={() => setIsCreateSheetOpen(true)}
              className="flex items-center gap-1 text-white font-semibold"
            >
              <span>{title}</span>
              <ChevronDownIcon />
            </button>
          ) : (
            <span className="text-white font-semibold">{title}</span>
          )}

          {/* 右侧内容或占位 */}
          {rightContent || <div className="w-10" />}
        </div>
      </header>

      {/* CreateSheet - 切换工具 */}
      {showCreateSheet && (
        <CreateSheet
          isOpen={isCreateSheetOpen}
          onClose={() => setIsCreateSheetOpen(false)}
        />
      )}
    </>
  );
}
