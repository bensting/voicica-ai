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
  /** 'single' = 单图, 'startEnd' = 首尾帧 */
  mode: 'single' | 'startEnd';
}

// 模型配置
export interface VideoModel {
  id: string;
  name: string;
  description: string;
  icon: 'google' | 'openai' | 'vidu' | 'pixverse' | 'wan' | 'kling';
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
    creditsMatrix: {
      '512p': { '8s': 100 },
      '768p': { '8s': 125 },
      '1080p': { '8s': 200 },
    },
    defaultQuality: '768p',
    defaultDuration: '8s',
    defaultAspectRatio: '16:9',
    imageGuidance: { enabled: true, mode: 'single' },
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
    creditsMatrix: {
      '480p': { '5s': 40, '10s': 80, '20s': 160 },
      '720p': { '5s': 60, '10s': 120, '20s': 240 },
      '1080p': { '5s': 90, '10s': 180, '20s': 360 },
    },
    defaultQuality: '720p',
    defaultDuration: '10s',
    defaultAspectRatio: '16:9',
    imageGuidance: { enabled: true, mode: 'single' },
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
    creditsMatrix: {
      '512p': { '4s': 30, '8s': 60 },
      '720p': { '4s': 45, '8s': 90 },
      '1080p': { '4s': 70, '8s': 140 },
    },
    defaultQuality: '720p',
    defaultDuration: '4s',
    defaultAspectRatio: '16:9',
    imageGuidance: { enabled: true, mode: 'startEnd' },
  },
  {
    id: 'pixverse-v5',
    name: 'Pixverse V5',
    description: 'Lightning-fast videos with crisp detail',
    icon: 'pixverse',
    apiModelId: 'pixverse-v5',
    enabled: { development: true, production: true },
    qualityOptions: [
      { value: '360p', label: '360p', credits: 25 },
      { value: '540p', label: '540p', credits: 50 },
      { value: '720p', label: '720p', credits: 75 },
      { value: '1080p', label: '1080p', credits: 100, isPro: true },
    ],
    durationOptions: [
      { value: '5s', label: '5s' },
      { value: '8s', label: '8s' },
    ],
    aspectRatioOptions: extendedAspectRatios,
    creditsMatrix: {
      '360p': { '5s': 25, '8s': 50 },
      '540p': { '5s': 50, '8s': 100 },
      '720p': { '5s': 75, '8s': 150 },
      '1080p': { '5s': 100, '8s': 200 },
    },
    defaultQuality: '720p',
    defaultDuration: '5s',
    defaultAspectRatio: '16:9',
    imageGuidance: { enabled: true, mode: 'startEnd' },
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
    creditsMatrix: {
      '480p': { '5s': 15, '10s': 30 },
      '720p': { '5s': 25, '10s': 50 },
      '1080p': { '5s': 40, '10s': 80 },
    },
    defaultQuality: '720p',
    defaultDuration: '5s',
    defaultAspectRatio: '16:9',
    imageGuidance: { enabled: true, mode: 'single' },
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
    creditsMatrix: {
      '540p': { '5s': 22, '10s': 45 },
      '720p': { '5s': 35, '10s': 70 },
      '1080p': { '5s': 60, '10s': 120 },
    },
    defaultQuality: '720p',
    defaultDuration: '5s',
    defaultAspectRatio: '16:9',
    imageGuidance: { enabled: true, mode: 'single' },
  },
];

// 根据环境过滤可用的模型
export const videoModels = videoModelsConfig.filter(
  (model) => (isDevelopment ? model.enabled.development : model.enabled.production)
);

export const defaultVideoModel = videoModels[0];

// 根据模型、画质和时长计算积分
export function calculateCredits(model: VideoModel, quality: string, duration: string): number {
  return model.creditsMatrix[quality]?.[duration] || 0;
}

// 获取模型的默认参数
export function getModelDefaults(model: VideoModel) {
  return {
    quality: model.defaultQuality,
    duration: model.defaultDuration,
    aspectRatio: model.defaultAspectRatio,
  };
}
