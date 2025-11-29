'use server';

/**
 * Video Downloader Server Actions
 *
 * 统一的视频解析 Server Action，支持 TikTok 和 YouTube
 * 作为中间层隐藏后端 API 地址，并提供统一的错误处理
 */

import prisma from '@/lib/prisma';
import { getUserOrAnonymous } from '@/lib/auth-firebase';
import { InsufficientCreditsError, errorToResponse } from '@/lib/errors';
import { getCreditsCost } from '@/config/creditsCost';
import { ProductType } from '@/config/productType';
import { isYouTubeUrl } from '@/lib/services/youtube-downloader';
import { isTikTokUrl } from '@/lib/services/tiktok-downloader';

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

// 解析结果（包含错误处理）
export interface ParseResult {
  success: boolean;
  data?: ParseResponse;
  error?: string;
}

// 后端 API 地址（从环境变量获取）
const API_BASE_URL = process.env.NEXT_PUBLIC_TOOLS_API_URL || 'https://tools-api.voicica.ai';

/**
 * 检查用户积分
 */
async function checkCredits(
  userId: string,
  required: number,
  isAnonymous: boolean
): Promise<{ hasEnough: boolean; current: number }> {
  if (isAnonymous) {
    const user = await prisma.anonymous_users.findUnique({
      where: { user_id: userId },
      select: { credits: true },
    });
    const current = user?.credits ?? 0;
    return { hasEnough: current >= required, current };
  } else {
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      select: { credits: true },
    });
    const current = user?.credits ?? 0;
    return { hasEnough: current >= required, current };
  }
}

/**
 * 扣除积分并记录到 credit_history
 */
async function deductCreditsAndLog(
  userId: string,
  amount: number,
  productType: ProductType,
  isAnonymous: boolean,
  description: string
): Promise<void> {
  const tableName = isAnonymous ? 'anonymous_users' : 'users';

  // 扣除积分
  if (isAnonymous) {
    await prisma.anonymous_users.update({
      where: { user_id: userId },
      data: { credits: { decrement: amount } },
    });
  } else {
    await prisma.users.update({
      where: { user_id: userId },
      data: { credits: { decrement: amount } },
    });
  }

  // 记录到 credit_history
  await prisma.credit_history.create({
    data: {
      user_id: userId,
      amount: -amount,
      description,
      product_type: productType,
    },
  });

  console.log(`✅ [deductCredits] 扣除积分成功: ${amount}, 用户: ${userId}, 表: ${tableName}`);
}

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
        error: 'URL is required',
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
        error: 'Unsupported platform. Only YouTube and TikTok are supported.',
      };
    }

    console.log('🎬 [parseVideoUrl] 检测平台:', platformName);

    // 4. 获取所需积分
    const requiredCredits = getCreditsCost(productType);

    console.log('🎬 [parseVideoUrl] 所需积分:', requiredCredits);

    // 5. 检查积分是否足够
    if (requiredCredits > 0) {
      const { hasEnough, current } = await checkCredits(userId, requiredCredits, isAnonymous);

      if (!hasEnough) {
        console.log(`⚠️ [parseVideoUrl] 积分不足: 需要 ${requiredCredits}, 当前 ${current}`);
        throw new InsufficientCreditsError(requiredCredits, current);
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
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      return {
        success: false,
        error: error.detail || 'Failed to parse video',
      };
    }

    const data: ParseResponse = await response.json();

    // 7. 解析成功，扣除积分
    if (requiredCredits > 0) {
      await deductCreditsAndLog(
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

    // 处理积分不足错误
    if (error instanceof InsufficientCreditsError) {
      const errorResponse = errorToResponse(error);
      return {
        success: false,
        error: errorResponse.error,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse video',
    };
  }
}