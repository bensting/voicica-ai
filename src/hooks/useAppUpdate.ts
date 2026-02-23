/**
 * App 更新检查 Hook
 *
 * 用于在原生 App (Capacitor WebView) 中检查版本更新
 * 支持应用内下载 APK 并自动触发安装
 */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { checkAppUpdate } from '@/actions/admin/app-releases';
import { detectPlatformDetail } from '@/lib/platform';

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

export type DownloadStatus = 'idle' | 'checking_permission' | 'downloading' | 'installing' | 'completed' | 'error';

interface UseAppUpdateReturn {
  updateInfo: UpdateInfo | null;
  isChecking: boolean;
  error: string | null;
  checkForUpdate: () => Promise<void>;
  dismissUpdate: () => void;
  isNativeApp: boolean;
  // 下载相关
  downloadStatus: DownloadStatus;
  downloadProgress: number;
  startDownload: () => Promise<void>;
  cancelDownload: () => void;
}

// 存储用户已忽略的版本（会话级别）
let dismissedVersionCode: number | null = null;

export function useAppUpdate(): UseAppUpdateReturn {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNativeApp, setIsNativeApp] = useState(false);

  // 下载状态
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>('idle');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const downloadAbortRef = useRef(false);

  // 检测是否在 standalone APK 中运行（Play Store 版走 Google Play 更新，不走自建更新）
  useEffect(() => {
    const isStandaloneApk = Capacitor.isNativePlatform() && detectPlatformDetail() === 'android-apk';
    setIsNativeApp(isStandaloneApk);
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

  // 开始下载 APK 并安装
  const startDownload = useCallback(async () => {
    if (!updateInfo || !Capacitor.isNativePlatform()) {
      return;
    }

    const platform = Capacitor.getPlatform();

    // iOS 不支持应用内安装 APK，打开 App Store
    if (platform === 'ios') {
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ url: updateInfo.downloadUrl });
      return;
    }

    // Android: 应用内下载并安装
    downloadAbortRef.current = false;
    setDownloadStatus('checking_permission');
    setDownloadProgress(0);
    setError(null);

    try {
      // 动态导入插件
      const { AppInstallPlugin } = await import('@m430/capacitor-app-install');
      const { FileTransfer } = await import('@capacitor/file-transfer');
      const { Filesystem, Directory } = await import('@capacitor/filesystem');

      // 检查安装未知来源应用的权限
      const { granted } = await AppInstallPlugin.canInstallUnknownApps();
      if (!granted) {
        console.log('📱 需要授权安装未知来源应用');
        await AppInstallPlugin.openInstallUnknownAppsSettings();
        // 用户需要在设置中授权后重试
        setDownloadStatus('idle');
        setError('请授权安装未知来源应用后重试');
        return;
      }

      // 开始下载
      setDownloadStatus('downloading');
      console.log('⬇️ 开始下载 APK:', updateInfo.downloadUrl);

      // 生成下载文件名
      const fileName = `voicica_v${updateInfo.latestVersion}_${updateInfo.latestVersionCode}.apk`;

      // 获取下载目标路径
      const fileInfo = await Filesystem.getUri({
        directory: Directory.Cache,
        path: fileName,
      });

      // 监听下载进度
      const progressListener = await FileTransfer.addListener('progress', (progress) => {
        if (downloadAbortRef.current) return;

        const percent = progress.contentLength > 0
          ? Math.round((progress.bytes / progress.contentLength) * 100)
          : 0;

        setDownloadProgress(percent);
        console.log(`📥 下载进度: ${percent}% (${progress.bytes}/${progress.contentLength})`);
      });

      try {
        // 执行下载
        await FileTransfer.downloadFile({
          url: updateInfo.downloadUrl,
          path: fileInfo.uri,
          progress: true,
        });

        if (downloadAbortRef.current) {
          console.log('❌ 下载已取消');
          return;
        }

        console.log('✅ APK 下载完成:', fileInfo.uri);
        setDownloadProgress(100);
        setDownloadStatus('installing');

        // 触发安装
        const installResult = await AppInstallPlugin.installApk({
          filePath: fileInfo.uri,
        });

        if (installResult.completed) {
          console.log('✅ APK 安装界面已打开');
          setDownloadStatus('completed');
        } else {
          console.error('❌ 安装失败:', installResult.message);
          setError(installResult.message || '安装失败');
          setDownloadStatus('error');
        }
      } finally {
        // 清理监听器
        progressListener.remove();
      }
    } catch (err) {
      console.error('下载/安装失败:', err);
      setError(err instanceof Error ? err.message : '下载失败');
      setDownloadStatus('error');
    }
  }, [updateInfo]);

  // 取消下载
  const cancelDownload = useCallback(() => {
    downloadAbortRef.current = true;
    setDownloadStatus('idle');
    setDownloadProgress(0);
  }, []);

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
    // 下载相关
    downloadStatus,
    downloadProgress,
    startDownload,
    cancelDownload,
  };
}