/**
 * Mobile Bottom Navigation 配置统一入口
 *
 * 根据环境变量自动选择开发或生产配置
 */

import { mobileBottomNavItems as devItems } from './nav.development';
import { mobileBottomNavItems as prodItems } from './nav.production';
import type { MobileNavItemConfig } from './types';

// 根据环境选择配置
const isProduction = process.env.NODE_ENV === 'production';
export const mobileBottomNavItems: MobileNavItemConfig[] = isProduction ? prodItems : devItems;

// 导出类型
export type { MobileNavItemConfig };

/**
 * 获取所有启用的导航项
 */
export function getEnabledNavItems(): MobileNavItemConfig[] {
  return mobileBottomNavItems.filter(item => item.enabled !== false);
}

/**
 * 根据 ID 获取导航项
 */
export function getNavItemById(id: string): MobileNavItemConfig | undefined {
  return mobileBottomNavItems.find(item => item.id === id);
}
