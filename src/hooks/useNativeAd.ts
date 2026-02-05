'use client';

/**
 * 原生广告 Hook
 *
 * 用于在 Feed 流中显示原生广告
 * 使用自定义 Capacitor 插件加载 AdMob 原生高级广告
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { admobConfig, isNativeAdEnabled, getNativeAdPosition } from '@/config/ads';
import { NativeAd, type NativeAdData } from '@/plugins/native-ad';

export type { NativeAdData };

export type NativeAdStatus = 'idle' | 'loading' | 'loaded' | 'error' | 'clicked';

interface UseNativeAdReturn {
  /** 当前状态 */
  status: NativeAdStatus;
  /** 是否在原生环境中 */
  isNative: boolean;
  /** 是否启用 */
  isEnabled: boolean;
  /** 错误信息 */
  error: string | null;
  /** 广告数据 */
  adData: NativeAdData | null;
  /** 广告在列表中的位置 */
  position: number;
  /** 加载广告 */
  loadAd: () => Promise<void>;
  /** 记录广告点击 */
  recordClick: () => void;
  /** 记录广告展示 */
  recordImpression: () => void;
  /** 销毁广告 */
  destroy: () => void;
}

/**
 * 原生广告 Hook
 *
 * 使用方式：
 * ```tsx
 * const { isEnabled, adData, position, loadAd, recordClick } = useNativeAd();
 *
 * useEffect(() => {
 *   if (isEnabled) loadAd();
 * }, [isEnabled, loadAd]);
 *
 * // 在列表的 position 位置插入广告卡片
 * ```
 */
export function useNativeAd(): UseNativeAdReturn {
  const [status, setStatus] = useState<NativeAdStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [adData, setAdData] = useState<NativeAdData | null>(null);
  const listenerCleanupRef = useRef<(() => void) | null>(null);
  const isInitializedRef = useRef(false);

  // 检测是否在原生环境
  const isNative = Capacitor.isNativePlatform();

  // 是否启用
  const isEnabled = isNativeAdEnabled() && isNative;

  // 广告位置
  const position = getNativeAdPosition();

  // 获取当前平台的广告单元 ID
  const getAdUnitId = useCallback(() => {
    const platform = Capacitor.getPlatform();
    if (platform === 'android') {
      return admobConfig.native.android;
    } else if (platform === 'ios') {
      return admobConfig.native.ios;
    }
    return '';
  }, []);

  // 初始化并设置监听器
  useEffect(() => {
    if (!isNative || isInitializedRef.current) return;

    const setupListeners = async () => {
      try {
        // 初始化
        await NativeAd.initialize();
        isInitializedRef.current = true;

        // 设置监听器
        const loadedListener = await NativeAd.addListener('adLoaded', (data) => {
          console.log('[NativeAd] Ad loaded:', data);
          setAdData(data);
          setStatus('loaded');
        });

        const failedListener = await NativeAd.addListener('adFailedToLoad', (data) => {
          console.error('[NativeAd] Ad failed to load:', data);
          setError(data.message);
          setStatus('error');
        });

        const clickedListener = await NativeAd.addListener('adClicked', () => {
          console.log('[NativeAd] Ad clicked');
          setStatus('clicked');
        });

        const impressionListener = await NativeAd.addListener('adImpression', () => {
          console.log('[NativeAd] Ad impression recorded');
        });

        // 保存清理函数
        listenerCleanupRef.current = () => {
          loadedListener.remove();
          failedListener.remove();
          clickedListener.remove();
          impressionListener.remove();
        };
      } catch (err) {
        console.error('[NativeAd] Failed to initialize:', err);
      }
    };

    setupListeners();

    return () => {
      if (listenerCleanupRef.current) {
        listenerCleanupRef.current();
      }
    };
  }, [isNative]);

  // 加载广告
  const loadAd = useCallback(async () => {
    if (!isEnabled) {
      console.log('[NativeAd] Not enabled, skipping');
      return;
    }

    const adUnitId = getAdUnitId();
    if (!adUnitId) {
      console.warn('[NativeAd] Ad unit ID not configured');
      setError('Ad unit ID not configured');
      setStatus('error');
      return;
    }

    try {
      setStatus('loading');
      setError(null);

      console.log('[NativeAd] Loading ad with unit ID:', adUnitId);
      const data = await NativeAd.loadAd({ adUnitId });

      // 数据会通过监听器设置，这里只是备用
      if (data) {
        setAdData(data);
        setStatus('loaded');
      }
    } catch (err) {
      console.error('[NativeAd] Failed to load:', err);
      setError(err instanceof Error ? err.message : 'Failed to load ad');
      setStatus('error');
    }
  }, [isEnabled, getAdUnitId]);

  // 记录点击
  const recordClick = useCallback(() => {
    if (!isNative) return;

    NativeAd.recordClick().catch((err) => {
      console.error('[NativeAd] Failed to record click:', err);
    });
  }, [isNative]);

  // 记录展示
  const recordImpression = useCallback(() => {
    if (!isNative) return;

    NativeAd.recordImpression().catch((err) => {
      console.error('[NativeAd] Failed to record impression:', err);
    });
  }, [isNative]);

  // 销毁广告
  const destroy = useCallback(() => {
    if (!isNative) return;

    NativeAd.destroy().catch((err) => {
      console.error('[NativeAd] Failed to destroy:', err);
    });

    setAdData(null);
    setStatus('idle');
  }, [isNative]);

  // 自动加载
  useEffect(() => {
    if (isEnabled && status === 'idle' && isInitializedRef.current) {
      // 延迟加载，等待初始化完成
      const timer = setTimeout(() => {
        loadAd();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isEnabled, status, loadAd]);

  // 组件卸载时销毁广告
  useEffect(() => {
    return () => {
      if (isNative && adData) {
        NativeAd.destroy().catch(() => {});
      }
    };
  }, [isNative, adData]);

  return {
    status,
    isNative,
    isEnabled,
    error,
    adData,
    position,
    loadAd,
    recordClick,
    recordImpression,
    destroy,
  };
}
