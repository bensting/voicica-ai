/**
 * 产品类型常量配置
 *
 * 项目级别的产品类型定义，用于：
 * - credit_history 表的 product_type 字段
 * - user_subscriptions 表的 product_type 字段
 * - 订阅计划配置的 product_type 字段
 * - 其他需要区分产品类型的场景
 *
 * 注意：与 src/config/subscription/types.ts 中的 ProductType 类型保持一致
 */

/**
 * 产品类型枚举
 */
export const ProductType = {
  /** 文字转语音 */
  TEXT_TO_SPEECH: 'text_to_speech',
  /** 文字转视频 */
  TEXT_TO_VIDEO: 'text_to_video',
  /** AI 音乐生成 */
  AI_MUSIC: 'ai_music',
  /** 语音克隆 */
  VOICE_CLONING: 'voice_cloning',
  /** YouTube 视频下载器 */
  YOUTUBE_DOWNLOADER: 'youtube_downloader',
  /** TikTok 视频下载器 */
  TIKTOK_DOWNLOADER: 'tiktok_downloader',
  /** 订阅充值 */
  SUBSCRIPTION: 'subscription',
  /** 故事创意生成 */
  STORY_IDEAS: 'story_ideas',
  /** 故事内容生成 */
  STORY_GENERATE: 'story_generate',
  /** 故事插图生成 */
  STORY_ILLUSTRATION: 'story_illustration',
  /** AI 图片生成 */
  IMAGE: 'image',
} as const;

export type ProductType = typeof ProductType[keyof typeof ProductType];