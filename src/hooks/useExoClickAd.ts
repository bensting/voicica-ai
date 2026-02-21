'use client';

/**
 * ExoClick VAST 激励广告 Hook
 *
 * 使用 Fluid Player 加载 ExoClick VAST In-Stream 广告。
 * 广告作为 preRoll 播放，主视频使用占位视频。
 *
 * 广告播放流程（通过日志验证）：
 * 1. Fluid Player 加载自己的 blank.mp4（0.04s）并立即结束
 * 2. VAST 广告视频（如 aucdn.net）加载并播放
 * 3. 广告播放结束 → video 'ended' 事件触发
 * 4. Fluid Player 尝试切回主内容，但 src 变成 null → error
 *
 * 注意：Fluid Player v3 的 vastVideoEndedCallback 实测不触发，
 * 所以通过 video 原生 ended 事件 + currentTime 判断广告是否看完。
 */

import { useRef, useCallback } from 'react';
import type { RewardedAdResult } from './useRewardedAd';
import { getExoClickVastUrl } from '@/config/ads/exoclick';

// Fluid Player SDK CDN
const FLUID_PLAYER_JS = 'https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js';
const FLUID_PLAYER_CSS = 'https://cdn.fluidplayer.com/v3/current/fluidplayer.min.css';

// 占位视频：Fluid Player 官方 demo
const PLACEHOLDER_VIDEO = 'https://cdn.fluidplayer.com/static/demo.mp4';

// 判定"广告看完"的最小播放时长（秒）
const MIN_AD_WATCH_SECONDS = 5;

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
 * 判断是否为广告视频 URL（非占位、非 blank）
 */
function isAdVideoSrc(src: string): boolean {
  if (!src) return false;
  if (src.includes('demo.mp4')) return false;
  if (src.includes('blank.mp4')) return false;
  if (src.endsWith('/null') || src === 'null') return false;
  return true;
}

/**
 * ExoClick VAST 激励广告 Hook
 */
export function useExoClickAd() {
  const isShowingRef = useRef(false);
  const sdkLoadedRef = useRef(false);

  const preloadSDK = useCallback(async () => {
    if (sdkLoadedRef.current) return;
    try {
      await loadFluidPlayerSDK();
      sdkLoadedRef.current = true;
    } catch (err) {
      console.error('[ExoClick] SDK preload failed:', err);
    }
  }, []);

  const showAd = useCallback(async (): Promise<RewardedAdResult> => {
    if (isShowingRef.current) {
      return { success: false, reason: 'error', message: 'Ad is already showing' };
    }

    isShowingRef.current = true;

    try {
      await loadFluidPlayerSDK();
      sdkLoadedRef.current = true;

      if (!window.fluidPlayer) {
        isShowingRef.current = false;
        return { success: false, reason: 'error', message: 'Fluid Player not available' };
      }

      return await new Promise<RewardedAdResult>((resolve) => {
        let settled = false;
        let playerInstance: FluidPlayerInstance | null = null;

        // 广告播放追踪
        let adDetected = false;    // 是否检测到广告视频 URL
        let adMaxTime = 0;         // 广告视频播放的最大 currentTime

        const cleanup = () => {
          isShowingRef.current = false;
          document.body.style.overflow = '';
          if (playerInstance) {
            try { playerInstance.destroy(); } catch { /* ignore */ }
            playerInstance = null;
          }
          const overlayEl = document.getElementById('exoclick-overlay');
          if (overlayEl) overlayEl.remove();
        };

        const settleResult = (result: RewardedAdResult) => {
          if (settled) return;
          settled = true;
          console.log('[ExoClick] Settle:', result.reason, `(adDetected=${adDetected}, adMaxTime=${adMaxTime.toFixed(1)}s)`);
          cleanup();
          resolve(result);
        };

        // === DOM 创建 ===

        const overlay = document.createElement('div');
        overlay.id = 'exoclick-overlay';
        overlay.style.cssText = [
          'position:fixed', 'top:0', 'left:0', 'width:100vw', 'height:100vh',
          'background:rgba(0,0,0,0.95)', 'z-index:999999',
          'display:flex', 'align-items:center', 'justify-content:center',
          'flex-direction:column', 'padding:16px', 'box-sizing:border-box',
        ].join(';');

        // 关闭按钮
        const closeBtn = document.createElement('button');
        closeBtn.innerText = '\u2715';
        closeBtn.style.cssText = [
          'position:absolute', 'top:12px', 'right:16px',
          'width:36px', 'height:36px', 'border-radius:50%', 'border:none',
          'background:rgba(255,255,255,0.2)', 'color:#fff', 'font-size:18px',
          'cursor:pointer', 'z-index:1000000',
          'display:flex', 'align-items:center', 'justify-content:center',
        ].join(';');
        closeBtn.onclick = () => {
          console.log('[ExoClick] User closed overlay, adMaxTime:', adMaxTime.toFixed(1));
          if (adDetected && adMaxTime >= MIN_AD_WATCH_SECONDS) {
            // 广告已经播放了足够长，视为看完
            settleResult({ success: true, reason: 'rewarded' });
          } else {
            settleResult({ success: false, reason: 'skipped' });
          }
        };

        // 视频容器
        const container = document.createElement('div');
        const isMobile = window.innerWidth < 768;
        const containerWidth = isMobile ? window.innerWidth - 32 : Math.min(640, window.innerWidth - 64);
        const containerHeight = Math.round(containerWidth * 9 / 16);
        container.style.cssText = `width:${containerWidth}px;height:${containerHeight}px;position:relative;background:#000;border-radius:8px;overflow:hidden;`;

        // video 元素
        const video = document.createElement('video');
        video.id = 'exoclick-video-' + Date.now();
        video.style.cssText = 'width:100%;height:100%;';
        video.setAttribute('playsinline', '');
        video.src = PLACEHOLDER_VIDEO;

        // === 视频事件监听（核心检测逻辑）===

        // 检测广告视频 URL
        video.addEventListener('loadstart', () => {
          const src = video.currentSrc || '';
          if (isAdVideoSrc(src)) {
            adDetected = true;
            console.log('[ExoClick] Ad video detected:', src.substring(0, 60));
          }
        });

        // 追踪广告播放进度
        video.addEventListener('timeupdate', () => {
          if (adDetected && isAdVideoSrc(video.currentSrc || '')) {
            adMaxTime = Math.max(adMaxTime, video.currentTime);
          }
        });

        // 广告视频播放结束 → 自动判定
        video.addEventListener('ended', () => {
          const src = video.currentSrc || '';
          console.log('[ExoClick] Video ended: currentTime=', video.currentTime.toFixed(1), 'src=', src.substring(0, 60));

          if (adDetected && isAdVideoSrc(src) && video.currentTime >= MIN_AD_WATCH_SECONDS) {
            console.log('[ExoClick] Ad video completed naturally');
            settleResult({ success: true, reason: 'rewarded' });
          }
        });

        // 广告结束后 Fluid Player 把 src 设为 null → error
        // 如果广告已经播放够了，视为完成
        video.addEventListener('error', () => {
          console.log('[ExoClick] Video error, adDetected=', adDetected, 'adMaxTime=', adMaxTime.toFixed(1));
          if (adDetected && adMaxTime >= MIN_AD_WATCH_SECONDS) {
            settleResult({ success: true, reason: 'rewarded' });
          }
        });

        container.appendChild(video);
        overlay.appendChild(closeBtn);
        overlay.appendChild(container);
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';

        // 超时保护（90 秒）
        const timeout = setTimeout(() => {
          console.warn('[ExoClick] Timeout, adMaxTime:', adMaxTime.toFixed(1));
          if (adDetected && adMaxTime >= MIN_AD_WATCH_SECONDS) {
            settleResult({ success: true, reason: 'rewarded' });
          } else {
            settleResult({ success: false, reason: 'error', message: 'Ad timed out' });
          }
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
              controlBar: { autoHide: true, autoHideTimeout: 1 },
            },
            vastOptions: {
              adList: [
                { roll: 'preRoll', vastTag: getExoClickVastUrl() },
              ],
              // 保留 VAST 回调（虽然 v3 实测不触发，但作为保险）
              vastVideoEndedCallback: () => {
                console.log('[ExoClick] VAST callback: ad completed');
                clearTimeoutAndSettle({ success: true, reason: 'rewarded' });
              },
              vastVideoSkippedCallback: () => {
                console.log('[ExoClick] VAST callback: ad skipped');
                clearTimeoutAndSettle({ success: false, reason: 'skipped' });
              },
              noVastVideoCallback: () => {
                console.log('[ExoClick] VAST callback: no ad');
                clearTimeoutAndSettle({ success: false, reason: 'unavailable', message: 'No ads available' });
              },
            },
          });

          console.log('[ExoClick] Fluid Player initialized');
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

  return { showAd, preloadSDK, isShowing: isShowingRef.current };
}
