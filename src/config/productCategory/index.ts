/**
 * 产品分类配置统一入口
 *
 * 根据环境变量自动选择开发或生产配置
 */

import { productCategoryConfig as devConfig } from './config.development';
import { productCategoryConfig as prodConfig } from './config.production';
import type {
  ProductCategoryConfig,
  ProductCategoryItem,
  ProductCategoryType,
} from './types';
import { ProductCategory } from './types';

// 根据环境选择配置
const isProduction = process.env.NODE_ENV === 'production';
export const productCategoryConfig: ProductCategoryConfig = isProduction
  ? prodConfig
  : devConfig;

// 导出枚举和类型
export { ProductCategory };
export type { ProductCategoryConfig, ProductCategoryItem, ProductCategoryType };

/**
 * 获取所有启用的产品分类
 */
export function getEnabledCategories(): ProductCategoryItem[] {
  return productCategoryConfig.categories
    .filter((cat) => cat.enabled)
    .sort((a, b) => a.order - b.order);
}

/**
 * 获取默认产品分类
 */
export function getDefaultCategory(): ProductCategoryType {
  return productCategoryConfig.defaultCategory;
}

/**
 * 根据 ID 获取分类配置
 */
export function getCategoryById(
  id: ProductCategoryType
): ProductCategoryItem | undefined {
  return productCategoryConfig.categories.find((cat) => cat.id === id);
}

/**
 * 检查分类是否启用
 */
export function isCategoryEnabled(id: ProductCategoryType): boolean {
  const category = getCategoryById(id);
  return category?.enabled ?? false;
}