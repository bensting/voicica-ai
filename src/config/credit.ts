/**
 * 产品类型常量配置
 *
 * 项目级别的产品类型定义，用于：
 * - credit_history 表的 product_type 字段
 * - user_subscriptions 表的 product_type 字段
 * - 其他需要区分产品类型的场景
 */

/**
 * 产品类型枚举
 */
export const ProductType = {
  /** 文字转语音 */
  TEXT_TO_SPEECH: 'text_to_speech',
  // 未来扩展:
  // /** 音乐生成 */
  // MUSIC: 'music',
  // /** 语音克隆 */
  // VOICE_CLONE: 'voice_clone',
} as const;

export type ProductType = typeof ProductType[keyof typeof ProductType];