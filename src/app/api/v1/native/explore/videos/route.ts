/**
 * Native App Explore Videos API
 *
 * GET /api/v1/native/explore/videos
 * 获取公开视频列表（无需登录）
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * 脱敏邮箱
 * example@gmail.com -> ex****@gmail...
 */
function maskEmail(email: string | null): string {
  if (!email) return 'Anonymous';

  const atIndex = email.indexOf('@');
  if (atIndex <= 2) {
    return email.substring(0, 1) + '****@' + email.substring(atIndex + 1, atIndex + 6) + '...';
  }

  const prefix = email.substring(0, 2);
  const domain = email.substring(atIndex + 1);
  const domainPreview = domain.length > 5 ? domain.substring(0, 5) + '...' : domain;

  return `${prefix}****@${domainPreview}`;
}

export async function GET(req: NextRequest) {
  try {
    // 获取分页参数
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // 查询公开且成功的视频
    const [videos, total] = await Promise.all([
      prisma.video_records.findMany({
        where: {
          is_public: true,
          status: 'SUCCESS',
          video_url: { not: null },
        },
        select: {
          id: true,
          task_id: true,
          user_id: true,
          prompt: true,
          aspect_ratio: true,
          video_url: true,
          thumbnail_url: true,
          view_count: true,
          created_at: true,
        },
        orderBy: [
          { view_count: 'desc' },
          { created_at: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.video_records.count({
        where: {
          is_public: true,
          status: 'SUCCESS',
          video_url: { not: null },
        },
      }),
    ]);

    // 获取用户邮箱（批量查询）
    const userIds = [...new Set(videos.map((v) => v.user_id))];
    const users = await prisma.users.findMany({
      where: { user_id: { in: userIds } },
      select: { user_id: true, email: true },
    });
    const userMap = new Map(users.map((u) => [u.user_id, u.email]));

    const response = NextResponse.json({
      success: true,
      videos: videos.map((v) => ({
        id: v.id,
        taskId: v.task_id,
        prompt: v.prompt,
        aspectRatio: v.aspect_ratio,
        videoUrl: v.video_url,
        thumbnailUrl: v.thumbnail_url,
        viewCount: v.view_count,
        user: maskEmail(userMap.get(v.user_id) || null),
        createdAt: v.created_at?.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

    // 添加缓存：60秒 CDN 缓存，10分钟 stale-while-revalidate
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=600');

    return response;
  } catch (error) {
    console.error('❌ [Explore] 获取公开视频列表失败:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get public videos',
      },
      { status: 500 }
    );
  }
}
