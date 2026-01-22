/**
 * Native App Video Task Status API
 *
 * GET /api/v1/native/video/task/:taskId
 * 获取视频任务状态
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserOrAnonymous } from '@/lib/auth-firebase';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    // 1. 获取用户身份
    const { user_id } = await getUserOrAnonymous();

    // 2. 获取任务 ID
    const { taskId } = await params;

    // 3. 查询任务记录
    const task = await prisma.video_records.findUnique({
      where: { task_id: taskId },
      select: {
        task_id: true,
        user_id: true,
        status: true,
        progress: true,
        prompt: true,
        model: true,
        resolution: true,
        duration: true,
        aspect_ratio: true,
        video_url: true,
        error_message: true,
        created_at: true,
        completed_at: true,
      },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // 4. 验证用户权限（只能查看自己的任务）
    if (task.user_id !== user_id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      task: {
        task_id: task.task_id,
        status: task.status,
        progress: task.progress,
        prompt: task.prompt,
        model: task.model,
        resolution: task.resolution,
        duration: task.duration,
        aspect_ratio: task.aspect_ratio,
        video_url: task.video_url,
        error_message: task.error_message,
        created_at: task.created_at?.toISOString(),
        completed_at: task.completed_at?.toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ [NativeVideo] 获取任务状态失败:', error);

    if (error instanceof Error && error.message === '未提供认证信息') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get task status',
      },
      { status: 500 }
    );
  }
}
