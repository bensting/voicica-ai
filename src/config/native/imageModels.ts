/**
 * AI Image 模型配置
 */

export interface ImageModel {
  id: string;
  name: string;
  description: string;
  icon: string;
  credits: number;
  maxPromptLength: number;
  supportsImageInput: boolean;
  aspectRatios: string[];
  qualities: { id: string; label: string; isPro?: boolean }[];
}

export const imageModels: ImageModel[] = [
  {
    id: 'nano-banana-pro',
    name: 'Nano Banana - Pro',
    description: 'With reasoning ability, most powerful',
    icon: '/images/models/nano-banana.png',
    credits: 25,
    maxPromptLength: 10000,
    supportsImageInput: true,
    aspectRatios: ['16:9', '3:4', '1:1', '4:3', '9:16', '2:3', '3:2', '4:5', '5:4', '21:9'],
    qualities: [
      { id: '1K', label: '1K' },
      { id: '2K', label: '2K', isPro: true },
      { id: '4K', label: '4K', isPro: true },
    ],
  },
  {
    id: 'seedream/4.5-text-to-image',
    name: 'Seedream 4.5',
    description: 'High-quality, diverse styles',
    icon: '/images/models/seedream.png',
    credits: 15,
    maxPromptLength: 3000,
    supportsImageInput: true,
    aspectRatios: ['16:9', '3:4', '1:1', '4:3', '9:16', '2:3', '3:2', '21:9'],
    qualities: [
      { id: 'basic', label: '2K' },
      { id: 'high', label: '4K', isPro: true },
    ],
  },
  {
    id: 'flux-2',
    name: 'Flux.2',
    description: 'Balanced quality and speed',
    icon: '/images/models/flux-2.png',
    credits: 10,
    maxPromptLength: 5000,
    supportsImageInput: true,
    aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16', '3:2', '2:3'],
    qualities: [
      { id: '1K', label: '1K' },
      { id: '2K', label: '2K', isPro: true },
    ],
  },
  {
    id: 'z-image',
    name: 'Z-Image',
    description: 'Fast and affordable',
    icon: '/images/models/z-image.png',
    credits: 1,
    maxPromptLength: 1000,
    supportsImageInput: false,
    aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16'],
    qualities: [], // Z-Image 没有 quality 选项
  },
];

// 默认模型 ID
export const DEFAULT_IMAGE_MODEL_ID = 'seedream/4.5-text-to-image';

/**
 * 获取模型配置
 */
export function getImageModelById(modelId: string): ImageModel | undefined {
  return imageModels.find((m) => m.id === modelId);
}

/**
 * 获取默认模型
 */
export function getDefaultImageModel(): ImageModel {
  return imageModels[0]; // Z-Image
}
