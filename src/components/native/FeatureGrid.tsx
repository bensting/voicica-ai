'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  getAvailableMenuItems,
  getCategoryConfig,
  CreateMenuIcon,
} from '@/config/native/createMenuConfig';
import { type LuckyDrawIcon } from '@/config/native/luckyDrawConfig';
import { getActiveDrawsByProduct, type ActiveDrawInfo } from '@/actions/lucky-draw';
import { useLanguage } from '@/contexts/LanguageContext';

// 图标组件 (w-6 h-6 for FeatureGrid)
const MusicIcon = () => (
  <svg
    className="w-6 h-6"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

const CoverIcon = () => (
  <svg
    className="w-6 h-6"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
    <path d="M19 10v2a7 7 0 01-14 0v-2" />
    <path d="M8 21h8" />
    <path d="M12 17v4" />
    <path d="M3 9l2-2m0 0l2 2m-2-2v6" />
    <path d="M21 9l-2-2m0 0l-2 2m2-2v6" />
  </svg>
);

const VoiceIcon = () => (
  <svg
    className="w-6 h-6"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
    <path d="M19 10v2a7 7 0 01-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const DialogueIcon = () => (
  <svg
    className="w-6 h-6"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    <path d="M8 10h.01M12 10h.01M16 10h.01" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const VideoIcon = () => (
  <svg
    className="w-6 h-6"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" />
  </svg>
);

const CloneIcon = () => (
  <svg
    className="w-6 h-6"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <circle cx="12" cy="7" r="4" />
    <path d="M5.5 21a6.5 6.5 0 0113 0" />
    <path d="M16 11l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DownloadIcon = () => (
  <svg
    className="w-6 h-6"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="7,10 12,15 17,10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const ImageIcon = () => (
  <svg
    className="w-6 h-6"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
);

const ImageToolsIcon = () => (
  <svg
    className="w-6 h-6"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M17.8 6.2L19 5M12.2 11.8L11 13M12.2 6.2L11 5" />
    <path d="M3 21l9-9" strokeLinecap="round" />
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
  'video-download': DownloadIcon,
  image: ImageIcon,
  'image-tools': ImageToolsIcon,
};

// 颜色映射 - 图标颜色和背景渐变（按类别）
const colorMap: Record<string, { icon: string; bg: string }> = {
  purple: { icon: 'text-purple-400', bg: 'bg-purple-500/20' },
  pink: { icon: 'text-pink-400', bg: 'bg-pink-500/20' },
  cyan: { icon: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  blue: { icon: 'text-red-400', bg: 'bg-red-500/20' },
  emerald: { icon: 'text-orange-400', bg: 'bg-orange-500/20' },
};

// Lucky Draw 图标映射
const luckyDrawIconMap: Record<LuckyDrawIcon, React.ReactNode> = {
  trophy: (
    <svg className="relative w-6 h-6 drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
    </svg>
  ),
  coin: (
    <svg className="relative w-6 h-6 drop-shadow-[0_0_6px_rgba(52,211,153,0.4)]" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#10B981" />
      <circle cx="12" cy="12" r="8" fill="none" stroke="#34D399" strokeWidth="0.5" />
      <path d="M12 6v1.5m0 9V18m-2.5-8.5c0-.83.67-1.5 1.5-1.5h2c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-2c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h2c.83 0 1.5-.67 1.5-1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

/**
 * 功能入口网格
 * 4 列统一网格 + 按类别彩色图标
 */
export default function FeatureGrid() {
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const items = getAvailableMenuItems();
  const [navigating, setNavigating] = useState<string | null>(null);
  const [activeLuckyDraws, setActiveLuckyDraws] = useState<ActiveDrawInfo[]>([]);

  // 点击后显示 loading，pathname 变化后清除
  useEffect(() => {
    if (navigating) setNavigating(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleNavigate = useCallback((href: string) => {
    setNavigating(href);
    router.push(href);
  }, [router]);

  useEffect(() => {
    getActiveDrawsByProduct()
      .then(setActiveLuckyDraws)
      .catch(() => setActiveLuckyDraws([]));
    const interval = setInterval(() => {
      getActiveDrawsByProduct()
        .then(setActiveLuckyDraws)
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // 获取菜单项的翻译名称
  const getItemName = (id: string, fallback: string): string => {
    // 特殊处理 id 映射到翻译 key
    const keyMap: Record<string, string> = {
      'voice': 'voice',
      'dialogue': 'dialogue',
      'clone': 'clone',
      'music': 'music',
      'cover': 'cover',
      'image': 'image',
      'video': 'video',
      'video-downloader': 'videoDownloader',
      'image-tools': 'imageTools',
    };
    const translationKey = keyMap[id] || id;
    return t(`native.menu.items.${translationKey}.shortName`) || fallback;
  };

  return (
    <>
      <div className="py-4 px-4 space-y-3">
        {/* AI 工具网格 */}
        <div className="grid grid-cols-4 gap-3">
          {items.map((feature) => {
            const IconComponent = iconMap[feature.icon];
            const categoryConfig = getCategoryConfig(feature.category);
            const colors = colorMap[categoryConfig?.color || 'purple'];
            return (
              <button
                key={feature.id}
                onClick={() => handleNavigate(feature.href)}
                className={`flex flex-col items-center justify-center aspect-square rounded-2xl ${colors.bg} hover:opacity-80 active:scale-95 transition-all`}
              >
                <div className={`${colors.icon} mb-1.5`}>
                  <IconComponent />
                </div>
                <span className="text-[10px] text-gray-300 font-medium text-center leading-tight px-1 line-clamp-2">
                  {getItemName(feature.id, feature.shortName)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Lucky Draw 入口 */}
        {activeLuckyDraws.length > 0 && (
          <div className="flex gap-3">
            {activeLuckyDraws.map((draw) => {
              const [line1, line2] = draw.shortLabel.split('\n');
              return (
                <Link
                  key={draw.drawId}
                  href={draw.href}
                  className="relative overflow-hidden flex flex-col items-center justify-center w-1/3 py-3 px-2 rounded-2xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-500/10 hover:opacity-80 transition-opacity"
                >
                  {/* 微光 */}
                  <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-amber-400/8 blur-[25px]" />
                  {/* FREE 标签 */}
                  <span className="absolute top-1.5 right-1.5 text-[7px] font-bold px-1 py-0.5 rounded-full bg-emerald-500/80 text-white leading-none">
                    FREE
                  </span>
                  {/* 图标 + 动画 */}
                  <div className="relative text-amber-400 mb-1.5 animate-bounce-slow">
                    <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-md animate-pulse" />
                    {luckyDrawIconMap[draw.icon as LuckyDrawIcon]}
                  </div>
                  {/* 文案 */}
                  <span className="relative text-[10px] text-amber-300/90 font-semibold leading-tight text-center">{line1}</span>
                  {line2 && <span className="relative text-[9px] text-amber-200/50 leading-tight text-center truncate w-full">{line2}</span>}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* 全屏 loading 遮罩 */}
      {navigating && (
        <div className="fixed inset-0 z-[9999] bg-[#060613]/90 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
            <span className="text-white/50 text-sm">Loading...</span>
          </div>
        </div>
      )}
    </>
  );
}
