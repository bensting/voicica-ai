/**
 * App Open 广告插件
 *
 * 提供 Google AdMob App Open 广告功能
 * 专为应用启动和从后台恢复时显示广告设计
 */

import { registerPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';

/**
 * App Open Ad 插件接口
 */
export interface AppOpenAdPlugin {
  /**
   * 初始化 AdMob SDK
   */
  initialize(): Promise<void>;

  /**
   * 加载 App Open 广告
   */
  loadAd(options: { adUnitId: string }): Promise<{ loaded: boolean }>;

  /**
   * 显示 App Open 广告
   */
  showAd(): Promise<{ success: boolean }>;

  /**
   * 检查广告是否已加载
   */
  isAdLoaded(): Promise<{ loaded: boolean }>;

  /**
   * 添加事件监听器
   */
  addListener(
    eventName: 'adLoaded',
    listener: (data: { loaded: boolean }) => void
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'adFailedToLoad',
    listener: (data: { loaded: boolean; error: string }) => void
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'adShown',
    listener: (data: { shown: boolean }) => void
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'adDismissed',
    listener: (data: { dismissed: boolean }) => void
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'adFailedToShow',
    listener: (data: { error: string }) => void
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'adClicked',
    listener: () => void
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'adImpression',
    listener: () => void
  ): Promise<PluginListenerHandle>;
}

/**
 * App Open Ad 插件实例
 */
export const AppOpenAd = registerPlugin<AppOpenAdPlugin>('AppOpenAd');