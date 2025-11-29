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

/**
 * 语音成本配置
 *
 * 计费规则：每 unit_chars 个字符消耗对应积分，不足 unit_chars 也按一个单位计算
 * 例如：unit_chars=100, standard=1 时，101个字符消耗2积分
 */
export interface VoiceCostConfig {
  /** 计费单位（字符数），默认100 */
  unit_chars: number;
  /** 标准语音每单位消耗积分 */
  standard: number;
  /** 专业语音每单位消耗积分 */
  professional: number;
  /** 特殊语音每单位消耗积分 */
  special: number;
  /** 克隆语音每单位消耗积分 */
  clone: number;
}