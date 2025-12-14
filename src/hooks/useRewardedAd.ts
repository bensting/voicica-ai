'use client';

/**
 * 统一激励广告 Hook
 *
 * 根据配置自动切换 AppLixir（Web）和 AdMob（原生）
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
import { shouldUseAdMob, type RewardedAdProvider } from '@/config/ads';
import { applixirConfig } from '@/config/ads/applixir';
import { admobConfig } from '@/config/ads/admob';

export type RewardedAdStatus = 'idle' | 'loading' | 'ready' | 'showing' | 'rewarded' | 'error';

interface UseRewardedAdReturn {
  /** 当前状态 */
  status: RewardedAdStatus;
  /** 当前使用的广告提供商 */
  provider: 'applixir' | 'admob' | 'none';
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

  const applixirLoadedRef = useRef(false);
  const admobReadyRef = useRef(false);
  const rewardedRef = useRef(false);

  // 检测平台
  const isNative = Capacitor.isNativePlatform();
  const useAdMob = shouldUseAdMob(isNative);

  // 当前使用的提供商
  const provider: 'applixir' | 'admob' | 'none' = useAdMob
    ? (admobConfig.enabled ? 'admob' : 'none')
    : (applixirConfig.enabled ? 'applixir' : 'none');

  // ==================== AppLixir 初始化 ====================
  useEffect(() => {
    if (useAdMob || !applixirConfig.enabled) return;
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
  }, [useAdMob]);

  // ==================== AdMob 初始化 ====================
  useEffect(() => {
    if (!useAdMob || !admobConfig.enabled) return;
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
  }, [useAdMob, isNative]);

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

    return false;
  }, [provider, AdMob, prepareAdMobAd]);

  // 计算是否准备好
  const isReady =
    provider === 'none' ||
    (provider === 'applixir' && applixirLoadedRef.current) ||
    (provider === 'admob' && admobReadyRef.current);

  return {
    status,
    provider,
    isReady,
    error,
    showRewardedAd,
  };
}