/**
 * Appodeal Capacitor Plugin
 *
 * TypeScript 定义和封装，用于调用原生 Appodeal SDK
 * 支持连续播放多个广告，带顶部进度条和计数器
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
 * 设置广告数量选项
 */
export interface SetAdCountOptions {
  /** 连续播放的广告数量（1-5） */
  count: number;
}

/**
 * 设置关闭按钮延迟选项
 */
export interface SetCloseButtonDelayOptions {
  /** 关闭按钮显示延迟（秒，5-60） */
  delay: number;
}

/**
 * 显示激励视频的结果
 */
export interface ShowRewardedVideoResult {
  /** 是否成功获得奖励 */
  rewarded: boolean;
  /** 完成的广告数量 */
  completedAds?: number;
  /** 总广告数量 */
  totalAds?: number;
  /** 奖励数量（累计） */
  amount?: number;
  /** 奖励名称 */
  name?: string;
  /** 错误信息（如果失败） */
  error?: string;
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
 * 检查悬浮窗权限结果
 */
export interface OverlayPermissionResult {
  hasPermission: boolean;
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
   * 设置连续播放的广告数量
   * @param options 包含 count 字段（1-5）
   */
  setAdCount(options: SetAdCountOptions): Promise<void>;

  /**
   * 设置关闭按钮显示延迟
   * @param options 包含 delay 字段（5-60秒）
   */
  setCloseButtonDelay(options: SetCloseButtonDelayOptions): Promise<void>;

  /**
   * 检查激励视频是否已加载
   */
  isRewardedVideoLoaded(): Promise<IsLoadedResult>;

  /**
   * 显示激励视频广告（连续播放配置的数量）
   * @returns 返回是否获得奖励及完成情况
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
   * 检查是否有悬浮窗权限（用于显示广告进度条）
   */
  checkOverlayPermission(): Promise<OverlayPermissionResult>;

  /**
   * 请求悬浮窗权限（打开系统设置页面让用户授权）
   */
  requestOverlayPermission(): Promise<void>;

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
    listenerFunc: (data: { amount: number; name: string; adIndex: number; totalAds: number }) => void
  ): Promise<{ remove: () => void }>;

  addListener(
    eventName: 'claimRewardNow',
    listenerFunc: (data: { adIndex: number; totalAds: number }) => void
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
