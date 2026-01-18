'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface CreateSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

// 图标组件
const VideoIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M10 9l5 3-5 3V9z" fill="currentColor" stroke="none" />
  </svg>
);

const MusicIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

const EffectIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
    <path d="M5 19l1 3 1-3 3-1-3-1-1-3-1 3-3 1 3 1z" />
  </svg>
);

const SwapIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="9" cy="7" r="4" />
    <path d="M3 21v-2a4 4 0 014-4h4" />
    <circle cx="17" cy="17" r="3" />
    <path d="M14 14l6 6" />
  </svg>
);

const ImageIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
);

const ArrowIcon = () => (
  <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const createMenuItems = [
  {
    id: 'video',
    icon: <VideoIcon />,
    title: 'AI Video',
    description: 'Generate videos from text or images',
    href: '/native/create/video',
  },
  {
    id: 'music',
    icon: <MusicIcon />,
    title: 'AI Music',
    description: 'Compose music from text descriptions',
    href: '/native/create/music',
  },
  {
    id: 'effect',
    icon: <EffectIcon />,
    title: 'AI Effect',
    description: 'Convert image into video with templates',
    href: '/native/create/effect',
  },
  {
    id: 'swap',
    icon: <SwapIcon />,
    title: 'Character Swap',
    description: 'Swap a character into your video',
    href: '/native/create/swap',
  },
  {
    id: 'image',
    icon: <ImageIcon />,
    title: 'AI Image',
    description: 'Create images from text descriptions',
    href: '/native/create/image',
  },
];

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
        <div className="p-4 space-y-2">
          {createMenuItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-4 p-4 bg-gray-800/60 rounded-2xl hover:bg-gray-700/60 transition-colors"
            >
              <div className="text-gray-300">{item.icon}</div>
              <div className="flex-1">
                <h3 className="text-white font-medium">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.description}</p>
              </div>
              <ArrowIcon />
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
