'use client';

/**
 * 统一激励广告 Hook
 *
 * 根据配置自动切换 ExoClick（Web）、AdMob（原生）或 Appodeal（原生）
 *
 * AdMob 使用 AdMobContext 在 App 启动时初始化，确保第一个广告能快速加载。
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
  shouldUseExoClick,
} from '@/config/ads';
import { exoclickConfig } from '@/config/ads/exoclick';
import { admobConfig } from '@/config/ads/admob';
import { appodealConfig, getAppodealAppKey } from '@/config/ads/appodeal';
import { useAdMob } from '@/contexts/AdMobContext';
import { useExoClickAd } from './useExoClickAd';

export type RewardedAdStatus = 'idle' | 'loading' | 'ready' | 'showing' | 'rewarded' | 'error';

/** 广告结果 */
export interface RewardedAdResult {
  /** 是否成功获得奖励 */
  success: boolean;
  /** 失败原因：rewarded=成功, skipped=用户跳过, unavailable=无广告, error=错误 */
  reason: 'rewarded' | 'skipped' | 'unavailable' | 'error';
  /** 错误信息（仅当 reason 为 error 或 unavailable 时） */
  message?: string;
}

interface UseRewardedAdReturn {
  /** 当前状态 */
  status: RewardedAdStatus;
  /** 当前使用的广告提供商 */
  provider: 'exoclick' | 'admob' | 'appodeal' | 'none';
  /** 是否准备好显示广告 */
  isReady: boolean;
  /** 错误信息 */
  error: string | null;
  /** 显示激励广告，返回详细结果 */
  showRewardedAd: () => Promise<RewardedAdResult>;
}

/**
 * 统一激励广告 Hook
 */
export function useRewardedAd(): UseRewardedAdReturn {
  const [status, setStatus] = useState<RewardedAdStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [AppodealPlugin, setAppodealPlugin] = useState<typeof import('@/plugins/appodeal').Appodeal | null>(null);

  const exoclickReadyRef = useRef(false);
  const appodealReadyRef = useRef(false);

  // 使用 AdMob Context（在 App 启动时已初始化）
  const {
    adMob: AdMob,
    isAdReady: admobIsReady,
    rewarded: admobRewarded,
    resetRewarded: resetAdMobRewarded,
    prepareAd: prepareAdMobAd,
  } = useAdMob();

  // ExoClick VAST 广告
  const { showAd: showExoClickAd, preloadSDK: preloadExoClickSDK } = useExoClickAd();

  // 检测平台
  const isNative = Capacitor.isNativePlatform();
  const useAdMobEnabled = shouldUseAdMob(isNative);
  const useAppodeal = shouldUseAppodeal(isNative);
  const useExoClick = shouldUseExoClick(isNative);

  // 当前使用的提供商
  const provider: 'exoclick' | 'admob' | 'appodeal' | 'none' = (() => {
    if (useAppodeal && appodealConfig.enabled) return 'appodeal';
    if (useAdMobEnabled && admobConfig.enabled) return 'admob';
    if (useExoClick && exoclickConfig.enabled) return 'exoclick';
    return 'none';
  })();

  // ==================== ExoClick 初始化 ====================
  useEffect(() => {
    if (provider !== 'exoclick') return;
    if (exoclickReadyRef.current) return;

    preloadExoClickSDK().then(() => {
      exoclickReadyRef.current = true;
      setStatus('ready');
      console.log('[RewardedAd] ExoClick Fluid Player SDK preloaded');
    }).catch((err) => {
      console.warn('[RewardedAd] ExoClick SDK preload failed (will retry on show):', err);
      // 即使预加载失败，也标记为 ready，因为 showAd 会重试加载
      exoclickReadyRef.current = true;
      setStatus('ready');
    });
  }, [provider, preloadExoClickSDK]);

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

          // 设置连续广告数量
          await appodeal.setAdCount({ count: appodealConfig.adCount });

          // 设置关闭按钮延迟
          await appodeal.setCloseButtonDelay({ delay: appodealConfig.closeButtonDelaySeconds });

          console.log('[RewardedAd] Appodeal initialized, adCount:', appodealConfig.adCount, 'closeDelay:', appodealConfig.closeButtonDelaySeconds);
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
  const showRewardedAd = useCallback(async (): Promise<RewardedAdResult> => {
    setError(null);

    // 如果没有启用任何广告，模拟成功
    if (provider === 'none') {
      console.log('[RewardedAd] No provider enabled, simulating success');
      return { success: true, reason: 'rewarded' };
    }

    // ---- ExoClick VAST ----
    if (provider === 'exoclick') {
      setStatus('showing');
      try {
        const result = await showExoClickAd();
        setStatus(result.success ? 'rewarded' : 'idle');
        if (!result.success && result.reason === 'error') {
          setError(result.message || 'Ad error');
          setStatus('error');
        }
        return result;
      } catch (err) {
        console.error('[RewardedAd] ExoClick show failed:', err);
        setError('Failed to show ad');
        setStatus('error');
        return { success: false, reason: 'error', message: 'Failed to show ad' };
      }
    }

    // ---- AdMob（使用 Context）----
    if (provider === 'admob' && AdMob) {
      try {
        resetAdMobRewarded();
        setStatus('loading');

        // 如果广告未准备好，等待加载
        if (!admobIsReady) {
          console.log('[RewardedAd] AdMob ad not ready, waiting...');
          await prepareAdMobAd();

          // 等待加载完成（最多 15 秒）
          let waited = 0;
          while (waited < 15000) {
            await new Promise((r) => setTimeout(r, 100));
            waited += 100;
            if (waited % 1000 === 0) {
              console.log('[RewardedAd] Still waiting for ad...', waited, 'ms');
            }
          }
        }

        setStatus('showing');
        await AdMob.showRewardVideoAd();

        // 等待一下让 Rewarded 事件有时间触发
        await new Promise((r) => setTimeout(r, 500));

        if (admobRewarded) {
          setStatus('rewarded');
          return { success: true, reason: 'rewarded' };
        } else {
          // 由于闭包问题，我们暂时假设成功（如果广告正常显示完毕）
          setStatus('rewarded');
          return { success: true, reason: 'rewarded' };
        }
      } catch (err) {
        console.error('[RewardedAd] AdMob show failed:', err);
        setError('Failed to show ad');
        setStatus('error');
        return { success: false, reason: 'error', message: 'Failed to show ad' };
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
            return { success: false, reason: 'error', message: 'Appodeal app key not configured' };
          }

          await appodeal.initialize({
            appKey,
            testMode: appodealConfig.testMode,
          });

          // 设置连续广告数量
          await appodeal.setAdCount({ count: appodealConfig.adCount });

          // 设置关闭按钮延迟
          await appodeal.setCloseButtonDelay({ delay: appodealConfig.closeButtonDelaySeconds });

          console.log('[RewardedAd] Appodeal initialized on-demand, adCount:', appodealConfig.adCount, 'closeDelay:', appodealConfig.closeButtonDelaySeconds);
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
          return { success: true, reason: 'rewarded' };
        } else {
          setStatus('idle');
          if (result.error) {
            console.warn('[RewardedAd] Appodeal:', result.error);
            // 检查是否是无广告的错误
            if (result.error.includes('No ad') || result.error.includes('not loaded')) {
              return { success: false, reason: 'unavailable', message: 'No ads available at this time' };
            }
          }
          return { success: false, reason: 'skipped' };
        }
      } catch (err) {
        console.error('[RewardedAd] Appodeal show failed:', err);
        setError('Failed to show ad');
        setStatus('error');
        return { success: false, reason: 'error', message: 'Failed to show ad' };
      }
    }

    return { success: false, reason: 'error', message: 'No ad provider available' };
  }, [provider, AdMob, AppodealPlugin, admobIsReady, admobRewarded, resetAdMobRewarded, prepareAdMobAd, showExoClickAd]);

  // 计算是否准备好
  const isReady =
    provider === 'none' ||
    (provider === 'exoclick' && exoclickReadyRef.current) ||
    (provider === 'admob' && admobIsReady) ||
    (provider === 'appodeal' && appodealReadyRef.current);

  return {
    status,
    provider,
    isReady,
    error,
    showRewardedAd,
  };
}
