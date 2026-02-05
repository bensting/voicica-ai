/**
 * Native Ad 插件
 *
 * 提供 Google AdMob 原生高级广告功能
 * 用于在信息流中展示原生广告
 */

import { registerPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';

/**
 * 原生广告数据
 */
export interface NativeAdData {
  /** 广告标题 */
  headline?: string;
  /** 广告正文 */
  body?: string;
  /** 广告来源 */
  advertiser?: string;
  /** CTA 按钮文字 */
  callToAction?: string;
  /** 图标 URL */
  iconUrl?: string;
  /** 图片 URL */
  imageUrl?: string;
  /** 星级评分 */
  starRating?: number;
  /** 价格 */
  price?: string;
  /** 商店名称 */
  store?: string;
  /** 媒体内容 */
  mediaContent?: {
    aspectRatio: number;
    hasVideoContent: boolean;
  };
}

/**
 * 加载广告选项
 */
export interface LoadAdOptions {
  /** 广告单元 ID */
  adUnitId: string;
}

/**
 * Native Ad 插件接口
 */
export interface NativeAdPlugin {
  /**
   * 初始化 AdMob SDK
   */
  initialize(): Promise<void>;

  /**
   * 加载原生广告
   */
  loadAd(options: LoadAdOptions): Promise<NativeAdData>;

  /**
   * 记录广告点击
   */
  recordClick(): Promise<void>;

  /**
   * 记录广告展示
   */
  recordImpression(): Promise<void>;

  /**
   * 销毁当前广告
   */
  destroy(): Promise<void>;

  /**
   * 检查广告是否已加载
   */
  isAdLoaded(): Promise<{ loaded: boolean }>;

  /**
   * 获取当前广告数据
   */
  getAdData(): Promise<NativeAdData>;

  /**
   * 添加事件监听器
   */
  addListener(
    eventName: 'adLoaded',
    listener: (data: NativeAdData) => void
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'adFailedToLoad',
    listener: (data: { code: number; message: string }) => void
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'adClicked',
    listener: () => void
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'adImpression',
    listener: () => void
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'adOpened',
    listener: () => void
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'adClosed',
    listener: () => void
  ): Promise<PluginListenerHandle>;
}

/**
 * Native Ad 插件实例
 */
export const NativeAd = registerPlugin<NativeAdPlugin>('NativeAd');
