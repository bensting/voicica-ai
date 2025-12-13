'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { getAdMobConfig } from '@/config/appConfig';

/**
 * AdMob 激励广告状态
 */
export type AdMobStatus = 'idle' | 'loading' | 'ready' | 'showing' | 'rewarded' | 'error';

interface UseAdMobReturn {
  /** 当前状态 */
  status: AdMobStatus;
  /** 是否在原生环境中 */
  isNative: boolean;
  /** AdMob 是否启用 */
  isEnabled: boolean;
  /** 广告是否准备好 */
  isReady: boolean;
  /** 错误信息 */
  error: string | null;
  /** 显示激励广告 */
  showRewardedAd: () => Promise<boolean>;
  /** 预加载广告 */
  prepareAd: () => Promise<void>;
}

/**
 * AdMob 激励广告 Hook
 *
 * 使用方式：
 * ```tsx
 * const { showRewardedAd, isNative, isEnabled } = useAdMob();
 *
 * const handleWatchAd = async () => {
 *   const rewarded = await showRewardedAd();
 *   if (rewarded) {
 *     // 用户成功观看广告，发放奖励
 *   }
 * };
 * ```
 */
export function useAdMob(): UseAdMobReturn {
  const [status, setStatus] = useState<AdMobStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [AdMob, setAdMob] = useState<typeof import('@capacitor-community/admob').AdMob | null>(null);

  const rewardedRef = useRef(false);
  const isReadyRef = useRef(false);
  const listenerCleanupRef = useRef<(() => void) | null>(null);

  // 检测是否在原生环境
  const isNative = Capacitor.isNativePlatform();

  // 获取配置
  const config = getAdMobConfig();
  const isEnabled = config.enabled && isNative;

  // 获取当前平台的广告单元 ID
  const getAdUnitId = useCallback(() => {
    const platform = Capacitor.getPlatform();
    if (platform === 'android') {
      return config.android_rewarded_ad_unit_id;
    } else if (platform === 'ios') {
      return config.ios_rewarded_ad_unit_id;
    }
    return '';
  }, [config]);

  // 动态导入 AdMob 模块（仅在原生环境）
  useEffect(() => {
    if (!isNative) return;

    import('@capacitor-community/admob')
      .then((module) => {
        setAdMob(module.AdMob);
        console.log('[AdMob] 模块加载成功');
      })
      .catch((err) => {
        console.error('[AdMob] 模块加载失败:', err);
        setError('AdMob 模块加载失败');
      });
  }, [isNative]);

  // 初始化 AdMob
  useEffect(() => {
    if (!AdMob || !isEnabled) return;

    const initAdMob = async () => {
      try {
        // 请求追踪授权（iOS 14+）
        try {
          await AdMob.requestTrackingAuthorization();
        } catch {
          // 忽略追踪授权错误（Android 上会失败）
        }

        await AdMob.initialize({
          // 测试设备 ID（开发时使用）
          testingDevices: process.env.NODE_ENV === 'development' ? ['YOUR_TEST_DEVICE_ID'] : [],
          // 初始化类型
          initializeForTesting: process.env.NODE_ENV === 'development',
        });
        console.log('[AdMob] 初始化成功');
      } catch (err) {
        console.error('[AdMob] 初始化失败:', err);
        setError('AdMob 初始化失败');
      }
    };

    initAdMob();
  }, [AdMob, isEnabled]);

  // 预加载广告
  const prepareAd = useCallback(async () => {
    if (!AdMob || !isEnabled) return;

    const adUnitId = getAdUnitId();
    if (!adUnitId) {
      console.warn('[AdMob] 广告单元 ID 未配置');
      return;
    }

    try {
      setStatus('loading');
      setError(null);

      // 动态导入获取 RewardAdPluginEvents
      const { RewardAdPluginEvents } = await import('@capacitor-community/admob');

      // 清理之前的监听器
      if (listenerCleanupRef.current) {
        listenerCleanupRef.current();
      }

      // 设置事件监听
      const loadedListener = await AdMob.addListener(
        RewardAdPluginEvents.Loaded,
        () => {
          console.log('[AdMob] 激励广告加载完成');
          isReadyRef.current = true;
          setStatus('ready');
        }
      );

      const failedListener = await AdMob.addListener(
        RewardAdPluginEvents.FailedToLoad,
        (err: { message?: string }) => {
          console.error('[AdMob] 激励广告加载失败:', err);
          isReadyRef.current = false;
          setError(err.message || '广告加载失败');
          setStatus('error');
        }
      );

      const rewardListener = await AdMob.addListener(
        RewardAdPluginEvents.Rewarded,
        (reward: { type: string; amount: number }) => {
          console.log('[AdMob] 用户获得奖励:', reward);
          rewardedRef.current = true;
          setStatus('rewarded');
        }
      );

      const dismissListener = await AdMob.addListener(
        RewardAdPluginEvents.Dismissed,
        () => {
          console.log('[AdMob] 广告已关闭');
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

      // 预加载广告
      await AdMob.prepareRewardVideoAd({
        adId: adUnitId,
        isTesting: process.env.NODE_ENV === 'development',
      });
    } catch (err) {
      console.error('[AdMob] 预加载失败:', err);
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

  // 显示激励广告
  const showRewardedAd = useCallback(async (): Promise<boolean> => {
    // 非原生环境，模拟成功
    if (!isNative) {
      console.log('[AdMob] 非原生环境，模拟广告观看成功');
      return true;
    }

    // AdMob 未启用，模拟成功
    if (!isEnabled || !AdMob) {
      console.log('[AdMob] AdMob 未启用，模拟广告观看成功');
      return true;
    }

    try {
      rewardedRef.current = false;
      setStatus('showing');
      setError(null);

      // 如果广告未准备好，先预加载
      if (!isReadyRef.current) {
        await prepareAd();
        // 等待广告准备好（最多 10 秒）
        let waited = 0;
        while (!isReadyRef.current && waited < 10000) {
          await new Promise(resolve => setTimeout(resolve, 100));
          waited += 100;
        }
      }

      // 重置 ready 状态（广告即将显示）
      isReadyRef.current = false;

      // 显示广告
      await AdMob.showRewardVideoAd();

      // 等待广告结果
      await new Promise(resolve => setTimeout(resolve, 500));

      return rewardedRef.current;
    } catch (err) {
      console.error('[AdMob] 显示广告失败:', err);
      setError('广告显示失败');
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
    showRewardedAd,
    prepareAd,
  };
}
