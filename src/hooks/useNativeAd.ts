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

// 调试日志开关
const DEBUG = true;
const log = (...args: unknown[]) => DEBUG && console.log('[useNativeAd]', ...args);

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
  const [isInitialized, setIsInitialized] = useState(false);
  const listenerCleanupRef = useRef<(() => void) | null>(null);

  // 检测是否在原生环境
  const isNative = Capacitor.isNativePlatform();

  // 是否启用
  const isEnabled = isNativeAdEnabled() && isNative;

  // 广告位置
  const position = getNativeAdPosition();

  log('Hook state:', { isNative, isEnabled, isInitialized, status, position });

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
    if (!isNative || isInitialized) return;

    log('Initializing NativeAd plugin...');

    const setupListeners = async () => {
      try {
        // 初始化
        await NativeAd.initialize();
        log('NativeAd plugin initialized');

        // 设置监听器
        const loadedListener = await NativeAd.addListener('adLoaded', (data) => {
          log('Ad loaded via listener:', data);
          setAdData(data);
          setStatus('loaded');
        });

        const failedListener = await NativeAd.addListener('adFailedToLoad', (data) => {
          log('Ad failed to load via listener:', data);
          setError(data.message);
          setStatus('error');
        });

        const clickedListener = await NativeAd.addListener('adClicked', () => {
          log('Ad clicked');
          setStatus('clicked');
        });

        const impressionListener = await NativeAd.addListener('adImpression', () => {
          log('Ad impression recorded');
        });

        // 保存清理函数
        listenerCleanupRef.current = () => {
          loadedListener.remove();
          failedListener.remove();
          clickedListener.remove();
          impressionListener.remove();
        };

        // 使用 state 触发重新渲染，这样自动加载 effect 才会运行
        setIsInitialized(true);
      } catch (err) {
        log('Failed to initialize:', err);
      }
    };

    setupListeners();

    return () => {
      if (listenerCleanupRef.current) {
        listenerCleanupRef.current();
      }
    };
  }, [isNative, isInitialized]);

  // 加载广告
  const loadAd = useCallback(async () => {
    log('loadAd called, isEnabled:', isEnabled);
    if (!isEnabled) {
      log('Not enabled, skipping');
      return;
    }

    const adUnitId = getAdUnitId();
    log('Ad unit ID:', adUnitId);
    if (!adUnitId) {
      log('Ad unit ID not configured');
      setError('Ad unit ID not configured');
      setStatus('error');
      return;
    }

    try {
      setStatus('loading');
      setError(null);

      log('Loading ad with unit ID:', adUnitId);
      const data = await NativeAd.loadAd({ adUnitId });
      log('loadAd returned:', data);

      // 数据会通过监听器设置，这里只是备用
      if (data) {
        setAdData(data);
        setStatus('loaded');
      }
    } catch (err) {
      log('Failed to load:', err);
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
    log('Auto-load check:', { isEnabled, status, isInitialized });
    if (isEnabled && status === 'idle' && isInitialized) {
      log('Starting auto-load...');
      // 延迟加载，等待初始化完成
      const timer = setTimeout(() => {
        loadAd();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isEnabled, status, isInitialized, loadAd]);

  // 组件卸载时销毁广告
  useEffect(() => {
    return () => {
      if (isNative && adData) {
        log('Destroying ad on unmount');
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
