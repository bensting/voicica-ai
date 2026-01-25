/**
 * 创建菜单配置 (Native App)
 * 用于 FeatureGrid 和 CreateSheet 两个组件
 */

/** 功能类别 */
export type CreateMenuCategory = 'voiceover' | 'music' | 'video' | 'tools';

/** 图标类型 */
export type CreateMenuIcon = 'music' | 'cover' | 'voice' | 'dialogue' | 'video' | 'clone' | 'tiktok' | 'youtube';

/** 类别配置 */
export interface CategoryConfig {
  id: CreateMenuCategory;
  title: string;
  order: number;
  color: string;
}

/** 类别配置列表 */
export const categoryConfigs: CategoryConfig[] = [
  { id: 'voiceover', title: 'VOICEOVER AI', order: 1, color: 'purple' },
  { id: 'music', title: 'MUSIC AI', order: 2, color: 'pink' },
  { id: 'video', title: 'VIDEO AI', order: 3, color: 'blue' },
  { id: 'tools', title: 'OTHER TOOLS', order: 4, color: 'cyan' },
];

export interface CreateMenuItem {
  id: string;
  icon: CreateMenuIcon;
  /** 功能类别 */
  category: CreateMenuCategory;
  /** 完整标题 (用于 CreateSheet) */
  title: string;
  /** 短名称 (用于 FeatureGrid) */
  shortName: string;
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
 * category - 功能类别 (voiceover / music / video / tools)
 * enabled.development - 开发环境是否显示
 * enabled.production - 生产环境是否显示
 */
export const createMenuItems: CreateMenuItem[] = [
  // ========== Voiceover 类别 ==========
  {
    id: 'voice',
    icon: 'voice',
    category: 'voiceover',
    title: 'Text to Voice',
    shortName: 'Text to Voice',
    description: 'Convert text to natural speech',
    href: '/native/create/voice',
    enabled: { development: true, production: true },
  },
  {
    id: 'dialogue',
    icon: 'dialogue',
    category: 'voiceover',
    title: 'Text to Dialogue',
    shortName: 'Text to Dialogue',
    description: 'Create multi-character dialogues',
    href: '/native/create/dialogue',
    enabled: { development: true, production: true },
  },
  {
    id: 'clone',
    icon: 'clone',
    category: 'voiceover',
    title: 'Voice Clone',
    shortName: 'Voice Clone',
    description: 'Clone your voice with AI',
    href: '/native/create/clone',
    enabled: { development: true, production: false },
  },

  // ========== AI Music 类别 ==========
  {
    id: 'music',
    icon: 'music',
    category: 'music',
    title: 'AI Music',
    shortName: 'AI Music',
    description: 'Compose music from text descriptions',
    href: '/native/create/music',
    enabled: { development: true, production: true },
  },
  {
    id: 'cover',
    icon: 'cover',
    category: 'music',
    title: 'AI Cover',
    shortName: 'AI Cover',
    description: 'Create AI song covers with voice cloning',
    href: '/native/create/cover',
    enabled: { development: true, production: true },
  },

  // ========== AI Video 类别 ==========
  {
    id: 'video',
    icon: 'video',
    category: 'video',
    title: 'Text to Video',
    shortName: 'Text to Video',
    description: 'Generate videos from text prompts',
    href: '/native/create/video',
    enabled: { development: true, production: false },
  },

  // ========== AI Other Tools 类别 ==========
  {
    id: 'tiktok-downloader',
    icon: 'tiktok',
    category: 'tools',
    title: 'TikTok Downloader',
    shortName: 'TikTok Downloader',
    description: 'Download TikTok videos without watermark',
    href: '/native/tools/tiktok',
    enabled: { development: true, production: true },
  },
  {
    id: 'youtube-downloader',
    icon: 'youtube',
    category: 'tools',
    title: 'YouTube Downloader',
    shortName: 'YouTube Downloader',
    description: 'Download YouTube videos and audio',
    href: '/native/tools/youtube',
    enabled: { development: true, production: true },
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

/**
 * 按类别获取菜单项
 */
export function getMenuItemsByCategory(category: CreateMenuCategory): CreateMenuItem[] {
  return getAvailableMenuItems().filter((item) => item.category === category);
}

/**
 * 获取有内容的类别（按顺序）
 */
export function getAvailableCategories(): CategoryConfig[] {
  const availableItems = getAvailableMenuItems();
  const categoriesWithItems = new Set(availableItems.map((item) => item.category));
  return categoryConfigs
    .filter((config) => categoriesWithItems.has(config.id))
    .sort((a, b) => a.order - b.order);
}

/**
 * 根据类别 ID 获取类别配置
 */
export function getCategoryConfig(categoryId: CreateMenuCategory): CategoryConfig | undefined {
  return categoryConfigs.find((config) => config.id === categoryId);
}
