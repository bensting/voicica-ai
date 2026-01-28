/**
 * Native Download Utility
 *
 * 使用 Capacitor FileTransfer 插件下载文件到设备
 * 支持音频、视频、图片等文件类型
 * 文件保存到 Documents 目录，可在文件管理器中查看
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
 * - 原生 App: 使用 Capacitor FileTransfer 下载到 Documents 目录
 * - Web: 在新窗口打开
 */
export async function downloadFile(options: DownloadOptions): Promise<DownloadResult> {
  const { url, fileName, onProgress } = options;

  // 原生平台使用 Capacitor FileTransfer
  if (Capacitor.isNativePlatform()) {
    return downloadNative(url, fileName, onProgress);
  }

  // Web 平台在新窗口打开
  return downloadWeb(url);
}

/**
 * 原生平台下载
 * 使用 @capacitor/file-transfer 下载文件（原生 HTTP，无 CORS 问题）
 * 文件保存到 Documents 目录
 */
async function downloadNative(
  url: string,
  fileName: string,
  onProgress?: (progress: number) => void
): Promise<DownloadResult> {
  try {
    const { FileTransfer } = await import('@capacitor/file-transfer');
    const { Filesystem, Directory } = await import('@capacitor/filesystem');

    console.log('📥 [Native Download] 开始下载:', url, fileName);

    // 1. 获取目标文件的完整路径
    const fileInfo = await Filesystem.getUri({
      directory: Directory.Documents,
      path: fileName,
    });

    console.log('📁 [Native Download] 目标路径:', fileInfo.uri);

    // 2. 设置进度监听
    let progressListener: { remove: () => Promise<void> } | null = null;
    if (onProgress) {
      progressListener = await FileTransfer.addListener('progress', (event) => {
        if (event.contentLength > 0) {
          const percent = Math.round((event.bytes / event.contentLength) * 100);
          onProgress(percent);
        }
      });
    }

    // 3. 使用 FileTransfer 下载（原生 HTTP 请求，绕过 CORS）
    const result = await FileTransfer.downloadFile({
      url,
      path: fileInfo.uri,
      progress: !!onProgress,
    });

    // 4. 清理监听器
    if (progressListener) {
      await progressListener.remove();
    }

    onProgress?.(100);
    console.log('✅ [Native Download] 下载完成:', result.path);

    return {
      success: true,
      filePath: result.path,
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
async function downloadWeb(url: string): Promise<DownloadResult> {
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
    // 原生端保存到设备，Web 端在新窗口打开
    let msg: string;
    if (result.filePath === 'browser') {
      msg = 'Opened in new window';
    } else if (Capacitor.getPlatform() === 'android') {
      msg = 'Saved to Documents';
    } else {
      msg = 'Saved to device';
    }
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
