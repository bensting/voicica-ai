/**
 * Native Download Utility
 *
 * 文件下载和保存策略：
 * - 图片 (image) → 相册 (使用 @capacitor-community/media)
 * - 视频 (video) → 相册 (使用 @capacitor-community/media)
 * - 音乐 (music) → Music/Voicica/ 目录
 * - 音频/TTS (audio) → Documents 目录
 */
import { Capacitor } from '@capacitor/core';

/** 文件类型，用于确定保存位置 */
export type FileType = 'audio' | 'video' | 'image' | 'music' | 'other';

export interface DownloadOptions {
  url: string;
  fileName: string;
  type?: FileType;
  /** 下载进度回调 */
  onProgress?: (progress: number) => void;
}

export interface DownloadResult {
  success: boolean;
  filePath?: string;
  /** 保存位置描述，用于显示给用户 */
  location?: string;
  error?: string;
}

/** 缓存相册 ID，避免重复查询 */
let cachedAlbumId: string | null = null;

/**
 * 获取或创建 Voicica 相册
 * @param albumName 相册名称
 * @returns 相册 identifier
 */
async function getOrCreateAlbum(albumName: string): Promise<string> {
  // 如果已缓存，直接返回
  if (cachedAlbumId) {
    return cachedAlbumId;
  }

  const { Media } = await import('@capacitor-community/media');

  // 获取所有相册
  const { albums } = await Media.getAlbums();
  console.log('📚 [getOrCreateAlbum] 现有相册:', albums.map(a => a.name));

  // 查找目标相册
  const existingAlbum = albums.find(a => a.name === albumName);
  if (existingAlbum) {
    console.log('✅ [getOrCreateAlbum] 找到相册:', existingAlbum.name, existingAlbum.identifier);
    cachedAlbumId = existingAlbum.identifier;
    return existingAlbum.identifier;
  }

  // 创建新相册
  console.log('📁 [getOrCreateAlbum] 创建新相册:', albumName);
  await Media.createAlbum({ name: albumName });
  console.log('✅ [getOrCreateAlbum] 相册创建成功');

  // 重新获取相册列表以获取 identifier
  const { albums: newAlbums } = await Media.getAlbums();
  const newAlbum = newAlbums.find(a => a.name === albumName);
  if (newAlbum) {
    cachedAlbumId = newAlbum.identifier;
    return newAlbum.identifier;
  }

  // 如果还是找不到，返回空字符串（某些 Android 版本可能不需要）
  console.warn('⚠️ [getOrCreateAlbum] 无法获取相册 identifier');
  return '';
}

/**
 * 下载文件到设备
 *
 * - 原生 App: 根据文件类型保存到不同位置
 * - Web: 在新窗口打开
 */
export async function downloadFile(options: DownloadOptions): Promise<DownloadResult> {
  const { url, fileName, type = 'other', onProgress } = options;

  // Web 平台在新窗口打开
  if (!Capacitor.isNativePlatform()) {
    return downloadWeb(url);
  }

  // 原生平台根据类型选择保存方式
  switch (type) {
    case 'image':
      return saveImageToGallery(url, fileName, onProgress);
    case 'video':
      return saveVideoToGallery(url, fileName, onProgress);
    case 'music':
      return saveToMusicFolder(url, fileName, onProgress);
    default:
      // audio (TTS) 和 other 保存到 Documents
      return saveToDocuments(url, fileName, onProgress);
  }
}

/**
 * 保存图片到相册
 * 使用 @capacitor-community/media 插件
 * Fallback: 如果插件不可用（老版本 App），保存到 Documents
 */
async function saveImageToGallery(
  url: string,
  fileName: string,
  onProgress?: (progress: number) => void
): Promise<DownloadResult> {
  try {
    // 先下载到临时目录
    const tempResult = await downloadToCache(url, fileName, onProgress);
    if (!tempResult.success || !tempResult.filePath) {
      return tempResult;
    }

    // 尝试使用 Media 插件保存到相册
    try {
      const { Media } = await import('@capacitor-community/media');

      // 确保路径格式正确
      let photoPath = tempResult.filePath;
      if (!photoPath.startsWith('file://') && !photoPath.startsWith('content://')) {
        photoPath = `file://${photoPath}`;
      }

      console.log('📸 [saveImageToGallery] 保存路径:', photoPath);

      // 获取或创建 Voicica 相册
      const albumName = 'Voicica';
      const albumId = await getOrCreateAlbum(albumName);

      console.log('📁 [saveImageToGallery] 相册ID:', albumId);

      await Media.savePhoto({
        path: photoPath,
        albumIdentifier: albumId,
      });

      console.log('✅ [saveImageToGallery] 已保存到相册');

      // 清理临时文件
      await cleanupTempFile(tempResult.filePath);

      return {
        success: true,
        filePath: 'gallery',
        location: 'Photos',
      };
    } catch (mediaError) {
      // Media 插件调用失败，打印详细错误并 fallback 到 Documents
      console.error('⚠️ [saveImageToGallery] Media 插件错误:', mediaError);
      return saveToDocuments(url, fileName, onProgress);
    }
  } catch (error) {
    console.error('❌ [saveImageToGallery] 失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Save to gallery failed',
    };
  }
}

/**
 * 保存视频到相册
 * 使用 @capacitor-community/media 插件
 * Fallback: 如果插件不可用（老版本 App），保存到 Documents
 */
async function saveVideoToGallery(
  url: string,
  fileName: string,
  onProgress?: (progress: number) => void
): Promise<DownloadResult> {
  try {
    // 先下载到临时目录
    const tempResult = await downloadToCache(url, fileName, onProgress);
    if (!tempResult.success || !tempResult.filePath) {
      return tempResult;
    }

    // 尝试使用 Media 插件保存到相册
    try {
      const { Media } = await import('@capacitor-community/media');

      // 确保路径格式正确
      let videoPath = tempResult.filePath;
      if (!videoPath.startsWith('file://') && !videoPath.startsWith('content://')) {
        videoPath = `file://${videoPath}`;
      }

      console.log('🎬 [saveVideoToGallery] 保存路径:', videoPath);

      // 获取或创建 Voicica 相册
      const albumName = 'Voicica';
      const albumId = await getOrCreateAlbum(albumName);

      console.log('📁 [saveVideoToGallery] 相册ID:', albumId);

      await Media.saveVideo({
        path: videoPath,
        albumIdentifier: albumId,
      });

      console.log('✅ [saveVideoToGallery] 已保存到相册');

      // 清理临时文件
      await cleanupTempFile(tempResult.filePath);

      return {
        success: true,
        filePath: 'gallery',
        location: 'Photos',
      };
    } catch (mediaError) {
      // Media 插件调用失败，打印详细错误并 fallback 到 Documents
      console.error('⚠️ [saveVideoToGallery] Media 插件错误:', mediaError);
      return saveToDocuments(url, fileName, onProgress);
    }
  } catch (error) {
    console.error('❌ [saveVideoToGallery] 失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Save to gallery failed',
    };
  }
}

/**
 * 保存音乐到公共 Music/Voicica/ 目录
 * 使用 ExternalStorage 访问公共存储（/storage/emulated/0/Music/）
 */
async function saveToMusicFolder(
  url: string,
  fileName: string,
  onProgress?: (progress: number) => void
): Promise<DownloadResult> {
  try {
    const { FileTransfer } = await import('@capacitor/file-transfer');
    const { Filesystem, Directory } = await import('@capacitor/filesystem');

    const musicPath = `Music/Voicica/${fileName}`;
    console.log('📥 [saveToMusicFolder] 开始下载:', url, '→', musicPath);

    // 确保目录存在（使用 ExternalStorage 访问公共存储）
    try {
      await Filesystem.mkdir({
        path: 'Music/Voicica',
        directory: Directory.ExternalStorage,
        recursive: true,
      });
    } catch {
      // 目录可能已存在，忽略错误
    }

    // 获取目标文件的完整路径（使用 ExternalStorage）
    const fileInfo = await Filesystem.getUri({
      directory: Directory.ExternalStorage,
      path: musicPath,
    });

    console.log('📁 [saveToMusicFolder] 目标路径:', fileInfo.uri);

    // 设置进度监听
    let progressListener: { remove: () => Promise<void> } | null = null;
    if (onProgress) {
      progressListener = await FileTransfer.addListener('progress', (event) => {
        if (event.contentLength > 0) {
          const percent = Math.round((event.bytes / event.contentLength) * 100);
          onProgress(percent);
        }
      });
    }

    // 下载文件
    const result = await FileTransfer.downloadFile({
      url,
      path: fileInfo.uri,
      progress: !!onProgress,
    });

    // 清理监听器
    if (progressListener) {
      await progressListener.remove();
    }

    onProgress?.(100);
    console.log('✅ [saveToMusicFolder] 下载完成:', result.path);

    return {
      success: true,
      filePath: result.path,
      location: 'Music',
    };
  } catch (error) {
    console.error('❌ [saveToMusicFolder] 失败:', error);
    // Fallback 到 Documents
    console.log('⚠️ [saveToMusicFolder] Fallback 到 Documents');
    return saveToDocuments(url, fileName, onProgress);
  }
}

/**
 * 保存文件到 Documents 目录
 * 用于 TTS 音频和其他文件
 */
async function saveToDocuments(
  url: string,
  fileName: string,
  onProgress?: (progress: number) => void
): Promise<DownloadResult> {
  try {
    const { FileTransfer } = await import('@capacitor/file-transfer');
    const { Filesystem, Directory } = await import('@capacitor/filesystem');

    console.log('📥 [saveToDocuments] 开始下载:', url, fileName);

    // 获取目标文件的完整路径
    const fileInfo = await Filesystem.getUri({
      directory: Directory.Documents,
      path: fileName,
    });

    console.log('📁 [saveToDocuments] 目标路径:', fileInfo.uri);

    // 设置进度监听
    let progressListener: { remove: () => Promise<void> } | null = null;
    if (onProgress) {
      progressListener = await FileTransfer.addListener('progress', (event) => {
        if (event.contentLength > 0) {
          const percent = Math.round((event.bytes / event.contentLength) * 100);
          onProgress(percent);
        }
      });
    }

    // 下载文件
    const result = await FileTransfer.downloadFile({
      url,
      path: fileInfo.uri,
      progress: !!onProgress,
    });

    // 清理监听器
    if (progressListener) {
      await progressListener.remove();
    }

    onProgress?.(100);
    console.log('✅ [saveToDocuments] 下载完成:', result.path);

    return {
      success: true,
      filePath: result.path,
      location: 'Documents',
    };
  } catch (error) {
    console.error('❌ [saveToDocuments] 下载失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Download failed',
    };
  }
}

/**
 * 下载文件到 Cache 目录（临时）
 * 用于后续保存到相册
 */
async function downloadToCache(
  url: string,
  fileName: string,
  onProgress?: (progress: number) => void
): Promise<DownloadResult> {
  try {
    const { FileTransfer } = await import('@capacitor/file-transfer');
    const { Filesystem, Directory } = await import('@capacitor/filesystem');

    console.log('📥 [downloadToCache] 开始下载:', url);

    // 获取临时文件路径
    const fileInfo = await Filesystem.getUri({
      directory: Directory.Cache,
      path: fileName,
    });

    // 设置进度监听
    let progressListener: { remove: () => Promise<void> } | null = null;
    if (onProgress) {
      progressListener = await FileTransfer.addListener('progress', (event) => {
        if (event.contentLength > 0) {
          const percent = Math.round((event.bytes / event.contentLength) * 100);
          onProgress(percent);
        }
      });
    }

    // 下载文件
    const result = await FileTransfer.downloadFile({
      url,
      path: fileInfo.uri,
      progress: !!onProgress,
    });

    // 清理监听器
    if (progressListener) {
      await progressListener.remove();
    }

    console.log('✅ [downloadToCache] 下载完成:', result.path);

    return {
      success: true,
      filePath: result.path,
    };
  } catch (error) {
    console.error('❌ [downloadToCache] 下载失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Download failed',
    };
  }
}

/**
 * 清理临时文件
 */
async function cleanupTempFile(filePath: string): Promise<void> {
  try {
    const { Filesystem } = await import('@capacitor/filesystem');
    await Filesystem.deleteFile({ path: filePath });
    console.log('🗑️ [cleanupTempFile] 已清理临时文件:', filePath);
  } catch {
    // 忽略清理失败
  }
}

/**
 * Web 平台下载
 * 直接在新窗口打开，避免 CORS 问题
 */
async function downloadWeb(url: string): Promise<DownloadResult> {
  try {
    console.log('📥 [Web Download] 在新窗口打开:', url);
    window.open(url, '_blank');
    return { success: true, filePath: 'browser', location: 'Browser' };
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
  type: FileType = 'other'
): Promise<boolean> {
  const { showToast } = await import('@/lib/native-toast');
  const result = await downloadFile({ url, fileName, type });

  if (result.success) {
    // 根据保存位置显示不同的提示
    let msg: string;
    if (result.filePath === 'browser') {
      msg = 'Opened in new window';
    } else if (result.location === 'Photos') {
      msg = 'Saved to Photos';
    } else if (result.location === 'Music') {
      msg = 'Saved to Music';
    } else {
      msg = 'Saved to Documents';
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
  type: FileType = 'audio'
): Promise<void> {
  if (!url) return;

  setDownloading(true);
  try {
    await downloadWithToast(url, fileName, type);
  } finally {
    setDownloading(false);
  }
}
