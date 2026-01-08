'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { admobConfig } from '@/config/ads';

const LAST_AD_SHOWN_KEY = 'app_start_ad_last_shown';

// 从配置获取间隔时间（毫秒）
const getAdShowInterval = () => admobConfig.interstitial.intervalMinutes * 60 * 1000;

/**
 * 获取上次显示广告的时间
 */
function getLastAdShownTime(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(LAST_AD_SHOWN_KEY) || '0', 10);
}

/**
 * 记录广告显示时间
 */
function setLastAdShownTime(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LAST_AD_SHOWN_KEY, String(Date.now()));
}

/**
 * 检查是否应该显示广告
 */
function shouldShowAd(): boolean {
  const lastShown = getLastAdShownTime();
  if (lastShown === 0) return true; // 从未显示过
  return Date.now() - lastShown >= getAdShowInterval();
}

/**
 * App 启动广告 Hook
 *
 * 在原生 App 启动时显示插页式广告
 * - 仅在原生环境生效
 * - 有间隔限制，避免频繁显示
 */
export function useAppStartAd() {
  const hasShownRef = useRef(false);
  const adMobRef = useRef<typeof import('@capacitor-community/admob').AdMob | null>(null);

  const isNative = Capacitor.isNativePlatform();
  const isEnabled = admobConfig.enabled && isNative;

  // 显示插页式广告
  const showInterstitialAd = useCallback(async () => {
    if (!adMobRef.current || !isEnabled) return;

    const platform = Capacitor.getPlatform() as 'android' | 'ios';
    const adUnitId = admobConfig.interstitial[platform];

    if (!adUnitId) {
      console.log('[AppStartAd] 广告单元 ID 未配置');
      return;
    }

    try {
      console.log('[AppStartAd] 准备插页式广告...');
      await adMobRef.current.prepareInterstitial({
        adId: adUnitId,
        isTesting: process.env.NODE_ENV === 'development',
      });

      console.log('[AppStartAd] 显示插页式广告...');
      await adMobRef.current.showInterstitial();

      setLastAdShownTime();
      console.log('[AppStartAd] 广告显示完成');
    } catch (error) {
      console.error('[AppStartAd] 广告显示失败:', error);
    }
  }, [isEnabled]);

  // 尝试显示广告的通用方法
  const tryShowAd = useCallback(async () => {
    if (!isEnabled) return;

    // 检查是否应该显示广告
    if (!shouldShowAd()) {
      console.log('[AppStartAd] 未到显示间隔，跳过');
      return;
    }

    // 如果 AdMob 还没初始化，先初始化
    if (!adMobRef.current) {
      try {
        const module = await import('@capacitor-community/admob');
        adMobRef.current = module.AdMob;

        await module.AdMob.initialize({
          testingDevices: process.env.NODE_ENV === 'development' ? ['YOUR_TEST_DEVICE_ID'] : [],
          initializeForTesting: process.env.NODE_ENV === 'development',
        });
      } catch (error) {
        console.error('[AppStartAd] AdMob 加载失败:', error);
        return;
      }
    }

    // 显示广告
    showInterstitialAd();
  }, [isEnabled, showInterstitialAd]);

  // 初始化：首次启动时显示广告
  useEffect(() => {
    if (!isNative || !isEnabled || hasShownRef.current) return;

    hasShownRef.current = true;

    // 延迟显示广告，让页面先加载完成
    const timer = setTimeout(() => {
      tryShowAd();
    }, 1500);

    return () => clearTimeout(timer);
  }, [isNative, isEnabled, tryShowAd]);

  // 监听 APP 从后台恢复
  useEffect(() => {
    if (!isNative || !isEnabled) return;

    const listener = App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        console.log('[AppStartAd] APP 从后台恢复');
        // APP 恢复时检查是否应该显示广告
        tryShowAd();
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [isNative, isEnabled, tryShowAd]);
}
