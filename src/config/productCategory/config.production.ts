/**
 * 产品分类配置 - 生产环境
 *
 * 生产环境可能只启用部分分类
 */

import { ProductCategory, ProductCategoryConfig } from './types';

export const productCategoryConfig: ProductCategoryConfig = {
  categories: [
    {
      id: ProductCategory.AI_VIDEO,
      labelKey: 'productCategory.aiVideo',
      enabled: false, // 生产环境暂未上线
      order: 1,
    },
    {
      id: ProductCategory.AI_MUSIC,
      labelKey: 'productCategory.aiMusic',
      enabled: false, // 生产环境暂未上线
      order: 2,
    },
    {
      id: ProductCategory.AI_VOICE,
      labelKey: 'productCategory.aiVoice',
      enabled: true,
      order: 3,
    },
  ],
  defaultCategory: ProductCategory.AI_VOICE,
};