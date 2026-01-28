'use server';

/**
 * Video 记录管理 Server Actions
 */
import prisma from '@/lib/prisma';
import { verifyAdminWithoutDb } from '@/lib/auth-admin';

/**
 * Video 记录查询参数
 */
interface VideoRecordsQuery {
  page?: number;
  pageSize?: number;
  status?: string;
  userId?: string;
  search?: string;
  model?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Video 记录列表项
 */
export interface VideoRecordItem {
  id: number;
  taskId: string;
  externalTaskId: string | null;
  userId: string;
  taskType: string;
  model: string;
  prompt: string;
  resolution: string;
  duration: number;
  aspectRatio: string;
  isPublic: boolean;
  creditsCost: number;
  status: string;
  progress: number;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  actualDuration: number | null;
  errorMessage: string | null;
  shareId: string | null;
  createdAt: string;
  completedAt: string | null;
}

/**
 * 获取 Video 记录列表
 */
export async function getVideoRecords(query: VideoRecordsQuery = {}) {
  await verifyAdminWithoutDb();

  const {
    page = 1,
    pageSize = 20,
    status,
    userId,
    search,
    model,
    startDate,
    endDate,
  } = query;

  // 构建查询条件
  const where: Record<string, unknown> = {};

  if (status) {
    where.status = status;
  }

  if (model) {
    where.model = model;
  }

  if (userId) {
    where.user_id = {
      contains: userId,
      mode: 'insensitive',
    };
  }

  if (search) {
    where.OR = [
      { prompt: { contains: search, mode: 'insensitive' } },
      { task_id: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (startDate || endDate) {
    where.created_at = {};
    if (startDate) {
      (where.created_at as Record<string, Date>).gte = new Date(startDate);
    }
    if (endDate) {
      (where.created_at as Record<string, Date>).lte = new Date(endDate + 'T23:59:59.999Z');
    }
  }

  const [total, records] = await Promise.all([
    prisma.video_records.count({ where }),
    prisma.video_records.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const items: VideoRecordItem[] = records.map((record) => ({
    id: record.id,
    taskId: record.task_id,
    externalTaskId: record.external_task_id,
    userId: record.user_id,
    taskType: record.task_type,
    model: record.model,
    prompt: record.prompt,
    resolution: record.resolution,
    duration: record.duration,
    aspectRatio: record.aspect_ratio,
    isPublic: record.is_public,
    creditsCost: record.credits_cost,
    status: record.status,
    progress: record.progress,
    videoUrl: record.video_url,
    thumbnailUrl: record.thumbnail_url,
    actualDuration: record.actual_duration,
    errorMessage: record.error_message,
    shareId: record.share_id,
    createdAt: record.created_at.toISOString(),
    completedAt: record.completed_at?.toISOString() || null,
  }));

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * 获取 Video 记录统计
 */
export async function getVideoRecordsStats() {
  await verifyAdminWithoutDb();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  const [
    totalRecords,
    successRecords,
    failedRecords,
    processingRecords,
    todayRecords,
    weekRecords,
    totalCredits,
    publicRecords,
  ] = await Promise.all([
    prisma.video_records.count(),
    prisma.video_records.count({ where: { status: 'SUCCESS' } }),
    prisma.video_records.count({ where: { status: 'FAILURE' } }),
    prisma.video_records.count({ where: { status: { in: ['PENDING', 'PROCESSING'] } } }),
    prisma.video_records.count({ where: { created_at: { gte: todayStart } } }),
    prisma.video_records.count({ where: { created_at: { gte: weekStart } } }),
    prisma.video_records.aggregate({ _sum: { credits_cost: true } }),
    prisma.video_records.count({ where: { is_public: true } }),
  ]);

  return {
    totalRecords,
    successRecords,
    failedRecords,
    processingRecords,
    todayRecords,
    weekRecords,
    totalCredits: totalCredits._sum.credits_cost || 0,
    publicRecords,
  };
}

/**
 * 删除 Video 记录
 */
export async function deleteVideoRecord(id: number) {
  await verifyAdminWithoutDb();

  try {
    await prisma.video_records.delete({
      where: { id },
    });

    return { success: true, message: '删除成功' };
  } catch (error) {
    console.error('删除 Video 记录失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '删除失败',
    };
  }
}

/**
 * 批量删除 Video 记录
 */
export async function deleteVideoRecords(ids: number[]) {
  await verifyAdminWithoutDb();

  try {
    const result = await prisma.video_records.deleteMany({
      where: { id: { in: ids } },
    });

    return {
      success: true,
      message: `成功删除 ${result.count} 条记录`,
      deleted: result.count,
    };
  } catch (error) {
    console.error('批量删除 Video 记录失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '删除失败',
    };
  }
}
