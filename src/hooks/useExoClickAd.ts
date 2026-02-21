'use client';

/**
 * ExoClick VAST 激励广告 Hook
 *
 * 使用 Fluid Player 加载 ExoClick VAST In-Stream 广告（多 zone ad pod）。
 * 多个广告作为 preRoll 背靠背播放，全部播完才判定成功。
 *
 * 广告播放流程（通过日志验证）：
 * 1. Fluid Player 加载自己的 blank.mp4（0.04s）并立即结束
 * 2. 第 1 个 VAST 广告视频加载并播放 → ended
 * 3. 第 2 个 VAST 广告视频加载并播放 → ended
 * 4. Fluid Player 切回主内容，src 变 null → error
 *
 * 注意：Fluid Player v3 的 vastVideoEndedCallback 实测不触发，
 * 通过 video 原生 ended 事件 + currentTime + 计数判断所有广告是否看完。
 */

import { useRef, useCallback } from 'react';
import type { RewardedAdResult } from './useRewardedAd';
import { getExoClickVastUrls } from '@/config/ads/exoclick';

// Fluid Player SDK CDN
const FLUID_PLAYER_JS = 'https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js';
const FLUID_PLAYER_CSS = 'https://cdn.fluidplayer.com/v3/current/fluidplayer.min.css';

// 占位视频
const PLACEHOLDER_VIDEO = 'https://cdn.fluidplayer.com/static/demo.mp4';

// 判定单个广告"看完"的最小播放时长（秒）
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

    if (!document.getElementById('fluid-player-css')) {
      const link = document.createElement('link');
      link.id = 'fluid-player-css';
      link.rel = 'stylesheet';
      link.href = FLUID_PLAYER_CSS;
      document.head.appendChild(link);
    }

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

      const vastUrls = getExoClickVastUrls();
      const totalAdsExpected = vastUrls.length;

      return await new Promise<RewardedAdResult>((resolve) => {
        let settled = false;
        let playerInstance: FluidPlayerInstance | null = null;

        // 广告播放追踪
        let adsCompleted = 0;         // 已完整播放的广告数
        let adTotalWatchTime = 0;     // 所有广告的累计播放时长
        let currentAdSrc = '';        // 当前正在播放的广告 src
        let currentAdStartTime = 0;   // 当前广告开始时的 currentTime

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
          console.log(`[ExoClick] Settle: ${result.reason} (ads=${adsCompleted}/${totalAdsExpected}, totalTime=${adTotalWatchTime.toFixed(1)}s)`);
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
          console.log(`[ExoClick] User closed overlay, ads=${adsCompleted}/${totalAdsExpected}`);
          // 所有广告都看完了才给奖励
          if (adsCompleted >= totalAdsExpected) {
            settleResult({ success: true, reason: 'rewarded' });
          } else {
            settleResult({ success: false, reason: 'skipped' });
          }
        };

        // === 顶部进度指示器 ===
        const progressBar = document.createElement('div');
        progressBar.style.cssText = [
          'position:absolute', 'top:0', 'left:0', 'width:100%', 'height:3px',
          'background:rgba(255,255,255,0.15)', 'z-index:1000000',
        ].join(';');

        const progressFill = document.createElement('div');
        progressFill.style.cssText = [
          'height:100%', 'width:0%',
          'background:linear-gradient(90deg,#9333ea,#c084fc)',
          'transition:width 0.3s ease',
          'border-radius:0 2px 2px 0',
        ].join(';');
        progressBar.appendChild(progressFill);

        // 广告计数标签 "Ad 1 of 2"
        const adLabel = document.createElement('div');
        adLabel.style.cssText = [
          'position:absolute', 'top:14px', 'left:16px',
          'color:rgba(255,255,255,0.7)', 'font-size:12px',
          'font-family:system-ui,sans-serif', 'z-index:1000000',
          'background:rgba(0,0,0,0.5)', 'padding:4px 10px',
          'border-radius:12px', 'backdrop-filter:blur(4px)',
        ].join(';');
        adLabel.textContent = `Ad 1 of ${totalAdsExpected}`;

        // 更新进度 UI 的函数
        const updateProgressUI = (completedCount: number) => {
          const currentAd = Math.min(completedCount + 1, totalAdsExpected);
          adLabel.textContent = `Ad ${currentAd} of ${totalAdsExpected}`;
          progressFill.style.width = `${(completedCount / totalAdsExpected) * 100}%`;
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

        // 检测新广告视频加载
        video.addEventListener('loadstart', () => {
          const src = video.currentSrc || '';
          if (isAdVideoSrc(src) && src !== currentAdSrc) {
            currentAdSrc = src;
            currentAdStartTime = 0;
            updateProgressUI(adsCompleted);
            console.log(`[ExoClick] Ad ${adsCompleted + 1}/${totalAdsExpected} loading:`, src.substring(0, 60));
          }
        });

        // 追踪播放进度
        video.addEventListener('timeupdate', () => {
          if (currentAdSrc && isAdVideoSrc(video.currentSrc || '')) {
            currentAdStartTime = Math.max(currentAdStartTime, video.currentTime);
          }
        });

        // 广告视频播放结束
        video.addEventListener('ended', () => {
          const src = video.currentSrc || '';
          const time = video.currentTime;
          console.log(`[ExoClick] Video ended: time=${time.toFixed(1)}s src=${src.substring(0, 60)}`);

          if (isAdVideoSrc(src) && time >= MIN_AD_WATCH_SECONDS) {
            adsCompleted++;
            adTotalWatchTime += time;
            updateProgressUI(adsCompleted);
            console.log(`[ExoClick] Ad completed: ${adsCompleted}/${totalAdsExpected} (totalTime=${adTotalWatchTime.toFixed(1)}s)`);

            // 所有广告都播完了 → 成功
            if (adsCompleted >= totalAdsExpected) {
              console.log('[ExoClick] All ads completed!');
              settleResult({ success: true, reason: 'rewarded' });
            }
            // 否则等下一个广告继续播
          }
        });

        // Fluid Player 播完所有广告后 src → null → error
        video.addEventListener('error', () => {
          console.log(`[ExoClick] Video error, ads=${adsCompleted}/${totalAdsExpected}`);
          if (adsCompleted >= totalAdsExpected) {
            settleResult({ success: true, reason: 'rewarded' });
          }
          // 如果至少看了 1 个完整广告但没看完全部，也算 error fallback
          // 不给奖励，让用户知道需要看完所有广告
        });

        container.appendChild(video);
        overlay.appendChild(progressBar);
        overlay.appendChild(adLabel);
        overlay.appendChild(closeBtn);
        overlay.appendChild(container);
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';

        console.log(`[ExoClick] Starting ad session: ${totalAdsExpected} ads to play`);

        // 超时保护（每个广告最多 60 秒 + 缓冲）
        const timeout = setTimeout(() => {
          console.warn(`[ExoClick] Timeout, ads=${adsCompleted}/${totalAdsExpected}`);
          if (adsCompleted >= totalAdsExpected) {
            settleResult({ success: true, reason: 'rewarded' });
          } else {
            settleResult({ success: false, reason: 'error', message: 'Ad timed out' });
          }
        }, totalAdsExpected * 60000 + 30000);

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
              adList: vastUrls.map((url) => ({
                roll: 'preRoll' as const,
                vastTag: url,
              })),
              vastVideoEndedCallback: () => {
                console.log('[ExoClick] VAST callback: ad completed');
                // 不在这里 settle，让 ended 事件计数处理
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
