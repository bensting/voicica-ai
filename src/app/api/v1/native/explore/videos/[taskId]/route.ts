/**
 * Native App Public Video Detail API
 *
 * GET /api/v1/native/explore/videos/[taskId]
 * 获取单个公开视频详情并增加浏览量
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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
  try {
    const { taskId } = await params;

    // 查询公开且成功的视频
    const video = await prisma.video_records.findFirst({
      where: {
        task_id: taskId,
        is_public: true,
        status: 'SUCCESS',
      },
      select: {
        id: true,
        task_id: true,
        user_id: true,
        prompt: true,
        model: true,
        resolution: true,
        duration: true,
        aspect_ratio: true,
        video_url: true,
        thumbnail_url: true,
        view_count: true,
        created_at: true,
      },
    });

    if (!video) {
      return NextResponse.json(
        { success: false, error: 'Video not found' },
        { status: 404 }
      );
    }

    // 异步增加浏览量（不等待完成）
    prisma.video_records.update({
      where: { id: video.id },
      data: { view_count: { increment: 1 } },
    }).catch((err) => {
      console.error('Failed to increment view count:', err);
    });

    // 获取用户邮箱
    const user = await prisma.users.findFirst({
      where: { user_id: video.user_id },
      select: { email: true },
    });

    return NextResponse.json({
      success: true,
      video: {
        id: video.id,
        taskId: video.task_id,
        prompt: video.prompt,
        model: video.model,
        resolution: video.resolution,
        duration: video.duration,
        aspectRatio: video.aspect_ratio,
        videoUrl: video.video_url,
        thumbnailUrl: video.thumbnail_url,
        viewCount: video.view_count + 1, // 返回已增加后的数量
        user: maskEmail(user?.email || null),
        createdAt: video.created_at?.toISOString(),
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
