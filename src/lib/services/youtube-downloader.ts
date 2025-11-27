/**
 * YouTube Video Downloader Service - 客户端工具函数
 *
 * API 调用已移至 Server Actions (@/actions/video-downloader)
 * 此文件仅保留客户端使用的工具函数
 */

import type { VideoFormat } from '@/actions/video-downloader';

// 格式类型
export type FormatType = 'video_with_audio' | 'video_only' | 'audio_only';

/**
 * 检测是否为有效的 YouTube URL
 */
export function isYouTubeUrl(url: string): boolean {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/[\w-]+/,
    /(?:https?:\/\/)?youtu\.be\/[\w-]+/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/[\w-]+/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/[\w-]+/,
    /(?:https?:\/\/)?m\.youtube\.com\/watch\?v=[\w-]+/,
  ];

  return patterns.some(pattern => pattern.test(url));
}

/**
 * 获取格式类型
 */
export function getFormatType(format: VideoFormat): FormatType {
  const note = format.note?.toLowerCase() || '';

  if (note.includes('纯音频') || note.includes('audio only')) {
    return 'audio_only';
  }
  if (note.includes('无音频') || note.includes('no audio') || note.includes('video only')) {
    return 'video_only';
  }
  // 有音频 or default
  return 'video_with_audio';
}

/**
 * 按类型过滤格式
 */
export function filterFormatsByType(formats: VideoFormat[], type: FormatType): VideoFormat[] {
  return formats.filter(format => getFormatType(format) === type);
}

/**
 * 获取按类型分组的格式
 */
export function getGroupedFormats(formats: VideoFormat[]): {
  videoWithAudio: VideoFormat[];
  videoOnly: VideoFormat[];
  audioOnly: VideoFormat[];
} {
  return {
    videoWithAudio: filterFormatsByType(formats, 'video_with_audio'),
    videoOnly: filterFormatsByType(formats, 'video_only'),
    audioOnly: filterFormatsByType(formats, 'audio_only'),
  };
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number | null): string {
  if (bytes === null || bytes === 0) return '';

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

  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 获取格式的扩展名
 */
export function getFormatExtension(format: VideoFormat): string {
  return format.ext || 'mp4';
}