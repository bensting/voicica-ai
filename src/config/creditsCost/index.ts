/**
 * 积分消耗配置统一入口
 *
 * 根据环境变量自动选择开发或生产配置
 */

import { creditsCostConfig as devConfig } from './creditsCost.development';
import { creditsCostConfig as prodConfig } from './creditsCost.production';
import type { CreditsCostConfig } from './types';
import type { ProductType } from '../productType';

// 根据环境选择配置
const isProduction = process.env.NODE_ENV === 'production';
export const creditsCostConfig: CreditsCostConfig = isProduction ? prodConfig : devConfig;

// 导出类型
export type { CreditsCostConfig } from './types';

/**
 * 获取指定产品类型的积分消耗
 * @param productType 产品类型
 * @returns 积分消耗数量
 */
export function getCreditsCost(productType: ProductType | string): number {
  return creditsCostConfig[productType] ?? 0;
}

/**
 * 获取所有产品类型的积分消耗配置（用于调试）
 */
export function getAllCreditsCosts() {
  return {
    environment: isProduction ? 'production' : 'development',
    config: creditsCostConfig,
  };
}