'use client';

/**
 * 统一激励广告 Hook
 *
 * 根据配置自动切换 AppLixir（Web）、AdMob（原生）或 Appodeal（原生）
 *
 * 使用方式：
 * ```tsx
 * const { showRewardedAd, isReady, provider } = useRewardedAd();
 *
 * const handleWatchAd = async () => {
 *   const success = await showRewardedAd();
 *   if (success) {
 *     // 发放奖励
 *   }
 * };
 * ```
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  shouldUseAdMob,
  shouldUseAppodeal,
  shouldUseAppLixir,
} from '@/config/ads';
import { applixirConfig } from '@/config/ads/applixir';
import { admobConfig } from '@/config/ads/admob';
import { appodealConfig, getAppodealAppKey } from '@/config/ads/appodeal';

export type RewardedAdStatus = 'idle' | 'loading' | 'ready' | 'showing' | 'rewarded' | 'error';

interface UseRewardedAdReturn {
  /** 当前状态 */
  status: RewardedAdStatus;
  /** 当前使用的广告提供商 */
  provider: 'applixir' | 'admob' | 'appodeal' | 'none';
  /** 是否准备好显示广告 */
  isReady: boolean;
  /** 错误信息 */
  error: string | null;
  /** 显示激励广告，返回是否成功获得奖励 */
  showRewardedAd: () => Promise<boolean>;
}

// AppLixir SDK 容器 ID
const APPLIXIR_CONTAINER_ID = 'applixir-container';

// 声明全局函数类型
declare global {
  interface Window {
    initializeAndOpenPlayer?: (options: {
      apiKey: string;
      injectionElementId: string;
      adStatusCallbackFn: (status: string) => void;
      adErrorCallbackFn: (error: { getError: () => { data: { errorCode?: number; errorMessage?: string } } }) => void;
    }) => void;
  }
}

/**
 * 统一激励广告 Hook
 */
export function useRewardedAd(): UseRewardedAdReturn {
  const [status, setStatus] = useState<RewardedAdStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [AdMob, setAdMob] = useState<typeof import('@capacitor-community/admob').AdMob | null>(null);
  const [AppodealPlugin, setAppodealPlugin] = useState<typeof import('@/plugins/appodeal').Appodeal | null>(null);

  const applixirLoadedRef = useRef(false);
  const admobReadyRef = useRef(false);
  const appodealReadyRef = useRef(false);
  const rewardedRef = useRef(false);

  // 检测平台
  const isNative = Capacitor.isNativePlatform();
  const useAdMob = shouldUseAdMob(isNative);
  const useAppodeal = shouldUseAppodeal(isNative);
  const useAppLixir = shouldUseAppLixir(isNative);

  // 当前使用的提供商
  const provider: 'applixir' | 'admob' | 'appodeal' | 'none' = (() => {
    if (useAppodeal && appodealConfig.enabled) return 'appodeal';
    if (useAdMob && admobConfig.enabled) return 'admob';
    if (useAppLixir && applixirConfig.enabled) return 'applixir';
    return 'none';
  })();

  // ==================== AppLixir 初始化 ====================
  useEffect(() => {
    if (provider !== 'applixir') return;
    if (applixirLoadedRef.current) return;
    if (typeof window === 'undefined') return;

    // 检查是否已加载
    if (document.getElementById('applixir-sdk')) {
      applixirLoadedRef.current = true;
      setStatus('ready');
      return;
    }

    // 添加容器
    if (!document.getElementById(APPLIXIR_CONTAINER_ID)) {
      const container = document.createElement('div');
      container.id = APPLIXIR_CONTAINER_ID;
      container.style.cssText = 'position: relative; z-index: 99999;';
      document.body.appendChild(container);
    }

    // 加载 SDK
    const script = document.createElement('script');
    script.id = 'applixir-sdk';
    script.src = 'https://cdn.applixir.com/applixir.app.v6.0.1.js';
    script.onload = () => {
      applixirLoadedRef.current = true;
      setStatus('ready');
      console.log('[RewardedAd] AppLixir SDK loaded');
    };
    script.onerror = () => {
      setError('AppLixir SDK load failed');
      setStatus('error');
    };
    document.head.appendChild(script);
  }, [provider]);

  // 预加载 AdMob 广告
  const prepareAdMobAd = useCallback(async (adMob: typeof import('@capacitor-community/admob').AdMob) => {
    try {
      const platform = Capacitor.getPlatform();
      const adId = platform === 'android' ? admobConfig.rewarded.android : admobConfig.rewarded.ios;

      if (!adId) {
        console.warn('[RewardedAd] No ad unit ID for platform:', platform);
        return;
      }

      const { RewardAdPluginEvents } = await import('@capacitor-community/admob');

      // 监听加载完成
      await adMob.addListener(RewardAdPluginEvents.Loaded, () => {
        admobReadyRef.current = true;
        setStatus('ready');
        console.log('[RewardedAd] AdMob ad loaded');
      });

      // 监听奖励
      await adMob.addListener(RewardAdPluginEvents.Rewarded, () => {
        rewardedRef.current = true;
        console.log('[RewardedAd] AdMob reward earned');
      });

      // 监听关闭
      await adMob.addListener(RewardAdPluginEvents.Dismissed, () => {
        // 关闭后重新预加载
        prepareAdMobAd(adMob);
      });

      // 预加载
      await adMob.prepareRewardVideoAd({
        adId,
        isTesting: admobConfig.useTestAds,
      });
    } catch (err) {
      console.error('[RewardedAd] AdMob prepare failed:', err);
    }
  }, []);

  // ==================== AdMob 初始化 ====================
  useEffect(() => {
    if (provider !== 'admob') return;
    if (!isNative) return;

    import('@capacitor-community/admob')
      .then(async (module) => {
        setAdMob(module.AdMob);

        // 初始化 AdMob
        try {
          await module.AdMob.initialize({
            initializeForTesting: admobConfig.useTestAds,
          });
          console.log('[RewardedAd] AdMob initialized');

          // 预加载广告
          await prepareAdMobAd(module.AdMob);
        } catch (err) {
          console.error('[RewardedAd] AdMob init failed:', err);
          setError('AdMob initialization failed');
          setStatus('error');
        }
      })
      .catch((err) => {
        console.error('[RewardedAd] AdMob module load failed:', err);
      });
  }, [provider, isNative, prepareAdMobAd]);

  // ==================== Appodeal 初始化 ====================
  useEffect(() => {
    if (provider !== 'appodeal') return;
    if (!isNative) return;
    if (appodealReadyRef.current) return;

    import('@/plugins/appodeal')
      .then(async (module) => {
        const appodeal = module.Appodeal;
        setAppodealPlugin(appodeal);

        try {
          const platform = Capacitor.getPlatform() as 'android' | 'ios';
          const appKey = getAppodealAppKey(platform);

          if (!appKey) {
            console.warn('[RewardedAd] No Appodeal app key for platform:', platform);
            setError('Appodeal app key not configured');
            setStatus('error');
            return;
          }

          // 监听广告加载完成
          await appodeal.addListener('rewardedVideoLoaded', () => {
            appodealReadyRef.current = true;
            setStatus('ready');
            console.log('[RewardedAd] Appodeal ad loaded');
          });

          // 监听加载失败
          await appodeal.addListener('rewardedVideoFailedToLoad', () => {
            appodealReadyRef.current = false;
            console.warn('[RewardedAd] Appodeal ad failed to load');
          });

          // 监听广告关闭 - 重新缓存下一个广告
          await appodeal.addListener('rewardedVideoClosed', () => {
            appodealReadyRef.current = false;
            console.log('[RewardedAd] Appodeal ad closed, caching next ad...');
            appodeal.cacheRewardedVideo();
          });

          // 初始化 SDK
          await appodeal.initialize({
            appKey,
            testMode: appodealConfig.testMode,
          });

          console.log('[RewardedAd] Appodeal initialized');
        } catch (err) {
          console.error('[RewardedAd] Appodeal init failed:', err);
          setError('Appodeal initialization failed');
          setStatus('error');
        }
      })
      .catch((err) => {
        console.error('[RewardedAd] Appodeal module load failed:', err);
      });
  }, [provider, isNative]);

  // ==================== 显示广告 ====================
  const showRewardedAd = useCallback(async (): Promise<boolean> => {
    setError(null);

    // 如果没有启用任何广告，模拟成功
    if (provider === 'none') {
      console.log('[RewardedAd] No provider enabled, simulating success');
      return true;
    }

    // ---- AppLixir ----
    if (provider === 'applixir') {
      if (!window.initializeAndOpenPlayer) {
        setError('AppLixir not ready');
        return false;
      }

      return new Promise((resolve) => {
        setStatus('showing');

        window.initializeAndOpenPlayer!({
          apiKey: applixirConfig.apiKey,
          injectionElementId: APPLIXIR_CONTAINER_ID,
          adStatusCallbackFn: (adStatus) => {
            console.log('[RewardedAd] AppLixir status:', adStatus);

            if (adStatus === 'ad-watched') {
              setStatus('rewarded');
              resolve(true);
            } else if (adStatus === 'ad-interrupted' || adStatus === 'ad-unavailable') {
              setStatus('idle');
              resolve(false);
            }
          },
          adErrorCallbackFn: (err) => {
            const errorData = err.getError()?.data || {};
            console.error('[RewardedAd] AppLixir error:', errorData);
            setError(errorData.errorMessage || 'Ad error');
            setStatus('error');
            resolve(false);
          },
        });
      });
    }

    // ---- AdMob ----
    if (provider === 'admob' && AdMob) {
      try {
        rewardedRef.current = false;
        setStatus('showing');

        // 如果广告未准备好，先预加载
        if (!admobReadyRef.current) {
          await prepareAdMobAd(AdMob);
          // 等待加载
          let waited = 0;
          while (!admobReadyRef.current && waited < 10000) {
            await new Promise((r) => setTimeout(r, 100));
            waited += 100;
          }
        }

        admobReadyRef.current = false;
        await AdMob.showRewardVideoAd();

        // 等待结果
        await new Promise((r) => setTimeout(r, 500));

        if (rewardedRef.current) {
          setStatus('rewarded');
          return true;
        } else {
          setStatus('idle');
          return false;
        }
      } catch (err) {
        console.error('[RewardedAd] AdMob show failed:', err);
        setError('Failed to show ad');
        setStatus('error');
        return false;
      }
    }

    // ---- Appodeal ----
    if (provider === 'appodeal') {
      try {
        setStatus('loading');

        // 如果插件还没加载，动态加载它
        let appodeal = AppodealPlugin;
        if (!appodeal) {
          console.log('[RewardedAd] Appodeal plugin not loaded, loading now...');
          const appodealModule = await import('@/plugins/appodeal');
          appodeal = appodealModule.Appodeal;

          // 初始化 SDK
          const platform = Capacitor.getPlatform() as 'android' | 'ios';
          const appKey = getAppodealAppKey(platform);

          if (!appKey) {
            console.warn('[RewardedAd] No Appodeal app key for platform:', platform);
            setError('Appodeal app key not configured');
            setStatus('error');
            return false;
          }

          await appodeal.initialize({
            appKey,
            testMode: appodealConfig.testMode,
          });
          console.log('[RewardedAd] Appodeal initialized on-demand');
        }

        setStatus('showing');

        // 检查广告是否已加载
        const { isLoaded } = await appodeal.isRewardedVideoLoaded();
        if (!isLoaded) {
          // 尝试缓存并等待
          console.log('[RewardedAd] Ad not loaded, caching...');
          await appodeal.cacheRewardedVideo();
          let waited = 0;
          while (waited < 15000) {
            const check = await appodeal.isRewardedVideoLoaded();
            if (check.isLoaded) {
              console.log('[RewardedAd] Ad loaded after', waited, 'ms');
              break;
            }
            await new Promise((r) => setTimeout(r, 200));
            waited += 200;
          }
        }

        // 显示广告
        const result = await appodeal.showRewardedVideo();

        if (result.rewarded) {
          setStatus('rewarded');
          console.log('[RewardedAd] Appodeal reward earned:', result);
          return true;
        } else {
          setStatus('idle');
          if (result.error) {
            console.warn('[RewardedAd] Appodeal:', result.error);
          }
          return false;
        }
      } catch (err) {
        console.error('[RewardedAd] Appodeal show failed:', err);
        setError('Failed to show ad');
        setStatus('error');
        return false;
      }
    }

    return false;
  }, [provider, AdMob, AppodealPlugin, prepareAdMobAd]);

  // 计算是否准备好
  const isReady =
    provider === 'none' ||
    (provider === 'applixir' && applixirLoadedRef.current) ||
    (provider === 'admob' && admobReadyRef.current) ||
    (provider === 'appodeal' && appodealReadyRef.current);

  return {
    status,
    provider,
    isReady,
    error,
    showRewardedAd,
  };
}