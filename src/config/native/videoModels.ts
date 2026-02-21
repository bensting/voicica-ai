/**
 * AI Video 模型配置 (Native App)
 */

// 画质选项
export interface QualityOption {
  value: string;      // 如 '512p', '768p', '1080p'
  label: string;      // 显示文本
  isPro?: boolean;    // 是否为 Pro 功能
}

// 时长选项
export interface DurationOption {
  value: string;      // 如 '5s', '8s'
  label: string;
}

// 积分矩阵类型：creditsMatrix[quality][duration] = credits
export type CreditsMatrix = Record<string, Record<string, number>>;

// 宽高比选项
export interface AspectRatioOption {
  value: string;      // 如 '16:9', '9:16'
  label: string;
  icon: 'landscape' | 'portrait' | 'square' | 'classic';
}

// 图片引导配置
export interface ImageGuidanceConfig {
  enabled: boolean;
  /** 'single' = 单图, 'startEnd' = 首尾帧, 'multi' = 多图参考 */
  mode: 'single' | 'startEnd' | 'multi';
  /** 多图模式下最大图片数量 */
  maxImages?: number;
}

// 模型特有选项配置
export interface ModelOptionsConfig {
  /** 固定镜头选项 */
  fixedLens?: boolean;
  /** 生成音频选项 */
  generateAudio?: boolean;
}

// 模型配置
export interface VideoModel {
  id: string;
  name: string;
  description: string;
  icon: 'seedance';
  /** 后端 API 使用的模型 ID */
  apiModelId: string;
  enabled: {
    development: boolean;
    production: boolean;
  };
  // 参数配置
  qualityOptions: QualityOption[];
  durationOptions: DurationOption[];
  aspectRatioOptions: AspectRatioOption[];
  /** 积分矩阵：creditsMatrix[quality][duration] = credits */
  creditsMatrix: CreditsMatrix;
  defaultQuality: string;
  defaultDuration: string;
  defaultAspectRatio: string;
  // 图片引导配置
  imageGuidance?: ImageGuidanceConfig;
  // 模型特有选项
  modelOptions?: ModelOptionsConfig;
}

// Seedance 宽高比 (包含 21:9)
const seedanceAspectRatios: AspectRatioOption[] = [
  { value: '16:9', label: '16:9', icon: 'landscape' },
  { value: '21:9', label: '21:9', icon: 'landscape' },
  { value: '4:3', label: '4:3', icon: 'classic' },
  { value: '1:1', label: '1:1', icon: 'square' },
  { value: '3:4', label: '3:4', icon: 'portrait' },
  { value: '9:16', label: '9:16', icon: 'portrait' },
];

export const videoModelsConfig: VideoModel[] = [
  {
    id: 'seedance-1.5-pro',
    name: 'Seedance 1.5 Pro',
    description: 'Cinematic video with character consistency',
    icon: 'seedance',
    apiModelId: 'bytedance/seedance-1.5-pro',
    enabled: { development: true, production: true },
    qualityOptions: [
      { value: '480p', label: '480p' },
      { value: '720p', label: '720p' },
    ],
    durationOptions: [
      { value: '4s', label: '4s' },
      { value: '8s', label: '8s' },
      { value: '12s', label: '12s' },
    ],
    aspectRatioOptions: seedanceAspectRatios,
    // 基础积分（无音频），有音频时 x2
    creditsMatrix: {
      '480p': { '4s': 400, '8s': 800, '12s': 1200 },
      '720p': { '4s': 800, '8s': 1600, '12s': 2400 },
    },
    defaultQuality: '480p',
    defaultDuration: '4s',
    defaultAspectRatio: '16:9',
    imageGuidance: { enabled: true, mode: 'multi', maxImages: 2 },
    modelOptions: { fixedLens: true, generateAudio: true },
  },
];

// 根据环境过滤可用的模型
export const videoModels = videoModelsConfig.filter(
  (model) => (process.env.NODE_ENV === 'development' ? model.enabled.development : model.enabled.production)
);

// 默认选择 Seedance 1.5 Pro
export const defaultVideoModel = videoModels[0];

// 根据模型、画质、时长和音频选项计算积分
export function calculateCredits(
  model: VideoModel,
  quality: string,
  duration: string,
  generateAudio?: boolean
): number {
  const baseCredits = model.creditsMatrix[quality]?.[duration] || 0;
  // 如果模型支持音频生成且启用了音频，积分翻倍
  if (model.modelOptions?.generateAudio && generateAudio) {
    return baseCredits * 2;
  }
  return baseCredits;
}

// 获取模型的默认参数
export function getModelDefaults(model: VideoModel) {
  return {
    quality: model.defaultQuality,
    duration: model.defaultDuration,
    aspectRatio: model.defaultAspectRatio,
  };
}
