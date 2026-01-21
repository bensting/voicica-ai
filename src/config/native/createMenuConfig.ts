/**
 * 创建菜单配置 (Native App)
 */

export type CreateMenuIcon = 'video' | 'music' | 'cover' | 'voice' | 'effect' | 'swap' | 'image';

export interface CreateMenuItem {
  id: string;
  icon: CreateMenuIcon;
  title: string;
  description: string;
  href: string;
  /** 环境启用配置 */
  enabled: {
    development: boolean;
    production: boolean;
  };
}

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * 创建菜单配置
 * enabled.development - 开发环境是否显示
 * enabled.production - 生产环境是否显示
 */
export const createMenuItems: CreateMenuItem[] = [
  {
    id: 'video',
    icon: 'video',
    title: 'AI Video',
    description: 'Generate videos from text or images',
    href: '/native/create/video',
    enabled: { development: true, production: true },
  },
  {
    id: 'music',
    icon: 'music',
    title: 'AI Music',
    description: 'Compose music from text descriptions',
    href: '/native/create/music',
    enabled: { development: true, production: false },
  },
  {
    id: 'cover',
    icon: 'cover',
    title: 'AI Cover',
    description: 'Create AI song covers with voice cloning',
    href: '/native/create/cover',
    enabled: { development: true, production: false },
  },
  {
    id: 'voice',
    icon: 'voice',
    title: 'AI Text to Voice',
    description: 'Convert text to natural speech',
    href: '/native/create/voice',
    enabled: { development: true, production: false },
  },
  {
    id: 'effect',
    icon: 'effect',
    title: 'AI Effect',
    description: 'Convert image into video with templates',
    href: '/native/create/effect',
    enabled: { development: true, production: false },
  },
  {
    id: 'swap',
    icon: 'swap',
    title: 'Character Swap',
    description: 'Swap a character into your video',
    href: '/native/create/swap',
    enabled: { development: true, production: false },
  },
  {
    id: 'image',
    icon: 'image',
    title: 'AI Image',
    description: 'Create images from text descriptions',
    href: '/native/create/image',
    enabled: { development: true, production: false },
  },
];

/**
 * 获取当前环境可用的菜单项
 */
export function getAvailableMenuItems(): CreateMenuItem[] {
  return createMenuItems.filter((item) => {
    return isDevelopment ? item.enabled.development : item.enabled.production;
  });
}
