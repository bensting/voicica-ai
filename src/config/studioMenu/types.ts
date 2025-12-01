/**
 * Studio 侧边栏菜单类型定义
 */

export interface StudioMenuItemConfig {
  id: string;
  labelKey: string; // i18n 翻译键
  href: string;
  icon: React.ReactNode;
  category?: MenuCategory;
  enabled?: boolean; // 是否启用，默认为 true
}

export type MenuCategory = 'main' | 'ai_video' | 'video' | 'voiceover' | 'music' | 'tools' | 'account';

export interface StudioMenuCategories {
  main: StudioMenuItemConfig[];
  ai_video: StudioMenuItemConfig[];
  video: StudioMenuItemConfig[];
  voiceover: StudioMenuItemConfig[];
  music: StudioMenuItemConfig[];
  tools: StudioMenuItemConfig[];
  account: StudioMenuItemConfig[];
}
