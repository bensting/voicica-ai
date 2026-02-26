/**
 * Native App Public Video Detail API
 *
 * GET /api/v1/native/explore/videos/[taskId]
 * 获取单个公开视频详情并增加浏览量
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { videoRecords, users } from '@/db/schema';
import { and, eq, sql } from 'drizzle-orm';

/**
 * 脱敏邮箱
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const db = await getDb();
  try {
    const { taskId } = await params;

    // 查询公开且成功的视频
    const [video] = await db.select({
      id: videoRecords.id,
      taskId: videoRecords.taskId,
      userId: videoRecords.userId,
      prompt: videoRecords.prompt,
      model: videoRecords.model,
      resolution: videoRecords.resolution,
      duration: videoRecords.duration,
      aspectRatio: videoRecords.aspectRatio,
      videoUrl: videoRecords.videoUrl,
      thumbnailUrl: videoRecords.thumbnailUrl,
      viewCount: videoRecords.viewCount,
      createdAt: videoRecords.createdAt,
    })
      .from(videoRecords)
      .where(and(
        eq(videoRecords.taskId, taskId),
        eq(videoRecords.isPublic, true),
        eq(videoRecords.status, 'SUCCESS'),
      ))
      .limit(1);

    if (!video) {
      return NextResponse.json(
        { success: false, error: 'Video not found' },
        { status: 404 }
      );
    }

    // 异步增加浏览量（不等待完成）
    db.update(videoRecords)
      .set({ viewCount: sql`${videoRecords.viewCount} + 1` })
      .where(eq(videoRecords.id, video.id))
      .then(() => {})
      .catch((err: unknown) => {
        console.error('Failed to increment view count:', err);
      });

    // 获取用户邮箱
    const [user] = await db.select({ email: users.email })
      .from(users)
      .where(eq(users.userId, video.userId))
      .limit(1);

    return NextResponse.json({
      success: true,
      video: {
        id: video.id,
        taskId: video.taskId,
        prompt: video.prompt,
        model: video.model,
        resolution: video.resolution,
        duration: video.duration,
        aspectRatio: video.aspectRatio,
        videoUrl: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl,
        viewCount: video.viewCount + 1, // 返回已增加后的数量
        user: maskEmail(user?.email || null),
        createdAt: video.createdAt,
      },
    });
  } catch (error) {
    console.error('❌ [Explore] 获取公开视频详情失败:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get video',
      },
      { status: 500 }
    );
  }
}
