/**
 * 创建菜单配置 (Native App)
 * 用于 FeatureGrid 和 CreateSheet 两个组件
 */

/** 功能类别 */
export type CreateMenuCategory = 'music' | 'voice';

/** 图标类型 */
export type CreateMenuIcon = 'music' | 'cover' | 'voice' | 'dialogue';

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
 * category - 功能类别 (music / voice)
 * enabled.development - 开发环境是否显示
 * enabled.production - 生产环境是否显示
 */
export const createMenuItems: CreateMenuItem[] = [
  // ========== Music 类别 ==========
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

  // ========== Voice 类别 ==========
  {
    id: 'voice',
    icon: 'voice',
    category: 'voice',
    title: 'Text to Voice',
    shortName: 'Text to Voice',
    description: 'Convert text to natural speech',
    href: '/native/create/voice',
    enabled: { development: true, production: true },
  },
  {
    id: 'dialogue',
    icon: 'dialogue',
    category: 'voice',
    title: 'Text to Dialogue',
    shortName: 'Text to Dialogue',
    description: 'Create multi-character dialogues',
    href: '/native/create/dialogue',
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
