/**
 * Native Download Utility
 *
 * 使用 Capacitor 原生能力下载文件到设备
 * 支持音频、视频、图片等文件类型
 */
import { Capacitor, CapacitorHttp } from '@capacitor/core';

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
 * - 原生 App: 使用 Capacitor Filesystem 下载到本地存储
 * - Web: 在新窗口打开
 */
export async function downloadFile(options: DownloadOptions): Promise<DownloadResult> {
  const { url, fileName, type, onProgress } = options;

  // 原生平台使用 Capacitor Filesystem
  if (Capacitor.isNativePlatform()) {
    return downloadNative(url, fileName, type, onProgress);
  }

  // Web 平台在新窗口打开
  return downloadWeb(url, fileName, onProgress);
}

/**
 * 原生平台下载
 * 使用 Capacitor Filesystem 下载文件到设备存储
 * 使用 CapacitorHttp 绕过 CORS 限制
 */
async function downloadNative(
  url: string,
  fileName: string,
  type?: 'audio' | 'video' | 'image' | 'other',
  onProgress?: (progress: number) => void
): Promise<DownloadResult> {
  try {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');

    console.log('📥 [Native Download] 开始下载:', url, fileName);

    // 1. 使用 CapacitorHttp 获取文件数据（绕过 CORS）
    onProgress?.(10);
    const response = await CapacitorHttp.get({
      url,
      responseType: 'arraybuffer',
    });

    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}`);
    }

    onProgress?.(50);

    // 2. 转换为 base64
    // CapacitorHttp 在原生端返回的 arraybuffer 实际上可能是 base64 字符串
    let base64: string;
    if (typeof response.data === 'string') {
      // 原生端返回的已经是 base64 字符串
      base64 = response.data;
    } else if (response.data instanceof ArrayBuffer) {
      // ArrayBuffer 需要转换为 base64
      base64 = arrayBufferToBase64(response.data);
    } else {
      throw new Error('Unexpected response data type');
    }
    onProgress?.(80);

    // 3. 确定保存目录
    // 图片和视频使用 Documents 目录（Android 会自动扫描）
    // 音频使用 External 目录下的 Music 文件夹（Android 标准音乐目录）
    const platform = Capacitor.getPlatform();
    const isAndroid = platform === 'android';

    let directory: typeof Directory.Documents | typeof Directory.External;
    let subDir: string;

    if (type === 'audio' && isAndroid) {
      // Android: 保存到外部存储的 Music/Voicica 目录
      directory = Directory.External;
      subDir = 'Music/Voicica';
    } else {
      // iOS 或其他类型: 保存到 Documents/Voicica 目录
      directory = Directory.Documents;
      subDir = type === 'image' ? 'Voicica/Images' :
               type === 'video' ? 'Voicica/Videos' :
               type === 'audio' ? 'Voicica/Audio' : 'Voicica';
    }

    // 确保目录存在
    try {
      await Filesystem.mkdir({
        path: subDir,
        directory,
        recursive: true,
      });
    } catch {
      // 目录可能已存在，忽略错误
    }

    // 4. 写入文件
    const result = await Filesystem.writeFile({
      path: `${subDir}/${fileName}`,
      data: base64,
      directory,
    });

    onProgress?.(100);
    console.log('✅ [Native Download] 下载完成:', result.uri);

    return {
      success: true,
      filePath: result.uri,
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
 * Blob 转 base64
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // 去掉 data:xxx;base64, 前缀
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * ArrayBuffer 转 base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
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
    // 原生端保存到设备，Web 端在新窗口打开
    let msg: string;
    if (result.filePath === 'browser') {
      msg = 'Opened in new window';
    } else if (type === 'audio' && Capacitor.getPlatform() === 'android') {
      msg = 'Saved to Music/Voicica';
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
