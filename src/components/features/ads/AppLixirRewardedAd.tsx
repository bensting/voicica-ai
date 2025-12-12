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
  apiKey: string;
}

interface UseAppLixirOptions {
  config: AppLixirConfig;
  onAdWatched?: () => void;
  onAdClosed?: () => void;
  onAdError?: (status: AdStatus) => void;
}

// 容器 ID
const CONTAINER_ID = 'applixir-container';

// 声明全局函数类型
declare global {
  interface Window {
    initializeAndOpenPlayer: (options: {
      apiKey: string;
      injectionElementId: string;
      adStatusCallbackFn: (status: string) => void;
      adErrorCallbackFn: (error: { getError: () => { data: { errorCode?: number; errorMessage?: string } } }) => void;
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

    // 添加容器 div（如果不存在）
    if (!document.getElementById(CONTAINER_ID)) {
      const container = document.createElement('div');
      container.id = CONTAINER_ID;
      // 设置高 z-index 确保广告显示在最上层
      container.style.cssText = 'position: relative; z-index: 99999;';
      document.body.appendChild(container);
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

    return () => {
      // 清理（可选，一般不需要移除）
    };
  }, []);

  // 显示广告
  const showAd = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!window.initializeAndOpenPlayer) {
      console.error('❌ [AppLixir] SDK not loaded yet');
      onAdError?.('ad-error');
      return;
    }
    if (isShowingRef.current) {
      console.warn('⚠️ [AppLixir] Ad is already showing');
      return;
    }

    isShowingRef.current = true;

    // 状态回调
    const adStatusCallback = (status: string) => {
      console.log('📺 [AppLixir] Ad status:', status);

      switch (status) {
        case 'ad-watched':
          // 用户看完了广告，发奖励！
          isShowingRef.current = false;
          onAdWatched?.();
          break;

        case 'ad-interrupted':
          // 用户中途关闭
          isShowingRef.current = false;
          onAdClosed?.();
          break;

        case 'ad-unavailable':
          // 广告不可用
          isShowingRef.current = false;
          onAdError?.('ad-unavailable');
          break;

        case 'ad-started':
          // 广告开始播放
          console.log('▶️ [AppLixir] Ad started playing');
          break;

        case 'ad-clicked':
          // 用户点击了广告
          console.log('👆 [AppLixir] Ad clicked');
          break;

        default:
          console.log('📺 [AppLixir] Unknown status:', status);
      }
    };

    // 错误回调
    const adErrorCallback = (error: { getError: () => { data: { errorCode?: number; errorMessage?: string } } }) => {
      const errorData = error.getError();
      const errorInfo = errorData?.data || {};
      console.error('❌ [AppLixir] Error:', errorInfo);
      isShowingRef.current = false;

      // 错误码 303 = 无可用广告
      if (errorInfo.errorCode === 303 || errorInfo.errorMessage?.includes('No Ads')) {
        onAdError?.('ad-unavailable');
      } else {
        onAdError?.('ad-error');
      }
    };

    // 调用 SDK 显示广告
    console.log('🎬 [AppLixir] Opening player...');
    window.initializeAndOpenPlayer({
      apiKey: config.apiKey,
      injectionElementId: CONTAINER_ID,
      adStatusCallbackFn: adStatusCallback,
      adErrorCallbackFn: adErrorCallback,
    });
  }, [config.apiKey, onAdWatched, onAdClosed, onAdError]);

  // 检查是否可以显示广告
  const isReady = scriptLoadedRef.current && typeof window !== 'undefined' && !!window.initializeAndOpenPlayer;

  return {
    showAd,
    isReady,
    isShowing: isShowingRef.current,
  };
}