'use client';

/**
 * Google Play 应用内更新 Hook
 *
 * 使用 Flexible 模式：后台下载，完成后提示安装
 * 仅适用于从 Google Play 安装的应用
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { getAppUpdateConfig } from '@/config/appConfig';

/**
 * 更新状态
 */
export type GooglePlayUpdateStatus =
  | 'idle'           // 空闲
  | 'checking'       // 检查中
  | 'available'      // 有更新可用
  | 'downloading'    // 下载中
  | 'downloaded'     // 下载完成，等待安装
  | 'installing'     // 安装中
  | 'up_to_date'     // 已是最新
  | 'error';         // 错误

interface UseGooglePlayUpdateReturn {
  /** 当前状态 */
  status: GooglePlayUpdateStatus;
  /** 下载进度 (0-100) */
  progress: number;
  /** 错误信息 */
  error: string | null;
  /** 是否在 Android 原生环境 */
  isAndroid: boolean;
  /** 是否有更新可用 */
  hasUpdate: boolean;
  /** 是否下载完成待安装 */
  isReadyToInstall: boolean;
  /** 检查更新 */
  checkForUpdate: () => Promise<void>;
  /** 开始更新（Flexible 模式后台下载） */
  startUpdate: () => Promise<void>;
  /** 完成安装（下载完成后调用，会重启应用） */
  completeUpdate: () => Promise<void>;
}

// 上次检查时间存储 key
const LAST_CHECK_KEY = 'google_play_update_last_check';

/**
 * 获取上次检查时间
 */
function getLastCheckTime(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(LAST_CHECK_KEY) || '0', 10);
}

/**
 * 记录检查时间
 */
function setLastCheckTime(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LAST_CHECK_KEY, String(Date.now()));
}

/**
 * Google Play 应用内更新 Hook
 *
 * 使用方式：
 * ```tsx
 * const { status, hasUpdate, startUpdate, completeUpdate, isReadyToInstall } = useGooglePlayUpdate();
 *
 * // 显示更新按钮
 * {hasUpdate && status === 'available' && (
 *   <button onClick={startUpdate}>更新</button>
 * )}
 *
 * // 下载完成后提示安装
 * {isReadyToInstall && (
 *   <button onClick={completeUpdate}>立即安装</button>
 * )}
 * ```
 */
export function useGooglePlayUpdate(): UseGooglePlayUpdateReturn {
  const [status, setStatus] = useState<GooglePlayUpdateStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [AppUpdate, setAppUpdate] = useState<typeof import('@capawesome/capacitor-app-update').AppUpdate | null>(null);

  const listenerCleanupRef = useRef<(() => void) | null>(null);

  const isNative = Capacitor.isNativePlatform();
  const isAndroid = Capacitor.getPlatform() === 'android';
  const config = getAppUpdateConfig();

  // 动态导入 AppUpdate 模块（仅在 Android 原生环境）
  useEffect(() => {
    if (!isNative || !isAndroid) return;

    import('@capawesome/capacitor-app-update')
      .then((module) => {
        setAppUpdate(module.AppUpdate);
        console.log('[GooglePlayUpdate] 模块加载成功');
      })
      .catch((err) => {
        console.error('[GooglePlayUpdate] 模块加载失败:', err);
        // 不设置错误，可能是独立版本没有安装此插件
      });
  }, [isNative, isAndroid]);

  // 检查是否需要检查更新（基于间隔时间）
  const shouldCheck = useCallback(() => {
    const lastCheck = getLastCheckTime();
    const intervalMs = config.check_interval_minutes * 60 * 1000;
    return Date.now() - lastCheck >= intervalMs;
  }, [config.check_interval_minutes]);

  // 检查更新
  const checkForUpdate = useCallback(async () => {
    if (!AppUpdate || !config.enabled) {
      console.log('[GooglePlayUpdate] 跳过检查：模块未加载或功能未启用');
      return;
    }

    try {
      setStatus('checking');
      setError(null);

      const { AppUpdateAvailability } = await import('@capawesome/capacitor-app-update');
      const result = await AppUpdate.getAppUpdateInfo();

      console.log('[GooglePlayUpdate] 检查结果:', result);

      if (result.updateAvailability === AppUpdateAvailability.UPDATE_AVAILABLE) {
        setStatus('available');
        console.log('[GooglePlayUpdate] 发现新版本');
      } else {
        setStatus('up_to_date');
        console.log('[GooglePlayUpdate] 已是最新版本');
      }

      setLastCheckTime();
    } catch (err) {
      console.error('[GooglePlayUpdate] 检查更新失败:', err);
      setError('检查更新失败');
      setStatus('error');
    }
  }, [AppUpdate, config.enabled]);

  // 开始更新（Flexible 模式）
  const startUpdate = useCallback(async () => {
    if (!AppUpdate) {
      console.warn('[GooglePlayUpdate] AppUpdate 模块未加载');
      return;
    }

    try {
      setStatus('downloading');
      setProgress(0);
      setError(null);

      const { FlexibleUpdateInstallStatus } = await import('@capawesome/capacitor-app-update');

      // 清理之前的监听器
      if (listenerCleanupRef.current) {
        listenerCleanupRef.current();
      }

      // 监听下载进度
      const progressListener = await AppUpdate.addListener(
        'onFlexibleUpdateStateChange',
        (state: { installStatus: number; bytesDownloaded?: number; totalBytesToDownload?: number }) => {
          console.log('[GooglePlayUpdate] 下载状态:', state);

          // 计算进度
          if (state.bytesDownloaded && state.totalBytesToDownload) {
            const pct = Math.round((state.bytesDownloaded / state.totalBytesToDownload) * 100);
            setProgress(pct);
          }

          // 检查下载完成
          if (state.installStatus === FlexibleUpdateInstallStatus.DOWNLOADED) {
            setStatus('downloaded');
            setProgress(100);
            console.log('[GooglePlayUpdate] 下载完成，等待用户确认安装');
          }
        }
      );

      listenerCleanupRef.current = () => {
        progressListener.remove();
      };

      // 开始 Flexible 更新
      await AppUpdate.startFlexibleUpdate();
      console.log('[GooglePlayUpdate] 开始后台下载');
    } catch (err) {
      console.error('[GooglePlayUpdate] 开始更新失败:', err);
      setError('开始更新失败');
      setStatus('error');
    }
  }, [AppUpdate]);

  // 完成安装（会重启应用）
  const completeUpdate = useCallback(async () => {
    if (!AppUpdate) {
      console.warn('[GooglePlayUpdate] AppUpdate 模块未加载');
      return;
    }

    try {
      setStatus('installing');
      console.log('[GooglePlayUpdate] 正在安装更新...');
      await AppUpdate.completeFlexibleUpdate();
      // 应用会重启，这里不会执行到
    } catch (err) {
      console.error('[GooglePlayUpdate] 安装失败:', err);
      setError('安装失败');
      setStatus('error');
    }
  }, [AppUpdate]);

  // 自动检查更新
  useEffect(() => {
    if (!AppUpdate || !config.enabled) return;

    if (!shouldCheck()) {
      console.log('[GooglePlayUpdate] 未到检查间隔，跳过');
      return;
    }

    // 延迟 3 秒检查，避免影响启动
    const timer = setTimeout(() => {
      checkForUpdate();
    }, 3000);

    return () => clearTimeout(timer);
  }, [AppUpdate, config.enabled, shouldCheck, checkForUpdate]);

  // 清理监听器
  useEffect(() => {
    return () => {
      if (listenerCleanupRef.current) {
        listenerCleanupRef.current();
      }
    };
  }, []);

  return {
    status,
    progress,
    error,
    isAndroid,
    hasUpdate: status === 'available' || status === 'downloading' || status === 'downloaded',
    isReadyToInstall: status === 'downloaded',
    checkForUpdate,
    startUpdate,
    completeUpdate,
  };
}