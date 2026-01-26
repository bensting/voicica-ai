/**
 * Native App Video Visibility API
 *
 * PATCH /api/v1/native/video/task/:taskId/visibility
 * 更新视频的公开/私有状态
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserOrAnonymous } from '@/lib/auth-firebase';

interface VisibilityRequest {
  is_public: boolean;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    // 1. 获取用户身份
    const { user_id } = await getUserOrAnonymous();

    // 2. 获取任务 ID
    const { taskId } = await params;

    // 3. 解析请求体
    const body: VisibilityRequest = await req.json();
    const { is_public } = body;

    if (typeof is_public !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'is_public must be a boolean' },
        { status: 400 }
      );
    }

    // 4. 查询任务记录
    const task = await prisma.video_records.findUnique({
      where: { task_id: taskId },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // 5. 验证用户权限（只能修改自己的任务）
    if (task.user_id !== user_id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // 6. 更新可见性
    await prisma.video_records.update({
      where: { task_id: taskId },
      data: { is_public },
    });

    console.log(`🔒 [Video Visibility] ${taskId} -> ${is_public ? 'public' : 'private'}`);

    return NextResponse.json({
      success: true,
      is_public,
    });
  } catch (error) {
    console.error('❌ [Video Visibility] 更新失败:', error);

    if (error instanceof Error && error.message === '未提供认证信息') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update visibility',
      },
      { status: 500 }
    );
  }
}
