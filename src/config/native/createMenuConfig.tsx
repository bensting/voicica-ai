import { ReactNode } from 'react';

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

export interface CreateMenuItem {
  id: string;
  icon: ReactNode;
  title: string;
  description: string;
  href: string;
  /** 是否只在开发环境显示 */
  devOnly?: boolean;
  /** 是否只在生产环境显示 */
  prodOnly?: boolean;
  /** 是否启用 */
  enabled?: boolean;
}

/**
 * 创建菜单配置
 * devOnly: true - 只在开发环境显示
 * prodOnly: true - 只在生产环境显示
 * enabled: false - 禁用该选项
 */
export const createMenuItems: CreateMenuItem[] = [
  {
    id: 'video',
    icon: <VideoIcon />,
    title: 'AI Video',
    description: 'Generate videos from text or images',
    href: '/native/create/video',
    enabled: true,
  },
  {
    id: 'music',
    icon: <MusicIcon />,
    title: 'AI Music',
    description: 'Compose music from text descriptions',
    href: '/native/create/music',
    enabled: true,
    devOnly: true, // 开发中
  },
  {
    id: 'voice',
    icon: <VoiceIcon />,
    title: 'AI Text to Voice',
    description: 'Convert text to natural speech',
    href: '/native/create/voice',
    enabled: true,
    devOnly: true, // 开发中
  },
  {
    id: 'effect',
    icon: <EffectIcon />,
    title: 'AI Effect',
    description: 'Convert image into video with templates',
    href: '/native/create/effect',
    enabled: true,
    devOnly: true, // 开发中
  },
  {
    id: 'swap',
    icon: <SwapIcon />,
    title: 'Character Swap',
    description: 'Swap a character into your video',
    href: '/native/create/swap',
    enabled: true,
    devOnly: true, // 开发中
  },
  {
    id: 'image',
    icon: <ImageIcon />,
    title: 'AI Image',
    description: 'Create images from text descriptions',
    href: '/native/create/image',
    enabled: true,
    devOnly: true, // 开发中
  },
];

/**
 * 获取当前环境可用的菜单项
 */
export function getAvailableMenuItems(): CreateMenuItem[] {
  const isDev = process.env.NODE_ENV === 'development';

  return createMenuItems.filter((item) => {
    // 未启用的直接过滤
    if (item.enabled === false) return false;

    // 只在开发环境显示的
    if (item.devOnly && !isDev) return false;

    // 只在生产环境显示的
    if (item.prodOnly && isDev) return false;

    return true;
  });
}