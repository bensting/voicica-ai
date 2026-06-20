'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createMenuItems, CreateMenuIcon, type CreateMenuItem } from '@/config/native/createMenuConfig';
import { getFeatureFlags, type FeatureFlags } from '@/actions/admin/system-config';

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

const DownloadIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="7,10 12,15 17,10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const ImageIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
);

const ImageToolsIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M17.8 6.2L19 5M12.2 11.8L11 13M12.2 6.2L11 5" />
    <path d="M3 21l9-9" strokeLinecap="round" />
  </svg>
);

const ArrowIcon = () => (
  <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

// 图标映射
const iconMap: Record<CreateMenuIcon, React.FC> = {
  music: MusicIcon,
  voice: VoiceIcon,
  dialogue: DialogueIcon,
  video: VideoIcon,
  clone: CloneIcon,
  'video-download': DownloadIcon,
  image: ImageIcon,
  'image-tools': ImageToolsIcon,
};

/**
 * 创建功能底部弹出菜单
 * 点击 "+" 按钮后显示
 */
export default function CreateSheet({ isOpen, onClose }: CreateSheetProps) {
  const [menuItems, setMenuItems] = useState<CreateMenuItem[]>(createMenuItems.filter(i => i.enabled.production));

  // 根据 DB feature flags 过滤菜单项（与 FeatureGrid 逻辑一致）
  useEffect(() => {
    getFeatureFlags().then((flags: FeatureFlags) => {
      setMenuItems(createMenuItems.filter(i => flags[i.id as keyof FeatureFlags] !== false));
    });
  }, []);

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
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:absolute"
        onClick={onClose}
      />

      {/* 菜单内容 */}
      <div
        className="fixed left-0 right-0 z-50 bg-gray-900 rounded-t-3xl animate-slide-up lg:absolute"
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

        <div className="pb-3" />
      </div>
    </>
  );
}
