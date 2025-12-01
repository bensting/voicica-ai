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

/**
 * 视频分辨率类型
 */
export type VideoResolution = '768p' | '1080p';

/**
 * 视频时长类型（秒）
 */
export type VideoDuration = 5 | 8 | 10 | 15;

/**
 * 视频成本配置项
 */
export interface VideoCostItem {
  /** 分辨率 */
  resolution: VideoResolution;
  /** 时长（秒） */
  duration: VideoDuration;
  /** 积分消耗 */
  credits: number;
}

/**
 * 视频成本配置
 *
 * 计费规则：根据分辨率和时长固定收费
 */
export interface VideoCostConfig {
  /** 支持的视频模型 */
  models: string[];
  /** 成本配置列表 */
  costs: VideoCostItem[];
}