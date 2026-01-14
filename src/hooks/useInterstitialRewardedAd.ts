'use client';

/**
 * 插页式激励广告 Hook
 *
 * 用于签到功能，用户点击签到后播放插页式激励广告，
 * 观看完成后发放签到积分。
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { admobConfig } from '@/config/ads';

export type InterstitialRewardedAdStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'showing'
  | 'rewarded'
  | 'error';

interface UseInterstitialRewardedAdReturn {
  /** 当前状态 */
  status: InterstitialRewardedAdStatus;
  /** 是否在原生环境中 */
  isNative: boolean;
  /** 是否启用 */
  isEnabled: boolean;
  /** 广告是否准备好 */
  isReady: boolean;
  /** 错误信息 */
  error: string | null;
  /** 显示插页式激励广告 */
  showInterstitialRewardedAd: () => Promise<boolean>;
  /** 预加载广告 */
  prepareAd: () => Promise<void>;
}

/**
 * 插页式激励广告 Hook
 *
 * 使用方式：
 * ```tsx
 * const { showInterstitialRewardedAd, isReady } = useInterstitialRewardedAd();
 *
 * const handleCheckin = async () => {
 *   const rewarded = await showInterstitialRewardedAd();
 *   if (rewarded) {
 *     // 用户成功观看广告，发放签到奖励
 *   }
 * };
 * ```
 */
export function useInterstitialRewardedAd(): UseInterstitialRewardedAdReturn {
  const [status, setStatus] = useState<InterstitialRewardedAdStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [AdMob, setAdMob] = useState<typeof import('@capacitor-community/admob').AdMob | null>(null);

  const rewardedRef = useRef(false);
  const isReadyRef = useRef(false);
  const listenerCleanupRef = useRef<(() => void) | null>(null);

  // 检测是否在原生环境
  const isNative = Capacitor.isNativePlatform();

  // 是否启用
  const isEnabled = admobConfig.enabled && isNative;

  // 获取当前平台的广告单元 ID
  const getAdUnitId = useCallback(() => {
    const platform = Capacitor.getPlatform();
    if (platform === 'android') {
      return admobConfig.interstitialRewarded.android;
    } else if (platform === 'ios') {
      return admobConfig.interstitialRewarded.ios;
    }
    return '';
  }, []);

  // 动态导入 AdMob 模块（仅在原生环境）
  useEffect(() => {
    if (!isNative) return;

    import('@capacitor-community/admob')
      .then((module) => {
        setAdMob(module.AdMob);
        console.log('[InterstitialRewarded] 模块加载成功');
      })
      .catch((err) => {
        console.error('[InterstitialRewarded] 模块加载失败:', err);
        setError('AdMob 模块加载失败');
      });
  }, [isNative]);

  // 预加载广告
  const prepareAd = useCallback(async () => {
    if (!AdMob || !isEnabled) return;

    const adUnitId = getAdUnitId();
    if (!adUnitId) {
      console.warn('[InterstitialRewarded] 广告单元 ID 未配置');
      return;
    }

    try {
      setStatus('loading');
      setError(null);

      // 动态导入获取 RewardInterstitialAdPluginEvents
      const { RewardInterstitialAdPluginEvents } = await import('@capacitor-community/admob');

      // 清理之前的监听器
      if (listenerCleanupRef.current) {
        listenerCleanupRef.current();
      }

      // 设置事件监听
      const loadedListener = await AdMob.addListener(
        RewardInterstitialAdPluginEvents.Loaded,
        () => {
          console.log('[InterstitialRewarded] 广告加载完成');
          isReadyRef.current = true;
          setStatus('ready');
        }
      );

      const failedListener = await AdMob.addListener(
        RewardInterstitialAdPluginEvents.FailedToLoad,
        (err: { message?: string }) => {
          console.error('[InterstitialRewarded] 广告加载失败:', err);
          isReadyRef.current = false;
          setError(err.message || '广告加载失败');
          setStatus('error');
        }
      );

      const rewardListener = await AdMob.addListener(
        RewardInterstitialAdPluginEvents.Rewarded,
        (reward: { type: string; amount: number }) => {
          console.log('[InterstitialRewarded] 用户获得奖励:', reward);
          rewardedRef.current = true;
          setStatus('rewarded');
        }
      );

      const dismissListener = await AdMob.addListener(
        RewardInterstitialAdPluginEvents.Dismissed,
        () => {
          console.log('[InterstitialRewarded] 广告已关闭');
          // 广告关闭后重新预加载
          prepareAd();
        }
      );

      // 保存清理函数
      listenerCleanupRef.current = () => {
        loadedListener.remove();
        failedListener.remove();
        rewardListener.remove();
        dismissListener.remove();
      };

      // 预加载插页式激励广告
      await AdMob.prepareRewardInterstitialAd({
        adId: adUnitId,
        isTesting: admobConfig.useTestAds,
      });
    } catch (err) {
      console.error('[InterstitialRewarded] 预加载失败:', err);
      setError('广告预加载失败');
      setStatus('error');
    }
  }, [AdMob, isEnabled, getAdUnitId]);

  // 自动预加载
  useEffect(() => {
    if (AdMob && isEnabled) {
      prepareAd();
    }

    return () => {
      if (listenerCleanupRef.current) {
        listenerCleanupRef.current();
      }
    };
  }, [AdMob, isEnabled, prepareAd]);

  // 显示插页式激励广告
  const showInterstitialRewardedAd = useCallback(async (): Promise<boolean> => {
    // 非原生环境，模拟成功
    if (!isNative) {
      console.log('[InterstitialRewarded] 非原生环境，模拟广告观看成功');
      return true;
    }

    // AdMob 未启用，模拟成功
    if (!isEnabled || !AdMob) {
      console.log('[InterstitialRewarded] AdMob 未启用，模拟广告观看成功');
      return true;
    }

    try {
      rewardedRef.current = false;
      setStatus('showing');
      setError(null);

      // 如果广告未准备好，先预加载
      if (!isReadyRef.current) {
        console.log('[InterstitialRewarded] 广告未准备好，开始加载...');
        await prepareAd();
        // 等待广告准备好（最多 15 秒）
        let waited = 0;
        while (!isReadyRef.current && waited < 15000) {
          await new Promise(resolve => setTimeout(resolve, 100));
          waited += 100;
        }

        if (!isReadyRef.current) {
          throw new Error('广告加载超时');
        }
      }

      // 重置 ready 状态（广告即将显示）
      isReadyRef.current = false;

      // 显示插页式激励广告
      await AdMob.showRewardInterstitialAd();

      // 等待广告结果
      await new Promise(resolve => setTimeout(resolve, 500));

      return rewardedRef.current;
    } catch (err) {
      console.error('[InterstitialRewarded] 显示广告失败:', err);
      setError(err instanceof Error ? err.message : '广告显示失败');
      setStatus('error');
      return false;
    }
  }, [isNative, isEnabled, AdMob, prepareAd]);

  return {
    status,
    isNative,
    isEnabled,
    isReady: status === 'ready',
    error,
    showInterstitialRewardedAd,
    prepareAd,
  };
}
