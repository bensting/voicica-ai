/**
 * AI Video 模型配置 (Native App)
 */

// 画质选项
export interface QualityOption {
  value: string;      // 如 '512p', '768p', '1080p'
  label: string;      // 显示文本
  credits: number;    // 消耗积分
  isPro?: boolean;    // 是否为 Pro 功能
}

// 时长选项
export interface DurationOption {
  value: string;      // 如 '5s', '8s'
  label: string;
  multiplier?: number; // 积分倍数（可选，用于时长影响积分）
}

// 宽高比选项
export interface AspectRatioOption {
  value: string;      // 如 '16:9', '9:16'
  label: string;
  icon: 'landscape' | 'portrait' | 'square' | 'classic';
}

// 模型配置
export interface VideoModel {
  id: string;
  name: string;
  description: string;
  icon: 'google' | 'openai' | 'topix' | 'vidu' | 'pixverse' | 'wan' | 'kling';
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
  defaultQuality: string;
  defaultDuration: string;
  defaultAspectRatio: string;
}

const isDevelopment = process.env.NODE_ENV === 'development';

// 通用宽高比选项
const standardAspectRatios: AspectRatioOption[] = [
  { value: '16:9', label: '16:9', icon: 'landscape' },
  { value: '9:16', label: '9:16', icon: 'portrait' },
];

const extendedAspectRatios: AspectRatioOption[] = [
  { value: '16:9', label: '16:9', icon: 'landscape' },
  { value: '4:3', label: '4:3', icon: 'classic' },
  { value: '1:1', label: '1:1', icon: 'square' },
  { value: '3:4', label: '3:4', icon: 'portrait' },
  { value: '9:16', label: '9:16', icon: 'portrait' },
];

export const videoModelsConfig: VideoModel[] = [
  {
    id: 'veo-3.1',
    name: 'Google Veo 3.1',
    description: 'The most capable model',
    icon: 'google',
    apiModelId: 'google:3@2', // Runware model ID
    enabled: { development: true, production: true },
    qualityOptions: [
      { value: '512p', label: '512p', credits: 100 },
      { value: '768p', label: '768p', credits: 125 },
      { value: '1080p', label: '1080p', credits: 200, isPro: true },
    ],
    durationOptions: [
      { value: '8s', label: '8s' },
    ],
    aspectRatioOptions: standardAspectRatios,
    defaultQuality: '768p',
    defaultDuration: '8s',
    defaultAspectRatio: '16:9',
  },
  {
    id: 'sora-2',
    name: 'Sora 2',
    description: 'Physics-aware video with rich audio',
    icon: 'openai',
    apiModelId: 'sora-2',
    enabled: { development: true, production: false },
    qualityOptions: [
      { value: '480p', label: '480p', credits: 80 },
      { value: '720p', label: '720p', credits: 120 },
      { value: '1080p', label: '1080p', credits: 180, isPro: true },
    ],
    durationOptions: [
      { value: '5s', label: '5s' },
      { value: '10s', label: '10s' },
      { value: '20s', label: '20s' },
    ],
    aspectRatioOptions: extendedAspectRatios,
    defaultQuality: '720p',
    defaultDuration: '10s',
    defaultAspectRatio: '16:9',
  },
  {
    id: 'topix-1.0',
    name: 'Topix 1.0',
    description: 'Fast cinematic motion & physics',
    icon: 'topix',
    apiModelId: 'topix-1.0',
    enabled: { development: true, production: false },
    qualityOptions: [
      { value: '360p', label: '360p', credits: 50 },
      { value: '540p', label: '540p', credits: 75 },
      { value: '720p', label: '720p', credits: 100 },
      { value: '1080p', label: '1080p', credits: 150, isPro: true },
    ],
    durationOptions: [
      { value: '5s', label: '5s' },
      { value: '8s', label: '8s' },
    ],
    aspectRatioOptions: extendedAspectRatios,
    defaultQuality: '720p',
    defaultDuration: '5s',
    defaultAspectRatio: '16:9',
  },
  {
    id: 'vidu-2.0',
    name: 'Vidu 2.0',
    description: 'Real motion transformation',
    icon: 'vidu',
    apiModelId: 'vidu-2.0',
    enabled: { development: true, production: false },
    qualityOptions: [
      { value: '512p', label: '512p', credits: 60 },
      { value: '720p', label: '720p', credits: 90 },
      { value: '1080p', label: '1080p', credits: 140, isPro: true },
    ],
    durationOptions: [
      { value: '4s', label: '4s' },
      { value: '8s', label: '8s' },
    ],
    aspectRatioOptions: standardAspectRatios,
    defaultQuality: '720p',
    defaultDuration: '4s',
    defaultAspectRatio: '16:9',
  },
  {
    id: 'pixverse-v5',
    name: 'Pixverse V5',
    description: 'Lightning-fast videos with crisp detail',
    icon: 'pixverse',
    apiModelId: 'pixverse-v5',
    enabled: { development: true, production: false },
    qualityOptions: [
      { value: '540p', label: '540p', credits: 40 },
      { value: '720p', label: '720p', credits: 60 },
      { value: '1080p', label: '1080p', credits: 100, isPro: true },
    ],
    durationOptions: [
      { value: '5s', label: '5s' },
      { value: '8s', label: '8s' },
    ],
    aspectRatioOptions: extendedAspectRatios,
    defaultQuality: '720p',
    defaultDuration: '5s',
    defaultAspectRatio: '16:9',
  },
  {
    id: 'wan-2.5',
    name: 'Wan 2.5',
    description: 'Affordable high-quality video with audio',
    icon: 'wan',
    apiModelId: 'wan-2.5',
    enabled: { development: true, production: false },
    qualityOptions: [
      { value: '480p', label: '480p', credits: 30 },
      { value: '720p', label: '720p', credits: 50 },
      { value: '1080p', label: '1080p', credits: 80, isPro: true },
    ],
    durationOptions: [
      { value: '5s', label: '5s' },
      { value: '10s', label: '10s' },
    ],
    aspectRatioOptions: standardAspectRatios,
    defaultQuality: '720p',
    defaultDuration: '5s',
    defaultAspectRatio: '16:9',
  },
  {
    id: 'kling-v2.5-turbo',
    name: 'Kling V2.5 Turbo',
    description: 'HDR video with smart world physics',
    icon: 'kling',
    apiModelId: 'kling-v2.5-turbo',
    enabled: { development: true, production: false },
    qualityOptions: [
      { value: '540p', label: '540p', credits: 45 },
      { value: '720p', label: '720p', credits: 70 },
      { value: '1080p', label: '1080p', credits: 120, isPro: true },
    ],
    durationOptions: [
      { value: '5s', label: '5s' },
      { value: '10s', label: '10s' },
    ],
    aspectRatioOptions: extendedAspectRatios,
    defaultQuality: '720p',
    defaultDuration: '5s',
    defaultAspectRatio: '16:9',
  },
];

// 根据环境过滤可用的模型
export const videoModels = videoModelsConfig.filter(
  (model) => (isDevelopment ? model.enabled.development : model.enabled.production)
);

export const defaultVideoModel = videoModels[0];

// 根据模型和当前选项计算积分
export function calculateCredits(model: VideoModel, quality: string): number {
  const qualityOption = model.qualityOptions.find((q) => q.value === quality);
  return qualityOption?.credits || 0;
}

// 获取模型的默认参数
export function getModelDefaults(model: VideoModel) {
  return {
    quality: model.defaultQuality,
    duration: model.defaultDuration,
    aspectRatio: model.defaultAspectRatio,
  };
}
