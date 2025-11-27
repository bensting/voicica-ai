/**
 * TikTok Video Downloader Service - 客户端工具函数
 *
 * API 调用已移至 Server Actions (@/actions/video-downloader)
 * 此文件仅保留客户端使用的工具函数
 */

/**
 * 检测是否为有效的 TikTok URL
 */
export function isTikTokUrl(url: string): boolean {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[\w.-]+\/video\/\d+/,
    /(?:https?:\/\/)?(?:vm|vt)\.tiktok\.com\/\w+/,
    /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/t\/\w+/,
  ];

  return patterns.some(pattern => pattern.test(url));
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number | null): string {
  if (bytes === null || bytes === 0) return 'Unknown size';

  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  let size = bytes;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * 格式化时长
 */
export function formatDuration(seconds: number | null): string {
  if (seconds === null) return '--:--';

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${mins}:${secs.toString().padStart(2, '0')}`;
}