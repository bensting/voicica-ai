/**
 * 积分消耗配置类型定义
 */

import { ProductType } from '../productType';

/**
 * 积分消耗配置接口
 */
export interface CreditsCostConfig {
  [key: string]: number;
}

/**
 * 产品类型积分消耗映射
 */
export type ProductCreditsCost = Record<ProductType, number>;