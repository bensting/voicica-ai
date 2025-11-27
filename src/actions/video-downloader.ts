'use server';

/**
 * Video Downloader Server Actions
 *
 * 统一的视频解析 Server Action，支持 TikTok 和 YouTube
 * 作为中间层隐藏后端 API 地址，并提供统一的错误处理
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

// 解析结果（包含错误处理）
export interface ParseResult {
  success: boolean;
  data?: ParseResponse;
  error?: string;
}

// 后端 API 地址（服务端环境变量，不暴露给客户端）
const API_BASE_URL = process.env.TOOLS_API_URL || 'https://tools-api.voicica.ai';

/**
 * 解析视频 URL（统一入口）
 *
 * 支持 TikTok 和 YouTube，后端会自动识别平台
 */
export async function parseVideoUrl(url: string): Promise<ParseResult> {
  try {
    // 1. 服务端 URL 验证
    if (!url?.trim()) {
      return {
        success: false,
        error: 'URL is required',
      };
    }

    // 2. 可选：用户认证（未来可扩展）
    // const session = await auth();
    // if (!session) {
    //   return { success: false, error: 'Unauthorized' };
    // }

    // 3. 可选：速率限制（未来可扩展）
    // await rateLimit(session.userId);

    // 4. 调用后端 API
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

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('[parseVideoUrl] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse video',
    };
  }
}