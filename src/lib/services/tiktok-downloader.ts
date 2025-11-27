/**
 * TikTok Video Downloader Service
 *
 * 调用后端 API 解析和下载 TikTok 视频
 */

// 视频格式信息
export interface VideoFormat {
  format_id: string;
  quality: string;
  ext: string;
  filesize: number | null;
  note: string | null;
  url: string | null;
}

// 解析响应
export interface ParseResponse {
  platform: string;
  video_id: string;
  title: string;
  author: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  formats: VideoFormat[];
}

// API 错误
export interface ApiError {
  detail: string;
}

// 后端 API 地址
const API_BASE_URL = process.env.NEXT_PUBLIC_TIKTOK_API_URL || 'https://tools-api.voicica.ai';

/**
 * 解析 TikTok 视频信息
 */
export async function parseVideo(url: string): Promise<ParseResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/parse`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.detail || 'Failed to parse video');
  }

  return response.json();
}

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