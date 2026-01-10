'use client';

/**
 * AdMob 上下文
 *
 * 在 App 启动时初始化 AdMob 并预加载广告，
 * 确保用户第一次点击 "Watch" 时广告已缓存好。
 */

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { admobConfig } from '@/config/ads/admob';
import { shouldUseAdMob } from '@/config/ads';

interface AdMobContextValue {
  /** AdMob 模块 */
  adMob: typeof import('@capacitor-community/admob').AdMob | null;
  /** 广告是否已缓存好 */
  isAdReady: boolean;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 用户是否获得了奖励 */
  rewarded: boolean;
  /** 重置奖励状态 */
  resetRewarded: () => void;
  /** 预加载下一个广告 */
  prepareAd: () => Promise<void>;
  /** 显示广告 */
  showAd: () => Promise<boolean>;
}

const AdMobContext = createContext<AdMobContextValue | null>(null);

export function useAdMob() {
  const context = useContext(AdMobContext);
  if (!context) {
    // 返回默认值，允许在非原生平台使用
    return {
      adMob: null,
      isAdReady: false,
      isLoading: false,
      rewarded: false,
      resetRewarded: () => {},
      prepareAd: async () => {},
      showAd: async () => false,
    };
  }
  return context;
}

interface AdMobProviderProps {
  children: React.ReactNode;
}

export function AdMobProvider({ children }: AdMobProviderProps) {
  const [adMob, setAdMob] = useState<typeof import('@capacitor-community/admob').AdMob | null>(null);
  const [isAdReady, setIsAdReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rewarded, setRewarded] = useState(false);

  const isNative = Capacitor.isNativePlatform();
  const useAdMobEnabled = shouldUseAdMob(isNative);

  const listenersAddedRef = useRef(false);
  const adMobRef = useRef<typeof import('@capacitor-community/admob').AdMob | null>(null);

  // 预加载广告
  const prepareAd = useCallback(async () => {
    const adMobInstance = adMobRef.current;
    if (!adMobInstance) return;

    try {
      const platform = Capacitor.getPlatform();
      const adId = platform === 'android' ? admobConfig.rewarded.android : admobConfig.rewarded.ios;

      if (!adId) {
        console.warn('[AdMob] No ad unit ID for platform:', platform);
        return;
      }

      console.log('[AdMob] Preparing ad...');
      setIsLoading(true);

      await adMobInstance.prepareRewardVideoAd({
        adId,
        isTesting: admobConfig.useTestAds,
      });
    } catch (err) {
      console.error('[AdMob] Prepare failed:', err);
      setIsLoading(false);
    }
  }, []);

  // 设置监听器
  const setupListeners = useCallback(async (adMobInstance: typeof import('@capacitor-community/admob').AdMob) => {
    if (listenersAddedRef.current) return;

    const { RewardAdPluginEvents } = await import('@capacitor-community/admob');

    // 广告加载完成
    await adMobInstance.addListener(RewardAdPluginEvents.Loaded, () => {
      console.log('[AdMob] Ad loaded and ready');
      setIsAdReady(true);
      setIsLoading(false);
    });

    // 获得奖励
    await adMobInstance.addListener(RewardAdPluginEvents.Rewarded, () => {
      console.log('[AdMob] Reward earned');
      setRewarded(true);
    });

    // 广告关闭 - 预加载下一个
    await adMobInstance.addListener(RewardAdPluginEvents.Dismissed, () => {
      console.log('[AdMob] Ad dismissed, preparing next...');
      setIsAdReady(false);
      prepareAd();
    });

    // 加载失败
    await adMobInstance.addListener(RewardAdPluginEvents.FailedToLoad, (error) => {
      console.error('[AdMob] Failed to load:', error);
      setIsLoading(false);
      // 3 秒后重试
      setTimeout(() => prepareAd(), 3000);
    });

    listenersAddedRef.current = true;
    console.log('[AdMob] Listeners setup complete');
  }, [prepareAd]);

  // 显示广告
  const showAd = useCallback(async (): Promise<boolean> => {
    const adMobInstance = adMobRef.current;
    if (!adMobInstance) {
      console.warn('[AdMob] AdMob not initialized');
      return false;
    }

    try {
      setRewarded(false);

      // 如果广告未准备好，等待加载
      if (!isAdReady) {
        console.log('[AdMob] Ad not ready, waiting...');
        await prepareAd();

        // 等待加载完成
        let waited = 0;
        while (!isAdReady && waited < 15000) {
          await new Promise(r => setTimeout(r, 100));
          waited += 100;
          // 检查 ref 而不是 state（state 在循环中不会更新）
        }
      }

      setIsAdReady(false);
      await adMobInstance.showRewardVideoAd();

      // 等待一下让 Rewarded 事件有时间触发
      await new Promise(r => setTimeout(r, 500));

      return rewarded;
    } catch (err) {
      console.error('[AdMob] Show failed:', err);
      return false;
    }
  }, [isAdReady, rewarded, prepareAd]);

  // 重置奖励状态
  const resetRewarded = useCallback(() => {
    setRewarded(false);
  }, []);

  // 初始化 AdMob
  useEffect(() => {
    if (!isNative || !useAdMobEnabled || !admobConfig.enabled) {
      console.log('[AdMob] Skipping initialization (not native or not enabled)');
      return;
    }

    console.log('[AdMob] Starting initialization...');

    import('@capacitor-community/admob')
      .then(async (module) => {
        try {
          await module.AdMob.initialize({
            initializeForTesting: admobConfig.useTestAds,
          });

          console.log('[AdMob] Initialized successfully');

          setAdMob(module.AdMob);
          adMobRef.current = module.AdMob;

          // 设置监听器
          await setupListeners(module.AdMob);

          // 预加载第一个广告
          await prepareAd();
        } catch (err) {
          console.error('[AdMob] Init failed:', err);
        }
      })
      .catch((err) => {
        console.error('[AdMob] Module load failed:', err);
      });
  }, [isNative, useAdMobEnabled, setupListeners, prepareAd]);

  const value: AdMobContextValue = {
    adMob,
    isAdReady,
    isLoading,
    rewarded,
    resetRewarded,
    prepareAd,
    showAd,
  };

  return (
    <AdMobContext.Provider value={value}>
      {children}
    </AdMobContext.Provider>
  );
}