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
  /** 激励广告是否已缓存好 */
  isAdReady: boolean;
  /** 插页式激励广告是否已缓存好 */
  isInterstitialRewardedReady: boolean;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 用户是否获得了奖励 */
  rewarded: boolean;
  /** 重置奖励状态 */
  resetRewarded: () => void;
  /** 预加载下一个激励广告 */
  prepareAd: () => Promise<void>;
  /** 预加载下一个插页式激励广告 */
  prepareInterstitialRewardedAd: () => Promise<void>;
  /** 显示激励广告 */
  showAd: () => Promise<boolean>;
  /** 显示插页式激励广告 */
  showInterstitialRewardedAd: () => Promise<boolean>;
}

const AdMobContext = createContext<AdMobContextValue | null>(null);

export function useAdMob() {
  const context = useContext(AdMobContext);
  if (!context) {
    // 返回默认值，允许在非原生平台使用
    return {
      adMob: null,
      isAdReady: false,
      isInterstitialRewardedReady: false,
      isLoading: false,
      rewarded: false,
      resetRewarded: () => {},
      prepareAd: async () => {},
      prepareInterstitialRewardedAd: async () => {},
      showAd: async () => false,
      showInterstitialRewardedAd: async () => false,
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
  const [isInterstitialRewardedReady, setIsInterstitialRewardedReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rewarded, setRewarded] = useState(false);

  const isNative = Capacitor.isNativePlatform();
  const useAdMobEnabled = shouldUseAdMob(isNative);

  const listenersAddedRef = useRef(false);
  const interstitialRewardedListenersAddedRef = useRef(false);
  const adMobRef = useRef<typeof import('@capacitor-community/admob').AdMob | null>(null);

  // 预加载激励广告
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

      console.log('[AdMob] Preparing rewarded ad...');
      setIsLoading(true);

      await adMobInstance.prepareRewardVideoAd({
        adId,
        isTesting: admobConfig.useTestAds,
      });
    } catch (err) {
      console.error('[AdMob] Prepare rewarded ad failed:', err);
      setIsLoading(false);
    }
  }, []);

  // 预加载插页式激励广告（用于签到）
  const prepareInterstitialRewardedAd = useCallback(async () => {
    const adMobInstance = adMobRef.current;
    if (!adMobInstance) return;

    try {
      const platform = Capacitor.getPlatform();
      const adId = platform === 'android'
        ? admobConfig.interstitialRewarded.android
        : admobConfig.interstitialRewarded.ios;

      if (!adId) {
        console.warn('[AdMob] No interstitial rewarded ad unit ID for platform:', platform);
        return;
      }

      console.log('[AdMob] Preparing interstitial rewarded ad...');

      await adMobInstance.prepareRewardInterstitialAd({
        adId,
        isTesting: admobConfig.useTestAds,
      });
    } catch (err) {
      console.error('[AdMob] Prepare interstitial rewarded ad failed:', err);
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
    console.log('[AdMob] Rewarded ad listeners setup complete');
  }, [prepareAd]);

  // 设置插页式激励广告监听器
  const setupInterstitialRewardedListeners = useCallback(async (adMobInstance: typeof import('@capacitor-community/admob').AdMob) => {
    if (interstitialRewardedListenersAddedRef.current) return;

    const { RewardInterstitialAdPluginEvents } = await import('@capacitor-community/admob');

    // 广告加载完成
    await adMobInstance.addListener(RewardInterstitialAdPluginEvents.Loaded, () => {
      console.log('[AdMob] Interstitial rewarded ad loaded and ready');
      setIsInterstitialRewardedReady(true);
    });

    // 获得奖励
    await adMobInstance.addListener(RewardInterstitialAdPluginEvents.Rewarded, () => {
      console.log('[AdMob] Interstitial rewarded ad - reward earned');
      setRewarded(true);
    });

    // 广告关闭 - 预加载下一个
    await adMobInstance.addListener(RewardInterstitialAdPluginEvents.Dismissed, () => {
      console.log('[AdMob] Interstitial rewarded ad dismissed, preparing next...');
      setIsInterstitialRewardedReady(false);
      prepareInterstitialRewardedAd();
    });

    // 加载失败
    await adMobInstance.addListener(RewardInterstitialAdPluginEvents.FailedToLoad, (error) => {
      console.error('[AdMob] Interstitial rewarded ad failed to load:', error);
      // 3 秒后重试
      setTimeout(() => prepareInterstitialRewardedAd(), 3000);
    });

    interstitialRewardedListenersAddedRef.current = true;
    console.log('[AdMob] Interstitial rewarded ad listeners setup complete');
  }, [prepareInterstitialRewardedAd]);

  // 显示激励广告
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

  // 显示插页式激励广告（用于签到）
  const showInterstitialRewardedAd = useCallback(async (): Promise<boolean> => {
    const adMobInstance = adMobRef.current;
    if (!adMobInstance) {
      console.warn('[AdMob] AdMob not initialized for interstitial rewarded');
      return false;
    }

    try {
      setRewarded(false);

      // 如果广告未准备好，等待加载
      if (!isInterstitialRewardedReady) {
        console.log('[AdMob] Interstitial rewarded ad not ready, waiting...');
        await prepareInterstitialRewardedAd();

        // 等待加载完成（最多 15 秒）
        let waited = 0;
        while (!isInterstitialRewardedReady && waited < 15000) {
          await new Promise(r => setTimeout(r, 100));
          waited += 100;
        }
      }

      setIsInterstitialRewardedReady(false);
      await adMobInstance.showRewardInterstitialAd();

      // 等待一下让 Rewarded 事件有时间触发
      await new Promise(r => setTimeout(r, 500));

      return rewarded;
    } catch (err) {
      console.error('[AdMob] Show interstitial rewarded ad failed:', err);
      return false;
    }
  }, [isInterstitialRewardedReady, rewarded, prepareInterstitialRewardedAd]);

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
          await setupInterstitialRewardedListeners(module.AdMob);

          // 预加载广告
          await prepareAd();
          await prepareInterstitialRewardedAd();
        } catch (err) {
          console.error('[AdMob] Init failed:', err);
        }
      })
      .catch((err) => {
        console.error('[AdMob] Module load failed:', err);
      });
  }, [isNative, useAdMobEnabled, setupListeners, setupInterstitialRewardedListeners, prepareAd, prepareInterstitialRewardedAd]);

  const value: AdMobContextValue = {
    adMob,
    isAdReady,
    isInterstitialRewardedReady,
    isLoading,
    rewarded,
    resetRewarded,
    prepareAd,
    prepareInterstitialRewardedAd,
    showAd,
    showInterstitialRewardedAd,
  };

  return (
    <AdMobContext.Provider value={value}>
      {children}
    </AdMobContext.Provider>
  );
}