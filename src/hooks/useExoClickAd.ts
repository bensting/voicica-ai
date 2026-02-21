'use client';

/**
 * ExoClick VAST 激励广告 Hook
 *
 * 使用 Fluid Player 加载 ExoClick VAST In-Stream 广告。
 * 广告作为 preRoll 播放，主视频使用占位视频。
 *
 * 流程：
 * 1. 动态加载 Fluid Player SDK
 * 2. 创建 video 元素 + 全屏遮罩层
 * 3. 配置 VAST preRoll 广告
 * 4. 通过回调判断结果（看完/跳过/无广告）
 * 5. 广告结束后销毁播放器、移除 DOM 元素
 */

import { useRef, useCallback } from 'react';
import type { RewardedAdResult } from './useRewardedAd';
import { getExoClickVastUrl } from '@/config/ads/exoclick';

// Fluid Player SDK CDN
const FLUID_PLAYER_JS = 'https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js';
const FLUID_PLAYER_CSS = 'https://cdn.fluidplayer.com/v3/current/fluidplayer.min.css';

// Fluid Player 类型声明
declare global {
  interface Window {
    fluidPlayer?: (element: HTMLVideoElement, options: FluidPlayerOptions) => FluidPlayerInstance;
  }
}

interface FluidPlayerOptions {
  layoutControls?: {
    fillToContainer?: boolean;
    primaryColor?: string;
    posterImage?: string;
    allowTheatre?: boolean;
    playbackRateEnabled?: boolean;
    autoPlay?: boolean;
    controlBar?: { autoHide?: boolean; autoHideTimeout?: number };
  };
  vastOptions?: {
    adList?: Array<{
      roll: string;
      vastTag: string;
    }>;
    vastVideoEndedCallback?: () => void;
    vastVideoSkippedCallback?: () => void;
    noVastVideoCallback?: () => void;
  };
}

interface FluidPlayerInstance {
  destroy: () => void;
}

/**
 * 加载 Fluid Player SDK（CSS + JS）
 */
function loadFluidPlayerSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Not in browser'));
      return;
    }

    // 已加载则直接返回
    if (window.fluidPlayer) {
      resolve();
      return;
    }

    // 加载 CSS
    if (!document.getElementById('fluid-player-css')) {
      const link = document.createElement('link');
      link.id = 'fluid-player-css';
      link.rel = 'stylesheet';
      link.href = FLUID_PLAYER_CSS;
      document.head.appendChild(link);
    }

    // 加载 JS
    const existingScript = document.getElementById('fluid-player-js');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Fluid Player SDK load failed')));
      return;
    }

    const script = document.createElement('script');
    script.id = 'fluid-player-js';
    script.src = FLUID_PLAYER_JS;
    script.onload = () => {
      console.log('[ExoClick] Fluid Player SDK loaded');
      resolve();
    };
    script.onerror = () => {
      reject(new Error('Fluid Player SDK load failed'));
    };
    document.head.appendChild(script);
  });
}

/**
 * 创建一个极短的空白视频 Blob URL（约 1 秒黑屏）
 * 用作 Fluid Player 的主视频，广告作为 preRoll 播放在它之前
 */
function createBlankVideoUrl(): string {
  // 最小的有效 MP4（1帧黑屏，约 几百字节）
  const base64 =
    'AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAAhtZGF0AAAA' +
    'MW1vb3YAAABsbXZoZAAAAAAAAAAAAAAAAAAAAAEAAAABAQAAAQAAAAAAAAAAAAAAAAEAAAAA' +
    'AAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIA' +
    'AAACdHJhawAAAFx0a2hkAAAAAwAAAAAAAAAAAAAAAQAAAAAAAAEAAAAAAAAAAAAAAAAAAAAA' +
    'AAEAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAJGVkdHMAAAAcZWxzdAAAAAAAAAABAAAA' +
    'AQAAAAABAAAAAAR0bWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAAoAAAAKFXEAAAAAAAtaGRs' +
    'cgAAAAAAAAAAdmlkZQAAAAAAAAAAAAAAAFZpZGVvSGFuZGxlcgAAALRtaW5mAAAAFHZtaGQA' +
    'AAABAAAAAAAAAAAAAAAkZGluZgAAABxkcmVmAAAAAAAAAAEAAAAMdXJsIAAAAAEAAAB0c3Ri' +
    'bAAAAFBzdHNkAAAAAAAAAAEAAABAYXZjMQAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAA0AFC' +
    'AEgAAABIAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY//8AAAAc' +
    'c3R0cwAAAAAAAAABAAAAASgAAAAAAAhzdHN6AAAAAAAAABcAAAABAAAAFHN0Y28AAAAAAAAA' +
    'AQAAADAAAABidWR0YQAAAFptZXRhAAAAAAAAACFoZGxyAAAAAAAAAABtZGlyYXBwbAAAAAAA' +
    'AAAAAAAAAAAAAAAAAGlsc3QAAAAlaXRvbwAAAB1kYXRhAAAAAQAAAABMYXZmNjAuMTYuMTAw';

  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'video/mp4' });
    return URL.createObjectURL(blob);
  } catch {
    // Fallback: 使用 Fluid Player demo 视频
    return 'https://cdn.fluidplayer.com/static/demo.mp4';
  }
}

/**
 * ExoClick VAST 激励广告 Hook
 */
export function useExoClickAd() {
  const isShowingRef = useRef(false);
  const sdkLoadedRef = useRef(false);

  /**
   * 预加载 Fluid Player SDK
   */
  const preloadSDK = useCallback(async () => {
    if (sdkLoadedRef.current) return;
    try {
      await loadFluidPlayerSDK();
      sdkLoadedRef.current = true;
    } catch (err) {
      console.error('[ExoClick] SDK preload failed:', err);
    }
  }, []);

  /**
   * 显示 VAST 激励广告
   */
  const showAd = useCallback(async (): Promise<RewardedAdResult> => {
    if (isShowingRef.current) {
      return { success: false, reason: 'error', message: 'Ad is already showing' };
    }

    isShowingRef.current = true;

    try {
      // 确保 SDK 已加载
      await loadFluidPlayerSDK();
      sdkLoadedRef.current = true;

      if (!window.fluidPlayer) {
        isShowingRef.current = false;
        return { success: false, reason: 'error', message: 'Fluid Player not available' };
      }

      // 创建占位视频 URL
      const placeholderUrl = createBlankVideoUrl();

      return await new Promise<RewardedAdResult>((resolve) => {
        let settled = false;
        let playerInstance: FluidPlayerInstance | null = null;

        const cleanup = () => {
          isShowingRef.current = false;
          // 恢复页面滚动
          document.body.style.overflow = '';
          // 销毁播放器
          if (playerInstance) {
            try {
              playerInstance.destroy();
            } catch {
              // ignore
            }
            playerInstance = null;
          }
          // 强制移除 overlay 及其所有子元素
          const overlayEl = document.getElementById('exoclick-overlay');
          if (overlayEl) {
            overlayEl.remove();
          }
          // 释放 blob URL
          if (placeholderUrl.startsWith('blob:')) {
            URL.revokeObjectURL(placeholderUrl);
          }
        };

        const settleResult = (result: RewardedAdResult) => {
          if (settled) return;
          settled = true;
          console.log('[ExoClick] Settling with result:', result.reason);
          cleanup();
          resolve(result);
        };

        // === 创建 DOM ===

        // 全屏遮罩层
        const overlay = document.createElement('div');
        overlay.id = 'exoclick-overlay';
        overlay.style.cssText = [
          'position:fixed',
          'top:0',
          'left:0',
          'width:100vw',
          'height:100vh',
          'background:rgba(0,0,0,0.95)',
          'z-index:999999',
          'display:flex',
          'align-items:center',
          'justify-content:center',
          'flex-direction:column',
          'padding:16px',
          'box-sizing:border-box',
        ].join(';');

        // 关闭按钮（右上角）
        const closeBtn = document.createElement('button');
        closeBtn.innerText = '\u2715'; // ✕
        closeBtn.style.cssText = [
          'position:absolute',
          'top:12px',
          'right:16px',
          'width:36px',
          'height:36px',
          'border-radius:50%',
          'border:none',
          'background:rgba(255,255,255,0.2)',
          'color:#fff',
          'font-size:18px',
          'cursor:pointer',
          'z-index:1000000',
          'display:flex',
          'align-items:center',
          'justify-content:center',
        ].join(';');
        closeBtn.onclick = () => {
          console.log('[ExoClick] User closed overlay manually');
          settleResult({ success: false, reason: 'skipped' });
        };

        // 视频容器
        const container = document.createElement('div');
        const isMobile = window.innerWidth < 768;
        const containerWidth = isMobile ? window.innerWidth - 32 : Math.min(640, window.innerWidth - 64);
        const containerHeight = Math.round(containerWidth * 9 / 16);
        container.style.cssText = `width:${containerWidth}px;height:${containerHeight}px;position:relative;background:#000;border-radius:8px;overflow:hidden;`;

        // video 元素（不设 autoplay，让 Fluid Player 控制播放）
        const video = document.createElement('video');
        video.id = 'exoclick-video-' + Date.now();
        video.style.cssText = 'width:100%;height:100%;';
        video.setAttribute('playsinline', '');
        video.src = placeholderUrl;

        container.appendChild(video);
        overlay.appendChild(closeBtn);
        overlay.appendChild(container);
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';

        // 超时保护（90 秒）
        const timeout = setTimeout(() => {
          console.warn('[ExoClick] Ad timed out');
          settleResult({ success: false, reason: 'error', message: 'Ad timed out' });
        }, 90000);

        const clearTimeoutAndSettle = (result: RewardedAdResult) => {
          clearTimeout(timeout);
          settleResult(result);
        };

        try {
          playerInstance = window.fluidPlayer!(video, {
            layoutControls: {
              fillToContainer: true,
              primaryColor: '#9333ea',
              allowTheatre: false,
              playbackRateEnabled: false,
              autoPlay: true,
              controlBar: {
                autoHide: true,
                autoHideTimeout: 1,
              },
            },
            vastOptions: {
              adList: [
                {
                  roll: 'preRoll',
                  vastTag: getExoClickVastUrl(),
                },
              ],
              vastVideoEndedCallback: () => {
                console.log('[ExoClick] VAST callback: ad completed');
                clearTimeoutAndSettle({ success: true, reason: 'rewarded' });
              },
              vastVideoSkippedCallback: () => {
                console.log('[ExoClick] VAST callback: ad skipped');
                clearTimeoutAndSettle({ success: false, reason: 'skipped' });
              },
              noVastVideoCallback: () => {
                console.log('[ExoClick] VAST callback: no ad available');
                clearTimeoutAndSettle({ success: false, reason: 'unavailable', message: 'No ads available at this time' });
              },
            },
          });

        } catch (err) {
          clearTimeout(timeout);
          cleanup();
          isShowingRef.current = false;
          console.error('[ExoClick] Player init error:', err);
          resolve({ success: false, reason: 'error', message: 'Player initialization failed' });
        }
      });
    } catch (err) {
      isShowingRef.current = false;
      console.error('[ExoClick] Show ad error:', err);
      return { success: false, reason: 'error', message: 'Failed to show ad' };
    }
  }, []);

  return {
    showAd,
    preloadSDK,
    isShowing: isShowingRef.current,
  };
}
