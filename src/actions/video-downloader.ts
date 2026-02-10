'use server';

/**
 * Video Downloader Server Actions
 *
 * YouTube video parsing via youtubei.js + residential proxy.
 * Replaces the old tools-api.voicica.ai backend dependency.
 */

import { getUserOrAnonymous } from '@/lib/auth-firebase';
import { InsufficientCreditsError } from '@/lib/errors';
import { calculateProductCreditsCost } from '@/config/creditsCost';
import { ProductType } from '@/config/productType';
import { detectVideoPlatform } from '@/lib/services/youtube-downloader';
import { parseVideo } from '@/lib/services/youtube-parser';
import { checkCredits, deductCredits } from '@/lib/credits';
import { uploadVideo } from '@/lib/services/r2-storage';

// 视频格式信息
export interface VideoFormat {
  format_id: string;
  quality: string;
  ext: string;
  filesize: number | null;
  note: string | null;
  url: string | null;
  /** yt-dlp 返回的下载所需 HTTP headers（Referer、Cookie 等） */
  http_headers?: Record<string, string> | null;
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

// 错误码类型
export type VideoParseErrorCode =
  | 'EMPTY_URL'
  | 'INVALID_URL'
  | 'UNSUPPORTED_PLATFORM'
  | 'INSUFFICIENT_CREDITS'
  | 'PARSE_FAILED'
  | 'UNKNOWN_ERROR';

// 解析结果（包含错误处理）
export interface ParseResult {
  success: boolean;
  data?: ParseResponse;
  error?: string;
  errorCode?: VideoParseErrorCode;
  errorData?: Record<string, unknown>;
}

/**
 * 解析视频 URL（支持 YouTube, TikTok, Instagram, Twitter/X, Facebook）
 */
export async function parseVideoUrl(url: string): Promise<ParseResult> {
  console.log('🎬 [parseVideoUrl] 开始解析视频');

  try {
    // 1. 服务端 URL 验证
    if (!url?.trim()) {
      return {
        success: false,
        errorCode: 'EMPTY_URL',
      };
    }

    // 2. 获取用户信息
    const unifiedUser = await getUserOrAnonymous();
    const userId = unifiedUser.user_id;
    const isAnonymous = unifiedUser.is_anonymous;

    console.log('🎬 [parseVideoUrl] 用户认证成功:', { userId, isAnonymous });

    // 3. 检测平台
    const platform = detectVideoPlatform(url);
    if (!platform) {
      return {
        success: false,
        errorCode: 'UNSUPPORTED_PLATFORM',
      };
    }

    const productType = ProductType.VIDEO_DOWNLOADER;

    // 4. 计算所需积分
    const requiredCredits = calculateProductCreditsCost(productType);

    console.log('🎬 [parseVideoUrl] 所需积分:', requiredCredits);

    // 5. 检查积分是否足够
    if (requiredCredits > 0) {
      const { hasEnough, current } = await checkCredits(userId, requiredCredits, isAnonymous);

      if (!hasEnough) {
        console.log(`⚠️ [parseVideoUrl] 积分不足: 需要 ${requiredCredits}, 当前 ${current}`);
        return {
          success: false,
          errorCode: 'INSUFFICIENT_CREDITS',
          errorData: { required: requiredCredits, current },
        };
      }

      console.log('✅ [parseVideoUrl] 积分充足:', current);
    }

    // 6. 使用 yt-dlp 解析视频
    const data = await parseVideo(url, platform);

    // 7. 解析成功，扣除积分
    if (requiredCredits > 0) {
      await deductCredits(
        userId,
        requiredCredits,
        productType,
        isAnonymous,
        `Video download (${platform}): ${data.title || 'Untitled'}`
      );
    }

    console.log('✅ [parseVideoUrl] 解析成功并扣除积分');

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('[parseVideoUrl] Error:', error);

    // 检查是否是积分不足错误
    if (error instanceof InsufficientCreditsError) {
      return {
        success: false,
        errorCode: 'INSUFFICIENT_CREDITS',
        errorData: error.data,
      };
    }

    // 未知错误不暴露详情
    return {
      success: false,
      errorCode: 'PARSE_FAILED',
    };
  }
}

// 代理下载结果
export interface ProxyDownloadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * 服务端代理下载视频格式（用于 TikTok 等 IP 锁定的平台）
 * 服务端 fetch 下载 → 上传 R2 → 返回 R2 公开 URL
 */
export async function proxyDownloadFormat(
  videoUrl: string,
  httpHeaders: Record<string, string>,
  fileName: string
): Promise<ProxyDownloadResult> {
  try {
    console.log('🎬 [proxyDownload] 开始代理下载:', fileName);

    // 服务端下载（同 IP，绕过防盗链）
    const response = await fetch(videoUrl, {
      headers: httpHeaders,
      redirect: 'follow',
    });

    if (!response.ok) {
      console.error(`❌ [proxyDownload] 下载失败: ${response.status}`);
      return { success: false, error: `Download failed: ${response.status}` };
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    console.log(`📦 [proxyDownload] 下载完成: ${(buffer.length / 1024 / 1024).toFixed(1)}MB`);

    // 上传到 R2
    const ext = fileName.split('.').pop() || 'mp4';
    const r2FileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const contentType = ext === 'mp4' ? 'video/mp4' : ext === 'webm' ? 'video/webm' : 'video/mp4';
    const r2Url = await uploadVideo(buffer, r2FileName, contentType, 'video_downloads');

    console.log('✅ [proxyDownload] R2 上传成功:', r2Url);
    return { success: true, url: r2Url };
  } catch (error) {
    console.error('❌ [proxyDownload] 错误:', error);
    return { success: false, error: 'Proxy download failed' };
  }
}
