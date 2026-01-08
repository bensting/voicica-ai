/**
 * Appodeal Capacitor Plugin
 *
 * TypeScript 定义和封装，用于调用原生 Appodeal SDK
 */

import { registerPlugin } from '@capacitor/core';

/**
 * 初始化选项
 */
export interface AppodealInitOptions {
  /** Appodeal App Key */
  appKey: string;
  /** 是否开启测试模式 */
  testMode?: boolean;
}

/**
 * 显示激励视频的结果
 */
export interface ShowRewardedVideoResult {
  /** 是否成功获得奖励（用户完整观看视频） */
  rewarded: boolean;
  /** 奖励数量（如果有） */
  amount?: number;
  /** 奖励名称（如果有） */
  name?: string;
  /** 错误信息（如果失败） */
  error?: string;
  /** 是否是超时强制给的奖励 */
  timeout?: boolean;
}

/**
 * 设置超时时间选项
 */
export interface SetAdTimeoutOptions {
  /** 超时时间（秒） */
  timeout: number;
}

/**
 * 检查广告是否已加载
 */
export interface IsLoadedResult {
  isLoaded: boolean;
}

/**
 * 检查是否可以显示广告
 */
export interface CanShowResult {
  canShow: boolean;
}

/**
 * Appodeal 插件接口
 */
export interface AppodealPlugin {
  /**
   * 初始化 Appodeal SDK
   */
  initialize(options: AppodealInitOptions): Promise<void>;

  /**
   * 检查激励视频是否已加载
   */
  isRewardedVideoLoaded(): Promise<IsLoadedResult>;

  /**
   * 显示激励视频广告
   * @returns 返回是否获得奖励
   */
  showRewardedVideo(): Promise<ShowRewardedVideoResult>;

  /**
   * 手动缓存激励视频
   */
  cacheRewardedVideo(): Promise<void>;

  /**
   * 检查是否可以显示广告（基于频率规则）
   */
  canShow(): Promise<CanShowResult>;

  /**
   * 设置广告超时时间（秒）
   * 超时后会强制关闭广告并给予奖励
   */
  setAdTimeout(options: SetAdTimeoutOptions): Promise<void>;

  /**
   * 添加事件监听器
   */
  addListener(
    eventName: 'rewardedVideoLoaded',
    listenerFunc: (data: { isPrecache: boolean }) => void
  ): Promise<{ remove: () => void }>;

  addListener(
    eventName: 'rewardedVideoFailedToLoad',
    listenerFunc: () => void
  ): Promise<{ remove: () => void }>;

  addListener(
    eventName: 'rewardedVideoShown',
    listenerFunc: () => void
  ): Promise<{ remove: () => void }>;

  addListener(
    eventName: 'rewardedVideoShowFailed',
    listenerFunc: () => void
  ): Promise<{ remove: () => void }>;

  addListener(
    eventName: 'rewardedVideoFinished',
    listenerFunc: (data: { amount: number; name: string }) => void
  ): Promise<{ remove: () => void }>;

  addListener(
    eventName: 'rewardedVideoClosed',
    listenerFunc: (data: { finished: boolean }) => void
  ): Promise<{ remove: () => void }>;

  addListener(
    eventName: 'rewardedVideoExpired',
    listenerFunc: () => void
  ): Promise<{ remove: () => void }>;

  addListener(
    eventName: 'rewardedVideoClicked',
    listenerFunc: () => void
  ): Promise<{ remove: () => void }>;
}

/**
 * 注册 Appodeal 插件
 */
export const Appodeal = registerPlugin<AppodealPlugin>('Appodeal', {
  web: () => import('./appodeal-web').then((m) => new m.AppodealWeb()),
});
