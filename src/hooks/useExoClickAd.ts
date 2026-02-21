'use client';

/**
 * ExoClick VAST 激励广告 Hook
 *
 * 使用 Fluid Player 加载 ExoClick VAST In-Stream 广告。
 * 广告作为 preRoll 播放，主视频使用一个极短的占位视频。
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

// 占位视频：1 秒静音黑屏（data URI）
const PLACEHOLDER_VIDEO =
  'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAA' +
  'ZBtZGF0AAACoAYF//+c3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE2NCByMzEwOCA' +
  'zMWUxOWY5IC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAy' +
  'MyAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhY' +
  'mFjPTAgcmVmPTEgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4MToweDExMSBtZT1oZXggc3' +
  'VibWU9NyBwc3k9MSBwc3lfcmQ9MS4wMDowLjAwIG1peGVkX3JlZj0xIG1lX3JhbmdlPTE' +
  '2IGNocm9tYV9tZT0xIHRyZWxsaXM9MSA4eDhkY3Q9MSBjcW09MCBkZWFkem9uZT0yMSwx' +
  'MSBmYXN0X3Bza2lwPTEgY2hyb21hX3FwX29mZnNldD0tMiB0aHJlYWRzPTEgbG9va2Foa' +
  'WVhZF90aHJlYWRzPTEgc2xpY2VkX3RocmVhZHM9MCBucj0wIGRlY2ltYXRlPTEgaW50ZX' +
  'JsYWNlZD0wIGJsdXJheV9jb21wYXQ9MCBjb25zdHJhaW5lZF9pbnRyYT0wIGJmcmFtZXM' +
  '9MCB3ZWlnaHRwPTAga2V5aW50PTI1MCBrZXlpbnRfbWluPTI1IHNjZW5lY3V0PTQwIGlu' +
  'dHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yM' +
  'y4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCBpcF9yYXRpbz0xLj' +
  'QwIGFxPTE6MS4wMCAAgAAAAA9liIQAV/0TAAYdeBTXzgAAAAhBmiRsQ/8EAAAACANBAAAAAA' +
  'ABkYYiEAFf9EAAH0MAAAIxbW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAAACoAAQAAAQAAAAA' +
  'AAAAAAAABAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAACAAAAGXRyYWsAAABcdGtoZAAAAAPAAAAAAAAAAAAAAAAAAAAAACoAAAAAAAAAAAAAAAA' +
  'AAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAgAAAAIAAAAAAJGVkdHMAAAAcZW' +
  'xzdAAAAAAAAAABAAAAKgAAAAAAAQAAAAABEW1kaWEAAAAgbWRoZAAAAAAAAAAAAAAAAAAAACoAAAAA' +
  'VcQAAAAAAC1oZGxyAAAAAAAAAAB2aWRlAAAAAAAAAAAAAAAAVmlkZW9IYW5kbGVyAAAAAbxtaW5m' +
  'AAAAFHZtaGQAAAABAAAAAAAAAAAAAAAkZGluZgAAABxkcmVmAAAAAAAAAAEAAAAMdXJsIAAAAAEA' +
  'AAF8c3RibAAAAJhzdHNkAAAAAAAAAAEAAACIYXZjMQAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAACA' +
  'AIAASAAAAEgAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY//wAAADJhdm' +
  'NDAdkAAB/hABhnOAAKvBCoAAADAAgAAAMA8DxYtlgBAAZo6+eSywAAAAhzdHRzAAAAAAAAAAEA' +
  'AAABAAAKAAAAFHNcc3MAAAAAAAAAAQAAAAEAAAAcc3R0cwAAAAAAAAABAAAAAQAAAAEAAAAUc3Rz' +
  'egAAAAAAAAAXAAAAAQAAABRzdGNvAAAAAAAAAAEAAAAwAAAAYnVkdGEAAABabWV0YQAAAAAAAAAh' +
  'aGRscgAAAAAAAAAAbWRpcmFwcGwAAAAAAAAAAAAAAAAtaWxzdAAAACWpdG9vAAAAHWRhdGEAAAAB' +
  'AAAAAExhdmY2MC4xNi4xMDA=';

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
      // 脚本正在加载中，等待完成
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

      return await new Promise<RewardedAdResult>((resolve) => {
        let settled = false;
        let playerInstance: FluidPlayerInstance | null = null;

        const cleanup = () => {
          isShowingRef.current = false;
          // 移除遮罩层和 video
          const overlay = document.getElementById('exoclick-overlay');
          if (overlay) {
            overlay.remove();
          }
          // 销毁播放器
          if (playerInstance) {
            try {
              playerInstance.destroy();
            } catch {
              // ignore destroy errors
            }
            playerInstance = null;
          }
        };

        const settleResult = (result: RewardedAdResult) => {
          if (settled) return;
          settled = true;
          cleanup();
          resolve(result);
        };

        // 创建全屏遮罩层
        const overlay = document.createElement('div');
        overlay.id = 'exoclick-overlay';
        overlay.style.cssText =
          'position:fixed;top:0;left:0;width:100%;height:100%;' +
          'background:rgba(0,0,0,0.9);z-index:999999;' +
          'display:flex;align-items:center;justify-content:center;';

        // 创建视频容器
        const container = document.createElement('div');
        container.style.cssText = 'width:100%;max-width:640px;aspect-ratio:16/9;position:relative;';

        // 创建 video 元素
        const video = document.createElement('video');
        video.id = 'exoclick-video-' + Date.now();
        video.style.cssText = 'width:100%;height:100%;';
        video.setAttribute('playsinline', '');

        // 使用占位视频作为主内容
        video.src = PLACEHOLDER_VIDEO;

        container.appendChild(video);
        overlay.appendChild(container);
        document.body.appendChild(overlay);

        // 超时保护（60 秒）
        const timeout = setTimeout(() => {
          console.warn('[ExoClick] Ad timed out');
          settleResult({ success: false, reason: 'error', message: 'Ad timed out' });
        }, 60000);

        const clearTimeoutAndSettle = (result: RewardedAdResult) => {
          clearTimeout(timeout);
          settleResult(result);
        };

        try {
          // 初始化 Fluid Player，配置 VAST preRoll
          playerInstance = window.fluidPlayer!(video, {
            layoutControls: {
              fillToContainer: true,
              primaryColor: '#9333ea',
              allowTheatre: false,
              playbackRateEnabled: false,
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
                console.log('[ExoClick] Ad completed - user earned reward');
                clearTimeoutAndSettle({ success: true, reason: 'rewarded' });
              },
              vastVideoSkippedCallback: () => {
                console.log('[ExoClick] Ad skipped by user');
                clearTimeoutAndSettle({ success: false, reason: 'skipped' });
              },
              noVastVideoCallback: () => {
                console.log('[ExoClick] No ad available');
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
