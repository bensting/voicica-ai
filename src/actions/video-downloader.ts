'use server';

/**
 * Video Downloader Server Actions
 *
 * 统一的视频解析 Server Action，支持 TikTok 和 YouTube
 * 作为中间层隐藏后端 API 地址，并提供统一的错误处理
 */

import { getUserOrAnonymous } from '@/lib/auth-firebase';
import { InsufficientCreditsError } from '@/lib/errors';
import { calculateProductCreditsCost } from '@/config/creditsCost';
import { ProductType } from '@/config/productType';
import { isYouTubeUrl } from '@/lib/services/youtube-downloader';
import { isTikTokUrl } from '@/lib/services/tiktok-downloader';
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

// 后端 API 地址（从环境变量获取）
const API_BASE_URL = process.env.NEXT_PUBLIC_TOOLS_API_URL || 'https://tools-api.voicica.ai';

/**
 * 解析视频 URL（统一入口）
 *
 * 支持 TikTok 和 YouTube，后端会自动识别平台
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

    // 3. 判断平台类型
    let productType: ProductType;
    let platformName: string;

    if (isYouTubeUrl(url)) {
      productType = ProductType.YOUTUBE_DOWNLOADER;
      platformName = 'YouTube';
    } else if (isTikTokUrl(url)) {
      productType = ProductType.TIKTOK_DOWNLOADER;
      platformName = 'TikTok';
    } else {
      return {
        success: false,
        errorCode: 'UNSUPPORTED_PLATFORM',
      };
    }

    console.log('🎬 [parseVideoUrl] 检测平台:', platformName);

    // 4. 计算所需积分（使用统一入口）
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

    // 6. 调用后端 API 解析视频
    const response = await fetch(`${API_BASE_URL}/api/v1/parse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      // 记录后端错误但不暴露给用户
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      console.error('🎬 [parseVideoUrl] 后端解析失败:', error.detail);
      return {
        success: false,
        errorCode: 'PARSE_FAILED',
      };
    }

    const data: ParseResponse = await response.json();

    // 7. 解析成功，扣除积分
    if (requiredCredits > 0) {
      await deductCredits(
        userId,
        requiredCredits,
        productType,
        isAnonymous,
        `${platformName} video parsing: ${data.title || 'Untitled'}`
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
      errorCode: 'UNKNOWN_ERROR',
    };
  }
}