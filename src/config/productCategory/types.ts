/**
 * 产品分类配置类型定义
 *
 * ProductCategory 是比 ProductType 更高一层的概念：
 * - ProductCategory: AI Video, AI Music, AI Voice (产品大类)
 * - ProductType: text_to_speech, voice_cloning (具体产品类型)
 */

/**
 * 产品分类枚举值
 */
export const ProductCategory = {
  AI_VIDEO: 'ai_video',
  AI_MUSIC: 'ai_music',
  AI_VOICE: 'ai_voice',
} as const;

export type ProductCategoryType = (typeof ProductCategory)[keyof typeof ProductCategory];

/**
 * 产品分类配置项
 */
export interface ProductCategoryItem {
  /** 分类标识 */
  id: ProductCategoryType;
  /** 显示标签的 i18n key */
  labelKey: string;
  /** 是否启用 */
  enabled: boolean;
  /** 排序权重 */
  order: number;
}

/**
 * 产品分类配置
 */
export interface ProductCategoryConfig {
  /** 所有分类列表 */
  categories: ProductCategoryItem[];
  /** 默认选中的分类 */
  defaultCategory: ProductCategoryType;
}