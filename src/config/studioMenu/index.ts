/**
 * Studio 侧边栏菜单配置统一入口
 *
 * 根据环境变量自动选择开发或生产配置
 */

import { studioMenuItems as devItems } from './menu.development';
import { studioMenuItems as prodItems } from './menu.production';
import type { StudioMenuItemConfig, StudioMenuCategories, MenuCategory } from './types';

// 根据环境选择配置
const isProduction = process.env.NODE_ENV === 'production';
export const studioMenuItems: StudioMenuItemConfig[] = isProduction ? prodItems : devItems;

// 导出类型
export type { StudioMenuItemConfig, StudioMenuCategories, MenuCategory };

/**
 * 按分类组织的菜单项（只包含启用的项）
 */
export const studioMenuCategories: StudioMenuCategories = {
  main: studioMenuItems.filter(item => !item.category && (item.enabled !== false)),
  ai_video: studioMenuItems.filter(item => item.category === 'ai_video' && (item.enabled !== false)),
  voiceover: studioMenuItems.filter(item => item.category === 'voiceover' && (item.enabled !== false)),
  story: studioMenuItems.filter(item => item.category === 'story' && (item.enabled !== false)),
  music: studioMenuItems.filter(item => item.category === 'music' && (item.enabled !== false)),
  tools: studioMenuItems.filter(item => item.category === 'tools' && (item.enabled !== false)),
  account: studioMenuItems.filter(item => item.category === 'account' && (item.enabled !== false)),
};

/**
 * 获取指定分类的菜单项
 */
export function getMenuItemsByCategory(
  category: MenuCategory,
  enabledOnly: boolean = true
): StudioMenuItemConfig[] {
  const items = studioMenuItems.filter(item => {
    if (category === 'main') {
      return !item.category;
    }
    return item.category === category;
  });

  if (enabledOnly) {
    return items.filter(item => item.enabled !== false);
  }

  return items;
}

/**
 * 获取所有启用的菜单项
 */
export function getAllEnabledMenuItems(): StudioMenuItemConfig[] {
  return studioMenuItems.filter(item => item.enabled !== false);
}

/**
 * 根据 ID 获取菜单项
 */
export function getMenuItemById(id: string): StudioMenuItemConfig | undefined {
  return studioMenuItems.find(item => item.id === id);
}
