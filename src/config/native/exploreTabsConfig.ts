/**
 * Native App Explore 标签配置
 * 控制 Explore 区域显示哪些内容标签
 */

export type ExploreTabId = 'voices' | 'music' | 'video';

export interface ExploreTabConfig {
  id: ExploreTabId;
  label: string;
  /** 环境可见性控制 */
  enabled: {
    development: boolean;
    production: boolean;
  };
}

/**
 * Explore 标签配置列表
 * 顺序决定显示顺序
 */
export const exploreTabsConfig: ExploreTabConfig[] = [
  {
    id: 'voices',
    label: 'Voices',
    enabled: { development: true, production: true },
  },
  {
    id: 'music',
    label: 'Music',
    enabled: { development: true, production: true },
  },
  {
    id: 'video',
    label: 'Video',
    enabled: { development: true, production: false },
  },
];

/**
 * 获取当前环境可用的 Explore 标签
 */
export function getAvailableExploreTabs(): ExploreTabConfig[] {
  const isDev = process.env.NODE_ENV === 'development';

  return exploreTabsConfig.filter((tab) =>
    isDev ? tab.enabled.development : tab.enabled.production
  );
}

/**
 * 获取默认激活的标签 ID
 * 返回第一个可用的标签
 */
export function getDefaultExploreTab(): ExploreTabId {
  const availableTabs = getAvailableExploreTabs();
  return availableTabs.length > 0 ? availableTabs[0].id : 'voices';
}
