/**
 * Video Downloader 共享工具函数
 */

import type { VideoParseErrorCode } from '@/actions/video-downloader';

/**
 * 错误码到翻译 key 的映射
 */
const ERROR_CODE_TO_KEY: Record<VideoParseErrorCode, string> = {
  EMPTY_URL: 'emptyUrl',
  INVALID_URL: 'invalidUrl',
  UNSUPPORTED_PLATFORM: 'invalidUrl',
  INSUFFICIENT_CREDITS: 'insufficientCredits',
  PARSE_FAILED: 'parseFailed',
  UNKNOWN_ERROR: 'unknownError',
};

/**
 * 根据错误码获取国际化错误信息
 *
 * @param errorCode 错误码
 * @param errorData 错误相关数据（如积分不足时的 required/current）
 * @param t 翻译函数
 * @param prefix 翻译 key 前缀（如 'youtubeDownloader' 或 'tiktokDownloader'）
 */
export function getVideoParseErrorMessage(
  errorCode: VideoParseErrorCode,
  errorData: Record<string, unknown> | undefined,
  t: (key: string, params?: Record<string, unknown>) => string,
  prefix: 'youtubeDownloader' | 'tiktokDownloader'
): string {
  const errorKey = ERROR_CODE_TO_KEY[errorCode] || 'unknownError';
  const translationKey = `${prefix}.errors.${errorKey}`;

  if (errorCode === 'INSUFFICIENT_CREDITS') {
    return t(translationKey, {
      required: errorData?.required ?? 0,
      current: errorData?.current ?? 0,
    });
  }

  return t(translationKey);
}