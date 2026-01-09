/**
 * Appodeal Web 实现（模拟）
 *
 * 在 Web 环境下提供模拟实现，用于开发和测试
 */

import { WebPlugin } from '@capacitor/core';
import type {
  AppodealPlugin,
  AppodealInitOptions,
  SetAdCountOptions,
  SetCloseButtonDelayOptions,
  ShowRewardedVideoResult,
  IsLoadedResult,
  CanShowResult,
  OverlayPermissionResult,
} from './appodeal';

/**
 * Appodeal Web 模拟实现
 */
export class AppodealWeb extends WebPlugin implements AppodealPlugin {
  private initialized = false;
  private testMode = false;
  private adCount = 2;

  async initialize(options: AppodealInitOptions): Promise<void> {
    console.log('[Appodeal Web] Initialize with options:', options);
    this.initialized = true;
    this.testMode = options.testMode ?? false;

    // 模拟加载完成事件
    setTimeout(() => {
      this.notifyListeners('rewardedVideoLoaded', { isPrecache: false });
    }, 1000);
  }

  async setAdCount(options: SetAdCountOptions): Promise<void> {
    console.log('[Appodeal Web] setAdCount:', options.count);
    this.adCount = options.count;
  }

  async setCloseButtonDelay(options: SetCloseButtonDelayOptions): Promise<void> {
    console.log('[Appodeal Web] setCloseButtonDelay:', options.delay, 'seconds');
  }

  async isRewardedVideoLoaded(): Promise<IsLoadedResult> {
    console.log('[Appodeal Web] isRewardedVideoLoaded');
    return { isLoaded: this.initialized };
  }

  async showRewardedVideo(): Promise<ShowRewardedVideoResult> {
    console.log('[Appodeal Web] showRewardedVideo, adCount:', this.adCount);

    if (!this.initialized) {
      return { rewarded: false, error: 'Not initialized' };
    }

    // 模拟显示多个广告
    this.notifyListeners('rewardedVideoShown', {});

    // 模拟用户观看完成（2秒后）
    return new Promise((resolve) => {
      setTimeout(() => {
        this.notifyListeners('rewardedVideoFinished', { amount: this.adCount, name: 'credits' });
        this.notifyListeners('rewardedVideoClosed', { finished: true });
        resolve({
          rewarded: true,
          completedAds: this.adCount,
          totalAds: this.adCount,
          amount: this.adCount,
          name: 'credits',
        });
      }, 2000);
    });
  }

  async cacheRewardedVideo(): Promise<void> {
    console.log('[Appodeal Web] cacheRewardedVideo');
    // 模拟缓存
    setTimeout(() => {
      this.notifyListeners('rewardedVideoLoaded', { isPrecache: false });
    }, 500);
  }

  async canShow(): Promise<CanShowResult> {
    console.log('[Appodeal Web] canShow');
    return { canShow: this.initialized };
  }

  async checkOverlayPermission(): Promise<OverlayPermissionResult> {
    console.log('[Appodeal Web] checkOverlayPermission');
    return { hasPermission: true };
  }

  async requestOverlayPermission(): Promise<void> {
    console.log('[Appodeal Web] requestOverlayPermission');
  }
}
