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
 * 使用 Filesystem 下载文件到设备 Downloads 目录
 */
async function downloadNative(
  url: string,
  fileName: string,
  onProgress?: (progress: number) => void
): Promise<DownloadResult> {
  try {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');

    console.log('📥 [Native Download] 开始下载:', url);

    // 使用 fetch 下载文件
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // 获取文件大小用于进度计算
    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;

    // 读取响应流
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const chunks: Uint8Array[] = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      chunks.push(value);
      received += value.length;

      if (onProgress && total > 0) {
        onProgress(Math.round((received / total) * 100));
      }
    }

    // 合并 chunks 并转为 base64
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const mergedArray = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      mergedArray.set(chunk, offset);
      offset += chunk.length;
    }
    const base64 = btoa(
      mergedArray.reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );

    console.log('📥 [Native Download] 文件下载完成，正在保存...');

    // 保存到 Documents 目录（Downloads 可能不可用）
    const result = await Filesystem.writeFile({
      path: fileName,
      data: base64,
      directory: Directory.Documents,
    });

    console.log('✅ [Native Download] 文件已保存:', result.uri);

    return {
      success: true,
      filePath: result.uri,
    };
  } catch (error) {
    console.error('❌ [Native Download] 下载失败:', error);

    // 如果 Filesystem 失败，回退到使用 Browser 打开
    try {
      const { Browser } = await import('@capacitor/browser');
      console.log('📥 [Native Download] 回退到外部浏览器下载');
      await Browser.open({ url });
      return {
        success: true,
      };
    } catch {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Download failed',
      };
    }
  }
}

/**
 * Web 平台下载
 */
async function downloadWeb(
  url: string,
  fileName: string,
  onProgress?: (progress: number) => void
): Promise<DownloadResult> {
  try {
    console.log('📥 [Web Download] 开始下载:', url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // 获取文件大小用于进度计算
    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;

    // 读取响应流
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const chunks: Uint8Array[] = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      chunks.push(value);
      received += value.length;

      if (onProgress && total > 0) {
        onProgress(Math.round((received / total) * 100));
      }
    }

    // 合并 chunks
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const mergedArray = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      mergedArray.set(chunk, offset);
      offset += chunk.length;
    }
    const blob = new Blob([mergedArray]);
    const blobUrl = URL.createObjectURL(blob);

    // 触发下载
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 释放 URL
    URL.revokeObjectURL(blobUrl);

    console.log('✅ [Web Download] 下载完成');

    return { success: true };
  } catch (error) {
    console.error('❌ [Web Download] 下载失败:', error);
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
    showToast({ text: 'Download completed', duration: 'short' });
    return true;
  } else {
    showToast({ text: `Download failed: ${result.error}`, duration: 'long' });
    return false;
  }
}
