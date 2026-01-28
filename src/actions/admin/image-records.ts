'use server';

/**
 * Image 记录管理 Server Actions
 */
import prisma from '@/lib/prisma';
import { verifyAdminWithoutDb } from '@/lib/auth-admin';

/**
 * Image 记录查询参数
 */
interface ImageRecordsQuery {
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
 * Image 记录列表项
 */
export interface ImageRecordItem {
  id: number;
  taskId: string;
  userId: string;
  model: string;
  prompt: string;
  aspectRatio: string;
  quality: string;
  isPublic: boolean;
  creditsUsed: number;
  status: string;
  progress: number;
  imageUrl: string | null;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
}

/**
 * 获取 Image 记录列表
 */
export async function getImageRecords(query: ImageRecordsQuery = {}) {
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
    prisma.image_records.count({ where }),
    prisma.image_records.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const items: ImageRecordItem[] = records.map((record) => ({
    id: record.id,
    taskId: record.task_id,
    userId: record.user_id,
    model: record.model,
    prompt: record.prompt,
    aspectRatio: record.aspect_ratio,
    quality: record.quality,
    isPublic: record.is_public,
    creditsUsed: record.credits_used,
    status: record.status,
    progress: record.progress,
    imageUrl: record.image_url,
    error: record.error,
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
 * 获取 Image 记录统计
 */
export async function getImageRecordsStats() {
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
    prisma.image_records.count(),
    prisma.image_records.count({ where: { status: 'SUCCESS' } }),
    prisma.image_records.count({ where: { status: 'FAILURE' } }),
    prisma.image_records.count({ where: { status: { in: ['PENDING', 'PROCESSING'] } } }),
    prisma.image_records.count({ where: { created_at: { gte: todayStart } } }),
    prisma.image_records.count({ where: { created_at: { gte: weekStart } } }),
    prisma.image_records.aggregate({ _sum: { credits_used: true } }),
    prisma.image_records.count({ where: { is_public: true } }),
  ]);

  return {
    totalRecords,
    successRecords,
    failedRecords,
    processingRecords,
    todayRecords,
    weekRecords,
    totalCredits: totalCredits._sum.credits_used || 0,
    publicRecords,
  };
}

/**
 * 删除 Image 记录
 */
export async function deleteImageRecord(id: number) {
  await verifyAdminWithoutDb();

  try {
    await prisma.image_records.delete({
      where: { id },
    });

    return { success: true, message: '删除成功' };
  } catch (error) {
    console.error('删除 Image 记录失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '删除失败',
    };
  }
}

/**
 * 批量删除 Image 记录
 */
export async function deleteImageRecords(ids: number[]) {
  await verifyAdminWithoutDb();

  try {
    const result = await prisma.image_records.deleteMany({
      where: { id: { in: ids } },
    });

    return {
      success: true,
      message: `成功删除 ${result.count} 条记录`,
      deleted: result.count,
    };
  } catch (error) {
    console.error('批量删除 Image 记录失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '删除失败',
    };
  }
}
