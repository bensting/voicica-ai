/**
 * 产品分类配置 - 开发环境
 */

import { ProductCategory, ProductCategoryConfig } from './types';

export const productCategoryConfig: ProductCategoryConfig = {
  categories: [
    {
      id: ProductCategory.AI_VIDEO,
      labelKey: 'productCategory.aiVideo',
      enabled: true,
      order: 1,
    },
    {
      id: ProductCategory.AI_MUSIC,
      labelKey: 'productCategory.aiMusic',
      enabled: true,
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