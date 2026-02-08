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
import { isYouTubeUrl } from '@/lib/services/youtube-downloader';
import { parseYouTubeVideo } from '@/lib/services/youtube-parser';
import { checkCredits, deductCredits } from '@/lib/credits';

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
 * 解析视频 URL（YouTube only）
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

    // 3. 验证 URL 是 YouTube
    if (!isYouTubeUrl(url)) {
      return {
        success: false,
        errorCode: 'UNSUPPORTED_PLATFORM',
      };
    }

    const productType = ProductType.YOUTUBE_DOWNLOADER;

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

    // 6. 使用 youtubei.js 解析视频
    const data = await parseYouTubeVideo(url);

    // 7. 解析成功，扣除积分
    if (requiredCredits > 0) {
      await deductCredits(
        userId,
        requiredCredits,
        productType,
        isAnonymous,
        `YouTube video parsing: ${data.title || 'Untitled'}`
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
