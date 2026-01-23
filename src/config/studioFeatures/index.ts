/**
 * Studio 首页功能入口配置统一入口
 *
 * 根据环境变量自动选择开发或生产配置
 */

import { studioFeatureItems as devItems } from './features.development';
import { studioFeatureItems as prodItems } from './features.production';
import type { StudioFeatureItem } from './types';

// 根据环境选择配置
const isProduction = process.env.NODE_ENV === 'production';
export const studioFeatureItems: StudioFeatureItem[] = isProduction ? prodItems : devItems;

// 导出类型
export type { StudioFeatureItem };

/**
 * 获取所有启用的功能入口
 */
export function getEnabledFeatures(): StudioFeatureItem[] {
  return studioFeatureItems.filter(item => item.enabled !== false);
}

/**
 * 根据 ID 获取功能入口
 */
export function getFeatureById(id: string): StudioFeatureItem | undefined {
  return studioFeatureItems.find(item => item.id === id);
}
