/**
 * AI Video 模型配置
 * 通用配置，可用于 Native 和 Web
 */
export interface VideoModel {
  id: string;
  name: string;
  description: string;
  icon: 'google' | 'openai' | 'topix' | 'vidu' | 'pixverse' | 'wan' | 'kling';
  enabled: {
    development: boolean;
    production: boolean;
  };
}

const isDevelopment = process.env.NODE_ENV === 'development';

export const videoModelsConfig: VideoModel[] = [
  {
    id: 'veo-3.1',
    name: 'Google Veo 3.1',
    description: 'The most capable model',
    icon: 'google',
    enabled: {
      development: true,
      production: true,
    },
  },
  {
    id: 'sora-2',
    name: 'Sora 2',
    description: 'Physics-aware video with rich audio',
    icon: 'openai',
    enabled: {
      development: true,
      production: false,
    },
  },
  {
    id: 'topix-1.0',
    name: 'Topix 1.0',
    description: 'Fast cinematic motion & physics',
    icon: 'topix',
    enabled: {
      development: true,
      production: false,
    },
  },
  {
    id: 'vidu-2.0',
    name: 'Vidu 2.0',
    description: 'Real motion transformation',
    icon: 'vidu',
    enabled: {
      development: true,
      production: false,
    },
  },
  {
    id: 'pixverse-v5',
    name: 'Pixverse V5',
    description: 'Lightning-fast videos with crisp detail',
    icon: 'pixverse',
    enabled: {
      development: true,
      production: false,
    },
  },
  {
    id: 'wan-2.5',
    name: 'Wan 2.5',
    description: 'Affordable high-quality video with audio',
    icon: 'wan',
    enabled: {
      development: true,
      production: false,
    },
  },
  {
    id: 'kling-v2.5-turbo',
    name: 'Kling V2.5 Turbo',
    description: 'HDR video with smart world physics',
    icon: 'kling',
    enabled: {
      development: true,
      production: false,
    },
  },
];

// 根据环境过滤可用的模型
export const videoModels = videoModelsConfig.filter(
  (model) => (isDevelopment ? model.enabled.development : model.enabled.production)
);

export const defaultVideoModel = videoModels[0];
