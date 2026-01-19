'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { getAvailableMenuItems, CreateMenuIcon } from '@/config/native/createMenuConfig';

interface CreateSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

// 图标组件
const VideoIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M10 9l5 3-5 3V9z" fill="currentColor" stroke="none" />
  </svg>
);

const MusicIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

const VoiceIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
    <path d="M19 10v2a7 7 0 01-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const EffectIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
    <path d="M5 19l1 3 1-3 3-1-3-1-1-3-1 3-3 1 3 1z" />
  </svg>
);

const SwapIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="9" cy="7" r="4" />
    <path d="M3 21v-2a4 4 0 014-4h4" />
    <circle cx="17" cy="17" r="3" />
    <path d="M14 14l6 6" />
  </svg>
);

const ImageIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
);

const ArrowIcon = () => (
  <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// 图标映射
const iconMap: Record<CreateMenuIcon, React.FC> = {
  video: VideoIcon,
  music: MusicIcon,
  voice: VoiceIcon,
  effect: EffectIcon,
  swap: SwapIcon,
  image: ImageIcon,
};

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
          {menuItems.map((item) => {
            const IconComponent = iconMap[item.icon];
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 bg-gray-800/60 rounded-xl hover:bg-gray-700/60 transition-colors"
              >
                <div className="text-gray-300">
                  <IconComponent />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white text-sm font-medium">{item.title}</h3>
                  <p className="text-xs text-gray-400 truncate">{item.description}</p>
                </div>
                <ArrowIcon />
              </Link>
            );
          })}
        </div>

        {/* Close Button */}
        <div className="flex justify-center pb-3">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <CloseIcon />
          </button>
        </div>
      </div>
    </>
  );
}
