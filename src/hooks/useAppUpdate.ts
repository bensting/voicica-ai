/**
 * App 更新检查 Hook
 *
 * 用于在原生 App (Capacitor WebView) 中检查版本更新
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { checkAppUpdate } from '@/actions/admin/app-releases';

export interface UpdateInfo {
  hasUpdate: boolean;
  isForceUpdate: boolean;
  latestVersion: string;
  latestVersionCode: number;
  currentVersion: string;
  currentVersionCode: number;
  downloadUrl: string;
  releaseNotes: string | null;
}

interface UseAppUpdateReturn {
  updateInfo: UpdateInfo | null;
  isChecking: boolean;
  error: string | null;
  checkForUpdate: () => Promise<void>;
  dismissUpdate: () => void;
  isNativeApp: boolean;
}

// 存储用户已忽略的版本（会话级别）
let dismissedVersionCode: number | null = null;

export function useAppUpdate(): UseAppUpdateReturn {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNativeApp, setIsNativeApp] = useState(false);

  // 检测是否在原生 App 中运行
  useEffect(() => {
    setIsNativeApp(Capacitor.isNativePlatform());
  }, []);

  // 检查更新
  const checkForUpdate = useCallback(async () => {
    // 仅在原生平台执行
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      // 获取当前 App 版本信息
      const appInfo = await App.getInfo();
      const currentVersionCode = parseInt(appInfo.build, 10);
      const currentVersion = appInfo.version;
      const platform = Capacitor.getPlatform(); // 'android' 或 'ios'

      console.log(`📱 当前版本: ${currentVersion} (${currentVersionCode}), 平台: ${platform}`);

      // 调用服务器检查更新
      const result = await checkAppUpdate(platform, currentVersionCode);

      if (!result) {
        console.log('✅ 无法获取更新信息或已是最新版本');
        setUpdateInfo(null);
        return;
      }

      // 如果用户已忽略此版本（非强制更新），不再提示
      if (
        result.hasUpdate &&
        !result.isForceUpdate &&
        dismissedVersionCode === result.latestVersionCode
      ) {
        console.log('🔕 用户已忽略此版本');
        setUpdateInfo(null);
        return;
      }

      if (result.hasUpdate) {
        console.log(`🆕 发现新版本: ${result.latestVersion} (${result.latestVersionCode})`);
        setUpdateInfo({
          ...result,
          currentVersion,
          currentVersionCode,
        });
      } else {
        console.log('✅ 已是最新版本');
        setUpdateInfo(null);
      }
    } catch (err) {
      console.error('检查更新失败:', err);
      setError(err instanceof Error ? err.message : '检查更新失败');
    } finally {
      setIsChecking(false);
    }
  }, []);

  // 忽略此次更新（仅对非强制更新有效）
  const dismissUpdate = useCallback(() => {
    if (updateInfo && !updateInfo.isForceUpdate) {
      dismissedVersionCode = updateInfo.latestVersionCode;
      setUpdateInfo(null);
    }
  }, [updateInfo]);

  // App 启动时自动检查更新
  useEffect(() => {
    if (isNativeApp) {
      // 延迟 2 秒检查，避免影响启动体验
      const timer = setTimeout(() => {
        checkForUpdate();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isNativeApp, checkForUpdate]);

  return {
    updateInfo,
    isChecking,
    error,
    checkForUpdate,
    dismissUpdate,
    isNativeApp,
  };
}