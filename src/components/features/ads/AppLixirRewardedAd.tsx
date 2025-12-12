'use client';

import { useEffect, useCallback, useRef } from 'react';

// AppLixir 广告状态
export type AdStatus =
  | 'ad-watched'      // 用户看完广告，可以发奖励
  | 'ad-interrupted'  // 用户中途关闭
  | 'ad-unavailable'  // 没有可用广告
  | 'ad-error'        // 加载错误
  | 'ad-started'      // 广告开始播放
  | 'ad-clicked';     // 用户点击了广告

interface AppLixirConfig {
  zoneId: number;
  devId: number;
  gameId: number;
}

interface UseAppLixirOptions {
  config: AppLixirConfig;
  onAdWatched?: () => void;
  onAdClosed?: () => void;
  onAdError?: (status: AdStatus) => void;
}

// 声明全局函数类型
declare global {
  interface Window {
    invokeApplixirVideoUnit: (options: {
      zoneId: number;
      devId: number;
      gameId: number;
      adStatusCb: (status: string) => void;
      fallback?: number;
      verbosity?: number;
    }) => void;
  }
}

/**
 * AppLixir 激励视频广告 Hook
 */
export function useAppLixirAd({ config, onAdWatched, onAdClosed, onAdError }: UseAppLixirOptions) {
  const scriptLoadedRef = useRef(false);
  const isShowingRef = useRef(false);

  // 加载 SDK 脚本
  useEffect(() => {
    if (scriptLoadedRef.current) return;
    if (typeof window === 'undefined') return;

    // 检查是否已加载
    if (document.getElementById('applixir-sdk')) {
      scriptLoadedRef.current = true;
      return;
    }

    const script = document.createElement('script');
    script.id = 'applixir-sdk';
    script.src = 'https://cdn.applixir.com/applixir.app.v6.0.1.js';
    script.type = 'text/javascript';
    script.onload = () => {
      scriptLoadedRef.current = true;
      console.log('✅ [AppLixir] SDK loaded');
    };
    script.onerror = () => {
      console.error('❌ [AppLixir] Failed to load SDK');
    };
    document.head.appendChild(script);

    // 添加容器 div（如果不存在）
    if (!document.getElementById('applixir_vanishing_div')) {
      const container = document.createElement('div');
      container.id = 'applixir_vanishing_div';
      container.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 99999; display: none;';

      const iframe = document.createElement('iframe');
      iframe.id = 'applixir_parent';
      iframe.style.cssText = 'width: 100%; height: 100%; border: none;';

      container.appendChild(iframe);
      document.body.appendChild(container);
    }

    return () => {
      // 清理（可选，一般不需要移除）
    };
  }, []);

  // 显示广告
  const showAd = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!window.invokeApplixirVideoUnit) {
      console.error('❌ [AppLixir] SDK not loaded yet');
      onAdError?.('ad-error');
      return;
    }
    if (isShowingRef.current) {
      console.warn('⚠️ [AppLixir] Ad is already showing');
      return;
    }

    isShowingRef.current = true;

    // 显示容器
    const container = document.getElementById('applixir_vanishing_div');
    if (container) {
      container.style.display = 'block';
    }

    // 状态回调
    const adStatusCallback = (status: string) => {
      console.log('📺 [AppLixir] Ad status:', status);

      switch (status) {
        case 'ad-watched':
          // 用户看完了广告，发奖励！
          isShowingRef.current = false;
          if (container) container.style.display = 'none';
          onAdWatched?.();
          break;

        case 'ad-interrupted':
          // 用户中途关闭
          isShowingRef.current = false;
          if (container) container.style.display = 'none';
          onAdClosed?.();
          break;

        case 'ad-unavailable':
        case 'ad-error':
          // 广告不可用或出错
          isShowingRef.current = false;
          if (container) container.style.display = 'none';
          onAdError?.(status as AdStatus);
          break;

        case 'ad-started':
          // 广告开始播放
          console.log('▶️ [AppLixir] Ad started playing');
          break;

        case 'ad-clicked':
          // 用户点击了广告
          console.log('👆 [AppLixir] Ad clicked');
          break;
      }
    };

    // 调用 SDK 显示广告
    window.invokeApplixirVideoUnit({
      zoneId: config.zoneId,
      devId: config.devId,
      gameId: config.gameId,
      adStatusCb: adStatusCallback,
      fallback: 1,
      verbosity: 0,
    });
  }, [config, onAdWatched, onAdClosed, onAdError]);

  // 检查是否可以显示广告
  const isReady = scriptLoadedRef.current && typeof window !== 'undefined' && !!window.invokeApplixirVideoUnit;

  return {
    showAd,
    isReady,
    isShowing: isShowingRef.current,
  };
}