'use client';

/**
 * 插页式广告 Hook
 *
 * 用于创建成功后展示广告（非订阅用户）
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { admobConfig } from '@/config/ads';

export type InterstitialAdStatus = 'idle' | 'loading' | 'ready' | 'showing' | 'closed' | 'error';

interface UseInterstitialAdReturn {
  /** 当前状态 */
  status: InterstitialAdStatus;
  /** 是否在原生环境中 */
  isNative: boolean;
  /** 是否启用 */
  isEnabled: boolean;
  /** 广告是否准备好 */
  isReady: boolean;
  /** 错误信息 */
  error: string | null;
  /** 显示插页式广告 */
  showInterstitialAd: () => Promise<boolean>;
  /** 预加载广告 */
  prepareAd: () => Promise<void>;
}

/**
 * 插页式广告 Hook
 *
 * 使用方式：
 * ```tsx
 * const { showInterstitialAd, isNative } = useInterstitialAd();
 *
 * // 创建成功后显示广告
 * useEffect(() => {
 *   if (generatedContent && !isSubscribed) {
 *     showInterstitialAd();
 *   }
 * }, [generatedContent]);
 * ```
 */
export function useInterstitialAd(): UseInterstitialAdReturn {
  const [status, setStatus] = useState<InterstitialAdStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [AdMob, setAdMob] = useState<typeof import('@capacitor-community/admob').AdMob | null>(null);

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
      return admobConfig.interstitial.android;
    } else if (platform === 'ios') {
      return admobConfig.interstitial.ios;
    }
    return '';
  }, []);

  // 动态导入 AdMob 模块（仅在原生环境）
  useEffect(() => {
    if (!isNative) return;

    import('@capacitor-community/admob')
      .then((module) => {
        setAdMob(module.AdMob);
        console.log('[Interstitial] 模块加载成功');
      })
      .catch((err) => {
        console.error('[Interstitial] 模块加载失败:', err);
        setError('AdMob 模块加载失败');
      });
  }, [isNative]);

  // 预加载广告
  const prepareAd = useCallback(async () => {
    if (!AdMob || !isEnabled) return;

    const adUnitId = getAdUnitId();
    if (!adUnitId) {
      console.warn('[Interstitial] 广告单元 ID 未配置');
      return;
    }

    try {
      setStatus('loading');
      setError(null);

      // 动态导入获取 InterstitialAdPluginEvents
      const { InterstitialAdPluginEvents } = await import('@capacitor-community/admob');

      // 清理之前的监听器
      if (listenerCleanupRef.current) {
        listenerCleanupRef.current();
      }

      // 设置事件监听
      const loadedListener = await AdMob.addListener(
        InterstitialAdPluginEvents.Loaded,
        () => {
          console.log('[Interstitial] 广告加载完成');
          isReadyRef.current = true;
          setStatus('ready');
        }
      );

      const failedListener = await AdMob.addListener(
        InterstitialAdPluginEvents.FailedToLoad,
        (err: { message?: string }) => {
          console.error('[Interstitial] 广告加载失败:', err);
          isReadyRef.current = false;
          setError(err.message || '广告加载失败');
          setStatus('error');
        }
      );

      const dismissListener = await AdMob.addListener(
        InterstitialAdPluginEvents.Dismissed,
        () => {
          console.log('[Interstitial] 广告已关闭');
          setStatus('closed');
          // 广告关闭后重新预加载
          prepareAd();
        }
      );

      // 保存清理函数
      listenerCleanupRef.current = () => {
        loadedListener.remove();
        failedListener.remove();
        dismissListener.remove();
      };

      // 预加载插页式广告
      await AdMob.prepareInterstitial({
        adId: adUnitId,
        isTesting: admobConfig.useTestAds,
      });
    } catch (err) {
      console.error('[Interstitial] 预加载失败:', err);
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

  // 显示插页式广告
  const showInterstitialAd = useCallback(async (): Promise<boolean> => {
    // 非原生环境，跳过
    if (!isNative) {
      console.log('[Interstitial] 非原生环境，跳过广告');
      return true;
    }

    // AdMob 未启用，跳过
    if (!isEnabled || !AdMob) {
      console.log('[Interstitial] AdMob 未启用，跳过广告');
      return true;
    }

    try {
      setStatus('showing');
      setError(null);

      // 如果广告未准备好，先预加载
      if (!isReadyRef.current) {
        console.log('[Interstitial] 广告未准备好，开始加载...');
        await prepareAd();
        // 等待广告准备好（最多 10 秒）
        let waited = 0;
        while (!isReadyRef.current && waited < 10000) {
          await new Promise(resolve => setTimeout(resolve, 100));
          waited += 100;
        }

        if (!isReadyRef.current) {
          console.log('[Interstitial] 广告加载超时，跳过');
          setStatus('idle');
          return true; // 超时也返回 true，不阻塞用户
        }
      }

      // 重置 ready 状态（广告即将显示）
      isReadyRef.current = false;

      // 显示插页式广告
      await AdMob.showInterstitial();

      return true;
    } catch (err) {
      console.error('[Interstitial] 显示广告失败:', err);
      setError(err instanceof Error ? err.message : '广告显示失败');
      setStatus('error');
      return true; // 失败也返回 true，不阻塞用户
    }
  }, [isNative, isEnabled, AdMob, prepareAd]);

  return {
    status,
    isNative,
    isEnabled,
    isReady: status === 'ready',
    error,
    showInterstitialAd,
    prepareAd,
  };
}
