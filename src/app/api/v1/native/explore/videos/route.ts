/**
 * Native App Explore Videos API
 *
 * GET /api/v1/native/explore/videos
 * 获取公开视频列表（无需登录）
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { videoRecords, users } from '@/db/schema';
import { and, eq, desc, isNotNull, count, inArray } from 'drizzle-orm';

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
  const db = await getDb();
  try {
    // 获取分页参数
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const whereCondition = and(
      eq(videoRecords.isPublic, true),
      eq(videoRecords.status, 'SUCCESS'),
      isNotNull(videoRecords.videoUrl),
    );

    // 查询公开且成功的视频
    const [videos, [{ total }]] = await Promise.all([
      db.select({
        id: videoRecords.id,
        taskId: videoRecords.taskId,
        userId: videoRecords.userId,
        prompt: videoRecords.prompt,
        aspectRatio: videoRecords.aspectRatio,
        videoUrl: videoRecords.videoUrl,
        thumbnailUrl: videoRecords.thumbnailUrl,
        viewCount: videoRecords.viewCount,
        createdAt: videoRecords.createdAt,
      })
        .from(videoRecords)
        .where(whereCondition)
        .orderBy(desc(videoRecords.viewCount), desc(videoRecords.createdAt))
        .offset(skip)
        .limit(limit),
      db.select({ total: count() })
        .from(videoRecords)
        .where(whereCondition),
    ]);

    // 获取用户邮箱（批量查询）
    const userIds = [...new Set(videos.map((v) => v.userId))];
    const userList = userIds.length > 0
      ? await db.select({ userId: users.userId, email: users.email })
          .from(users)
          .where(inArray(users.userId, userIds))
      : [];
    const userMap = new Map(userList.map((u) => [u.userId, u.email]));

    const response = NextResponse.json({
      success: true,
      videos: videos.map((v) => ({
        id: v.id,
        taskId: v.taskId,
        prompt: v.prompt,
        aspectRatio: v.aspectRatio,
        videoUrl: v.videoUrl,
        thumbnailUrl: v.thumbnailUrl,
        viewCount: v.viewCount,
        user: maskEmail(userMap.get(v.userId) || null),
        createdAt: v.createdAt,
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
