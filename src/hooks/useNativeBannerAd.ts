'use client';

/**
 * 首页横幅原生广告 Hook
 *
 * 用于在首页顶部显示横幅样式的原生广告
 * 使用自定义 Capacitor 插件加载 AdMob 原生高级广告
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { admobConfig, isAdMobNativeBannerEnabled } from '@/config/ads';
import { NativeAd, type NativeAdData } from '@/plugins/native-ad';

export type { NativeAdData };

export type NativeBannerAdStatus = 'idle' | 'loading' | 'loaded' | 'error' | 'clicked';

// 调试日志
const DEBUG = true;
const log = (...args: unknown[]) => DEBUG && console.log('[useNativeBannerAd]', ...args);

interface UseNativeBannerAdReturn {
  /** 当前状态 */
  status: NativeBannerAdStatus;
  /** 是否在原生环境中 */
  isNative: boolean;
  /** 是否启用 */
  isEnabled: boolean;
  /** 错误信息 */
  error: string | null;
  /** 广告数据 */
  adData: NativeAdData | null;
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
 * 首页横幅原生广告 Hook
 */
export function useNativeBannerAd(): UseNativeBannerAdReturn {
  const [status, setStatus] = useState<NativeBannerAdStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [adData, setAdData] = useState<NativeAdData | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const listenerCleanupRef = useRef<(() => void) | null>(null);

  // 客户端挂载后才检测平台，避免 Hydration 错误
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 检测是否在原生环境（只在客户端检测）
  const isNative = isMounted ? Capacitor.isNativePlatform() : false;

  // 是否启用
  const isEnabled = isAdMobNativeBannerEnabled() && isNative;

  log('Hook state:', { isMounted, isNative, isEnabled, isInitialized, status });

  // 获取当前平台的广告单元 ID
  const getAdUnitId = useCallback(() => {
    const platform = Capacitor.getPlatform();
    if (platform === 'android') {
      return admobConfig.nativeBanner.android;
    } else if (platform === 'ios') {
      return admobConfig.nativeBanner.ios;
    }
    return '';
  }, []);

  // 初始化并设置监听器
  useEffect(() => {
    if (!isNative || isInitialized) return;

    log('Initializing NativeAd plugin for banner...');

    const setupListeners = async () => {
      try {
        // 初始化（可能已被其他组件初始化）
        await NativeAd.initialize();
        log('NativeAd plugin initialized for banner');

        // 设置监听器（使用唯一 ID 区分）
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

      log('Loading banner ad with unit ID:', adUnitId);
      const data = await NativeAd.loadAd({ adUnitId });
      log('loadAd returned:', data);

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

  // 记录点击（触发 AdMob SDK 处理点击跳转）
  const recordClick = useCallback(async () => {
    if (!isNative) return;

    const adUnitId = getAdUnitId();
    log('Recording click for:', adUnitId);

    try {
      const result = await NativeAd.recordClick({ adUnitId });
      log('Click recorded successfully:', result);
    } catch (err) {
      console.error('[NativeBannerAd] Failed to record click:', err);
    }
  }, [isNative, getAdUnitId]);

  // 记录展示
  const recordImpression = useCallback(() => {
    if (!isNative) return;

    NativeAd.recordImpression().catch((err) => {
      console.error('[NativeBannerAd] Failed to record impression:', err);
    });
  }, [isNative]);

  // 销毁广告
  const destroy = useCallback(() => {
    if (!isNative) return;

    NativeAd.destroy().catch((err) => {
      console.error('[NativeBannerAd] Failed to destroy:', err);
    });

    setAdData(null);
    setStatus('idle');
  }, [isNative]);

  // 自动加载
  useEffect(() => {
    log('Auto-load check:', { isEnabled, status, isInitialized });
    if (isEnabled && status === 'idle' && isInitialized) {
      log('Starting auto-load...');
      const timer = setTimeout(() => {
        loadAd();
      }, 300);
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
    loadAd,
    recordClick,
    recordImpression,
    destroy,
  };
}
