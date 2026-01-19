'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { getAvailableMenuItems } from '@/config/native/createMenuConfig';

interface CreateSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const ArrowIcon = () => (
  <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

/**
 * 创建功能底部弹出菜单
 * 点击 "+" 按钮后显示
 */
export default function CreateSheet({ isOpen, onClose }: CreateSheetProps) {
  // 禁止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const menuItems = getAvailableMenuItems();

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 菜单内容 */}
      <div
        className="fixed left-0 right-0 z-50 bg-gray-900 rounded-t-3xl animate-slide-up"
        style={{
          bottom: 'calc(64px + var(--safe-area-inset-bottom, 0px))',
        }}
      >
        <div className="p-3 space-y-1.5">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 bg-gray-800/60 rounded-xl hover:bg-gray-700/60 transition-colors"
            >
              <div className="text-gray-300">{item.icon}</div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white text-sm font-medium">{item.title}</h3>
                <p className="text-xs text-gray-400 truncate">{item.description}</p>
              </div>
              <ArrowIcon />
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}