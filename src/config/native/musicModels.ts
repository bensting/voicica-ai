/**
 * AI Music 模型配置 (Native App)
 */

// 模型配置接口
export interface MusicModel {
  id: string;
  name: string;
  description: string;
  credits: number;
  isPremium: boolean; // 是否需要订阅才能使用
}

// 模型配置
export const musicModelsConfig: MusicModel[] = [
  {
    id: 'music-5.0',
    name: 'Music - 5.0',
    description: 'The latest model with more delicate human vocals and better output sound quality.',
    credits: 700,
    isPremium: false,
  },
  {
    id: 'music-4.5-plus',
    name: 'Music - 4.5 Plus',
    description: 'The main generation model, featuring richer and fuller sound, songs up to 8 mins.',
    credits: 650,
    isPremium: false,
  },
  {
    id: 'music-4.5',
    name: 'Music - 4.5',
    description: 'Supports describing music styles in natural language, with songs up to 8 minutes.',
    credits: 650,
    isPremium: false,
  },
];

// 默认模型 ID
export const defaultMusicModelId = 'music-4.5';

// 获取默认模型
export const defaultMusicModel = musicModelsConfig.find(m => m.id === defaultMusicModelId) || musicModelsConfig[2];

// 根据 ID 获取模型
export function getMusicModelById(id: string): MusicModel | undefined {
  return musicModelsConfig.find(m => m.id === id);
}

// 获取模型名称
export function getMusicModelName(id: string): string {
  return getMusicModelById(id)?.name || id;
}

// 获取模型积分消耗
export function getMusicModelCredits(id: string): number {
  return getMusicModelById(id)?.credits || 25;
}

// 检查模型是否为 Premium
export function isMusicModelPremium(id: string): boolean {
  return getMusicModelById(id)?.isPremium || false;
}
