/**
 * Native App Video List API
 *
 * GET /api/v1/native/video/list
 * 获取用户的视频列表
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserOrAnonymous } from '@/lib/auth-firebase';

export async function GET(req: NextRequest) {
  try {
    // 1. 获取用户身份
    const { user_id } = await getUserOrAnonymous();

    // 2. 获取分页参数
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // 3. 查询视频列表（按创建时间倒序）
    const [videos, total] = await Promise.all([
      prisma.video_records.findMany({
        where: { user_id },
        select: {
          task_id: true,
          status: true,
          progress: true,
          prompt: true,
          model: true,
          resolution: true,
          duration: true,
          aspect_ratio: true,
          video_url: true,
          thumbnail_url: true,
          error_message: true,
          created_at: true,
          completed_at: true,
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.video_records.count({
        where: { user_id },
      }),
    ]);

    return NextResponse.json({
      success: true,
      videos: videos.map((v) => ({
        taskId: v.task_id,
        status: v.status,
        progress: v.progress,
        prompt: v.prompt,
        model: v.model,
        resolution: v.resolution,
        duration: v.duration,
        aspectRatio: v.aspect_ratio,
        videoUrl: v.video_url,
        thumbnailUrl: v.thumbnail_url,
        errorMessage: v.error_message,
        createdAt: v.created_at?.toISOString(),
        completedAt: v.completed_at?.toISOString(),
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
