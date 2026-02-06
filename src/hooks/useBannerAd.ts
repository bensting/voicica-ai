'use client';

/**
 * Banner 广告 Hook
 *
 * 使用 @capacitor-community/admob 在页面顶部显示 Banner 广告
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { admobConfig, isBannerAdEnabled } from '@/config/ads';
import { useSubscription } from '@/contexts/SubscriptionContext';

export type BannerAdStatus = 'idle' | 'loading' | 'shown' | 'error' | 'hidden';

interface UseBannerAdReturn {
  /** 当前状态 */
  status: BannerAdStatus;
  /** 是否在原生环境中 */
  isNative: boolean;
  /** 是否启用 */
  isEnabled: boolean;
  /** Banner 高度（用于内容偏移） */
  bannerHeight: number;
  /** 显示 Banner */
  showBanner: () => Promise<void>;
  /** 隐藏 Banner */
  hideBanner: () => Promise<void>;
}

// 调试日志
const DEBUG = true;
const log = (...args: unknown[]) => DEBUG && console.log('[useBannerAd]', ...args);

/**
 * Banner 广告 Hook
 */
export function useBannerAd(): UseBannerAdReturn {
  const [status, setStatus] = useState<BannerAdStatus>('idle');
  const [bannerHeight, setBannerHeight] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const isInitializedRef = useRef(false);
  const { isSubscribed } = useSubscription();

  // 客户端挂载后才检测平台，避免 Hydration 错误
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 只在客户端检测平台
  const isNative = isMounted ? Capacitor.isNativePlatform() : false;
  const platform = isMounted ? Capacitor.getPlatform() : 'web';

  // 是否应该显示广告
  const isEnabled = isBannerAdEnabled() && isNative && !isSubscribed;

  log('Hook state:', { isMounted, isNative, isEnabled, status, isSubscribed });

  // 获取广告单元 ID
  const getAdUnitId = useCallback(() => {
    if (platform === 'android') {
      return admobConfig.banner.android;
    } else if (platform === 'ios') {
      return admobConfig.banner.ios;
    }
    return '';
  }, [platform]);

  // 显示 Banner
  const showBanner = useCallback(async () => {
    if (!isEnabled || isInitializedRef.current) return;

    const adUnitId = getAdUnitId();
    if (!adUnitId) {
      log('No ad unit ID for platform:', platform);
      setStatus('error');
      return;
    }

    try {
      setStatus('loading');
      isInitializedRef.current = true;

      const { AdMob, BannerAdSize, BannerAdPosition, BannerAdPluginEvents } = await import(
        '@capacitor-community/admob'
      );

      // 监听 Banner 事件
      await AdMob.addListener(BannerAdPluginEvents.SizeChanged, (info: { width: number; height: number }) => {
        log('Size changed:', info);
        setBannerHeight(info.height || 50);
      });

      await AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
        log('Banner loaded');
        setStatus('shown');
      });

      await AdMob.addListener(BannerAdPluginEvents.FailedToLoad, (error: { code: number; message: string }) => {
        log('Banner failed to load:', error);
        setStatus('error');
        isInitializedRef.current = false;
      });

      // 显示 Banner 广告
      log('Showing banner with ID:', adUnitId);
      await AdMob.showBanner({
        adId: adUnitId,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.TOP_CENTER,
        margin: 56, // 导航栏高度
        isTesting: admobConfig.useTestAds,
      });

      log('Banner show command sent');
    } catch (error) {
      log('Error showing banner:', error);
      setStatus('error');
      isInitializedRef.current = false;
    }
  }, [isEnabled, getAdUnitId, platform]);

  // 隐藏 Banner
  const hideBanner = useCallback(async () => {
    if (!isNative) return;

    try {
      const { AdMob } = await import('@capacitor-community/admob');
      await AdMob.hideBanner();
      setStatus('hidden');
      setBannerHeight(0);
      isInitializedRef.current = false;
      log('Banner hidden');
    } catch (error) {
      log('Error hiding banner:', error);
    }
  }, [isNative]);

  // 自动显示 Banner
  useEffect(() => {
    if (isEnabled && status === 'idle') {
      showBanner();
    }
  }, [isEnabled, status, showBanner]);

  // 组件卸载时隐藏 Banner
  useEffect(() => {
    return () => {
      if (isNative && isInitializedRef.current) {
        import('@capacitor-community/admob').then(({ AdMob }) => {
          AdMob.hideBanner().catch(() => {});
        });
      }
    };
  }, [isNative]);

  return {
    status,
    isNative,
    isEnabled,
    bannerHeight,
    showBanner,
    hideBanner,
  };
}
