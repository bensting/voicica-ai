'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { getAvailableMenuItems, CreateMenuIcon } from '@/config/native/createMenuConfig';

interface CreateSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

// 图标组件
const MusicIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

const CoverIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
    <path d="M19 10v2a7 7 0 01-14 0v-2" />
    <path d="M8 21h8" />
    <path d="M12 17v4" />
    <path d="M3 9l2-2m0 0l2 2m-2-2v6" />
    <path d="M21 9l-2-2m0 0l-2 2m2-2v6" />
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

const DialogueIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    <path d="M8 10h.01M12 10h.01M16 10h.01" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const VideoIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" />
  </svg>
);

const CloneIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="7" r="4" />
    <path d="M5.5 21a6.5 6.5 0 0113 0" />
    <path d="M16 11l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TiktokIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
  </svg>
);

const YoutubeIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
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
  music: MusicIcon,
  cover: CoverIcon,
  voice: VoiceIcon,
  dialogue: DialogueIcon,
  video: VideoIcon,
  clone: CloneIcon,
  tiktok: TiktokIcon,
  youtube: YoutubeIcon,
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
