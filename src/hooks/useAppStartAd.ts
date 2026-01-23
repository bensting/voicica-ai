'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { admobConfig } from '@/config/ads';

const LAST_AD_SHOWN_KEY = 'app_start_ad_last_shown';

// 从配置获取间隔时间（毫秒）
const getAdShowInterval = () => admobConfig.appOpen.intervalMinutes * 60 * 1000;

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
 * 在原生 App 启动时显示 App Open 广告
 * - 使用自定义原生插件实现
 * - 仅在原生环境生效
 * - 有间隔限制，避免频繁显示
 */
export function useAppStartAd() {
  const hasShownRef = useRef(false);
  const isInitializedRef = useRef(false);
  const appOpenAdRef = useRef<typeof import('@/plugins/app-open-ad').AppOpenAd | null>(null);

  const isNative = Capacitor.isNativePlatform();
  const isEnabled = admobConfig.enabled && admobConfig.appOpen.enabled && isNative;

  // 加载并显示 App Open 广告
  const showAppOpenAd = useCallback(async () => {
    if (!appOpenAdRef.current || !isEnabled) return;

    const platform = Capacitor.getPlatform() as 'android' | 'ios';
    const adUnitId = admobConfig.appOpen[platform];

    if (!adUnitId) {
      console.log('[AppStartAd] App Open 广告单元 ID 未配置');
      return;
    }

    try {
      // 检查广告是否已加载
      const { loaded } = await appOpenAdRef.current.isAdLoaded();

      if (!loaded) {
        console.log('[AppStartAd] 加载 App Open 广告...');
        await appOpenAdRef.current.loadAd({ adUnitId });
      }

      console.log('[AppStartAd] 显示 App Open 广告...');
      await appOpenAdRef.current.showAd();

      setLastAdShownTime();
      console.log('[AppStartAd] App Open 广告显示完成');
    } catch (error) {
      console.error('[AppStartAd] App Open 广告显示失败:', error);
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

    // 如果插件还没加载，先加载并初始化
    if (!appOpenAdRef.current) {
      try {
        const { AppOpenAd } = await import('@/plugins/app-open-ad');
        appOpenAdRef.current = AppOpenAd;

        if (!isInitializedRef.current) {
          await AppOpenAd.initialize();
          isInitializedRef.current = true;
          console.log('[AppStartAd] App Open Ad 插件初始化完成');
        }
      } catch (error) {
        console.error('[AppStartAd] App Open Ad 插件加载失败:', error);
        return;
      }
    }

    // 显示广告
    showAppOpenAd();
  }, [isEnabled, showAppOpenAd]);

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