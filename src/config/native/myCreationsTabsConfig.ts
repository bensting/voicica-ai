/**
 * Native App My Creations 标签配置
 * 控制 Me 页面 My Creations 区域显示哪些内容标签
 */

export type MyCreationsTabId = 'voices' | 'dialogues' | 'music' | 'cover' | 'video' | 'image';

export interface MyCreationsTabConfig {
  id: MyCreationsTabId;
  label: string;
  /** 空状态消息 */
  emptyState: {
    title: string;
    subtitle: string;
    createLink: string;
  };
  /** 环境可见性控制 */
  enabled: {
    development: boolean;
    production: boolean;
  };
}

/**
 * My Creations 标签配置列表
 * 顺序决定显示顺序
 */
export const myCreationsTabsConfig: MyCreationsTabConfig[] = [
  {
    id: 'voices',
    label: 'Voices',
    emptyState: {
      title: 'No content yet.',
      subtitle: 'Create your first voice.',
      createLink: '/native/create/voice',
    },
    enabled: { development: true, production: true },
  },
  {
    id: 'dialogues',
    label: 'Dialogues',
    emptyState: {
      title: 'No content yet.',
      subtitle: 'Create your first AI dialogue.',
      createLink: '/native/create/dialogue',
    },
    enabled: { development: true, production: true },
  },
  {
    id: 'music',
    label: 'Music',
    emptyState: {
      title: 'No content yet.',
      subtitle: 'Create your first AI music.',
      createLink: '/native/create/music',
    },
    enabled: { development: true, production: false },
  },
  {
    id: 'cover',
    label: 'Cover',
    emptyState: {
      title: 'No content yet.',
      subtitle: 'Create your first AI cover.',
      createLink: '/native/create/cover',
    },
    enabled: { development: true, production: false },
  },
  {
    id: 'video',
    label: 'Video',
    emptyState: {
      title: 'No content yet.',
      subtitle: 'Create your first AI video.',
      createLink: '/native/create/video',
    },
    enabled: { development: true, production: false },
  },
  {
    id: 'image',
    label: 'Image',
    emptyState: {
      title: 'No content yet.',
      subtitle: 'Create your first AI image.',
      createLink: '/native/create/image',
    },
    enabled: { development: true, production: false },
  },
];

/**
 * 获取当前环境可用的 My Creations 标签
 */
export function getAvailableMyCreationsTabs(): MyCreationsTabConfig[] {
  const isDev = process.env.NODE_ENV === 'development';

  return myCreationsTabsConfig.filter((tab) =>
    isDev ? tab.enabled.development : tab.enabled.production
  );
}

/**
 * 获取默认激活的标签 ID
 * 返回第一个可用的标签
 */
export function getDefaultMyCreationsTab(): MyCreationsTabId {
  const availableTabs = getAvailableMyCreationsTabs();
  return availableTabs.length > 0 ? availableTabs[0].id : 'voices';
}

/**
 * 检查标签 ID 是否有效（在当前环境可用）
 */
export function isValidMyCreationsTab(tabId: string): tabId is MyCreationsTabId {
  const availableTabs = getAvailableMyCreationsTabs();
  return availableTabs.some((tab) => tab.id === tabId);
}
