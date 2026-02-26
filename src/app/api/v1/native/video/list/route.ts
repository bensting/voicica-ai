/**
 * Native App Video List API
 *
 * GET /api/v1/native/video/list
 * 获取用户的视频列表
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { videoRecords } from '@/db/schema';
import { eq, desc, count } from 'drizzle-orm';
import { getUserOrAnonymous } from '@/lib/auth-firebase';

export async function GET(req: NextRequest) {
  const db = await getDb();
  try {
    // 1. 获取用户身份
    const { user_id } = await getUserOrAnonymous();

    // 2. 获取分页参数
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // 3. 查询视频列表（按创建时间倒序）
    const [videos, [{ total }]] = await Promise.all([
      db.select({
        taskId: videoRecords.taskId,
        status: videoRecords.status,
        progress: videoRecords.progress,
        prompt: videoRecords.prompt,
        model: videoRecords.model,
        resolution: videoRecords.resolution,
        duration: videoRecords.duration,
        aspectRatio: videoRecords.aspectRatio,
        videoUrl: videoRecords.videoUrl,
        thumbnailUrl: videoRecords.thumbnailUrl,
        errorMessage: videoRecords.errorMessage,
        createdAt: videoRecords.createdAt,
        completedAt: videoRecords.completedAt,
      })
        .from(videoRecords)
        .where(eq(videoRecords.userId, user_id))
        .orderBy(desc(videoRecords.createdAt))
        .offset(skip)
        .limit(limit),
      db.select({ total: count() })
        .from(videoRecords)
        .where(eq(videoRecords.userId, user_id)),
    ]);

    return NextResponse.json({
      success: true,
      videos: videos.map((v) => ({
        taskId: v.taskId,
        status: v.status,
        progress: v.progress,
        prompt: v.prompt,
        model: v.model,
        resolution: v.resolution,
        duration: v.duration,
        aspectRatio: v.aspectRatio,
        videoUrl: v.videoUrl,
        thumbnailUrl: v.thumbnailUrl,
        errorMessage: v.errorMessage,
        createdAt: v.createdAt,
        completedAt: v.completedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('❌ [NativeVideo] 获取视频列表失败:', error);

    if (error instanceof Error && error.message === '未提供认证信息') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get video list',
      },
      { status: 500 }
    );
  }
}
