/**
 * TikTok Video Downloader Service - 客户端工具函数
 *
 * API 调用已移至 Server Actions (@/actions/video-downloader)
 * 此文件仅保留客户端使用的工具函数
 */

// 后端 API 地址（用于构建下载 URL）
const API_BASE_URL = 'https://tools-api.voicica.ai';

/**
 * 获取代理下载 URL
 * @param videoId 视频 ID
 * @param downloadUrl 原始下载 URL
 * @param filename 下载文件名
 */
export function getProxyDownloadUrl(
  videoId: string,
  downloadUrl: string,
  filename?: string
): string {
  const encodedUrl = btoa(downloadUrl);
  const params = new URLSearchParams({
    url: encodedUrl,
  });

  if (filename) {
    params.set('filename', filename);
  }

  return `${API_BASE_URL}/api/v1/proxy/download/${videoId}?${params.toString()}`;
}

/**
 * 获取代理流式播放 URL
 * @param videoId 视频 ID
 * @param streamUrl 原始流 URL
 */
export function getProxyStreamUrl(videoId: string, streamUrl: string): string {
  const encodedUrl = btoa(streamUrl);
  return `${API_BASE_URL}/api/v1/proxy/stream/${videoId}?url=${encodedUrl}`;
}

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