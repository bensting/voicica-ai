/**
 * 积分使用规则配置类型定义
 */

import { ProductCategoryType } from '../productCategory';

/**
 * 单个功能的积分消耗规则
 */
export interface CreditsUsageFeature {
  /** 功能名称 */
  name: string;
  /** 积分消耗（如 "1/100 chars", "10/min", "100/voice"） */
  cost: string;
  /** 详细描述（可选） */
  description?: string;
}

/**
 * 功能分类
 */
export interface CreditsUsageCategory {
  /** 分类标识，关联 ProductCategory */
  id: ProductCategoryType;
  /** 分类显示名称 */
  name: string;
  /** 该分类下的功能列表 */
  features: CreditsUsageFeature[];
}

/**
 * 积分使用规则数据
 */
export interface CreditsUsageData {
  /** 所有分类 */
  categories: CreditsUsageCategory[];
}