/**
 * Native Download Utility
 *
 * 使用 Capacitor 原生能力下载文件到设备
 * 支持音频、视频、图片等文件类型
 */
import { Capacitor } from '@capacitor/core';

export interface DownloadOptions {
  url: string;
  fileName: string;
  /** 文件类型，用于确定保存位置 */
  type?: 'audio' | 'video' | 'image' | 'other';
  /** 下载进度回调 */
  onProgress?: (progress: number) => void;
}

export interface DownloadResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

/**
 * 下载文件到设备
 *
 * - 原生 App: 使用 Capacitor FileTransfer 下载到本地存储
 * - Web: 使用 fetch + blob 下载
 */
export async function downloadFile(options: DownloadOptions): Promise<DownloadResult> {
  const { url, fileName, onProgress } = options;

  // 原生平台使用 Capacitor
  if (Capacitor.isNativePlatform()) {
    return downloadNative(url, fileName, onProgress);
  }

  // Web 平台使用 fetch + blob
  return downloadWeb(url, fileName, onProgress);
}

/**
 * 原生平台下载
 * 使用系统浏览器下载，文件会保存到系统下载目录
 * 这是最可靠的方式，用户可以在文件管理器中找到下载的文件
 */
async function downloadNative(
  url: string,
  _fileName?: string,
  _onProgress?: (progress: number) => void
): Promise<DownloadResult> {
  // Note: fileName and onProgress are unused because we delegate to system browser
  void _fileName;
  void _onProgress;
  try {
    const { Browser } = await import('@capacitor/browser');

    console.log('📥 [Native Download] 使用系统浏览器下载:', url);

    // 使用系统浏览器打开下载链接
    // 系统会自动处理下载并保存到下载目录
    await Browser.open({ url });

    return {
      success: true,
      filePath: 'browser',
    };
  } catch (error) {
    console.error('❌ [Native Download] 下载失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Download failed',
    };
  }
}

/**
 * Web 平台下载
 * 直接在新窗口打开，避免 CORS 问题
 */
async function downloadWeb(
  url: string,
  _fileName: string,
  _onProgress?: (progress: number) => void
): Promise<DownloadResult> {
  // Note: fileName and onProgress are unused because we open in new window
  void _fileName;
  void _onProgress;
  try {
    console.log('📥 [Web Download] 在新窗口打开:', url);

    // 直接在新窗口打开，用户可以右键保存
    window.open(url, '_blank');

    return { success: true, filePath: 'browser' };
  } catch (error) {
    console.error('❌ [Web Download] 打开失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Download failed',
    };
  }
}

/**
 * 简化的下载函数，带 Toast 提示
 */
export async function downloadWithToast(
  url: string,
  fileName: string,
  type: 'audio' | 'video' | 'image' = 'video'
): Promise<boolean> {
  const { showToast } = await import('@/lib/native-toast');
  const result = await downloadFile({ url, fileName, type });

  if (result.success) {
    // 原生端用浏览器下载，Web 端直接下载
    const msg = result.filePath === 'browser'
      ? 'Download started in browser'
      : 'Download completed';
    showToast({ text: msg, duration: 'short' });
    return true;
  } else {
    showToast({ text: `Download failed: ${result.error}`, duration: 'long' });
    return false;
  }
}

/**
 * 通用下载处理函数，用于 Modal 组件
 * 自动处理 loading 状态和 Toast 提示
 */
export async function handleDownloadWithState(
  url: string | undefined | null,
  fileName: string,
  setDownloading: (v: boolean) => void,
  type: 'audio' | 'video' | 'image' = 'audio'
): Promise<void> {
  if (!url) return;

  setDownloading(true);
  try {
    await downloadWithToast(url, fileName, type);
  } finally {
    setDownloading(false);
  }
}
