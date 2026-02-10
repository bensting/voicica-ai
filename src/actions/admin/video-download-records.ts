'use server';

/**
 * Video 下载记录管理 Server Actions
 */
import prisma from '@/lib/prisma';
import { verifyAdminWithoutDb } from '@/lib/auth-admin';

/**
 * 查询参数
 */
interface VideoDownloadRecordsQuery {
  page?: number;
  pageSize?: number;
  status?: string;
  platform?: string;
  userId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * 列表项
 */
export interface VideoDownloadRecordItem {
  id: number;
  userId: string;
  url: string;
  platform: string | null;
  videoTitle: string | null;
  videoAuthor: string | null;
  status: string;
  errorCode: string | null;
  creditsCost: number;
  isAnonymous: boolean;
  createdAt: string;
}

/**
 * 获取下载记录列表
 */
export async function getVideoDownloadRecords(query: VideoDownloadRecordsQuery = {}) {
  await verifyAdminWithoutDb();

  const {
    page = 1,
    pageSize = 20,
    status,
    platform,
    userId,
    search,
    startDate,
    endDate,
  } = query;

  const where: Record<string, unknown> = {};

  if (status) {
    where.status = status;
  }

  if (platform) {
    where.platform = platform;
  }

  if (userId) {
    where.user_id = {
      contains: userId,
      mode: 'insensitive',
    };
  }

  if (search) {
    where.OR = [
      { url: { contains: search, mode: 'insensitive' } },
      { video_title: { contains: search, mode: 'insensitive' } },
      { video_author: { contains: search, mode: 'insensitive' } },
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
    prisma.video_download_records.count({ where }),
    prisma.video_download_records.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const items: VideoDownloadRecordItem[] = records.map((record) => ({
    id: record.id,
    userId: record.user_id,
    url: record.url,
    platform: record.platform,
    videoTitle: record.video_title,
    videoAuthor: record.video_author,
    status: record.status,
    errorCode: record.error_code,
    creditsCost: record.credits_cost,
    isAnonymous: record.is_anonymous,
    createdAt: record.created_at.toISOString(),
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
 * 获取统计数据
 */
export async function getVideoDownloadRecordsStats() {
  await verifyAdminWithoutDb();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  const [
    totalRecords,
    successRecords,
    failedRecords,
    todayRecords,
    weekRecords,
    totalCredits,
  ] = await Promise.all([
    prisma.video_download_records.count(),
    prisma.video_download_records.count({ where: { status: 'SUCCESS' } }),
    prisma.video_download_records.count({ where: { status: 'FAILURE' } }),
    prisma.video_download_records.count({ where: { created_at: { gte: todayStart } } }),
    prisma.video_download_records.count({ where: { created_at: { gte: weekStart } } }),
    prisma.video_download_records.aggregate({ _sum: { credits_cost: true } }),
  ]);

  return {
    totalRecords,
    successRecords,
    failedRecords,
    todayRecords,
    weekRecords,
    totalCredits: totalCredits._sum.credits_cost || 0,
  };
}

/**
 * 删除单条记录
 */
export async function deleteVideoDownloadRecord(id: number) {
  await verifyAdminWithoutDb();

  try {
    await prisma.video_download_records.delete({
      where: { id },
    });

    return { success: true, message: '删除成功' };
  } catch (error) {
    console.error('删除下载记录失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '删除失败',
    };
  }
}

/**
 * 批量删除记录
 */
export async function deleteVideoDownloadRecords(ids: number[]) {
  await verifyAdminWithoutDb();

  try {
    const result = await prisma.video_download_records.deleteMany({
      where: { id: { in: ids } },
    });

    return {
      success: true,
      message: `成功删除 ${result.count} 条记录`,
      deleted: result.count,
    };
  } catch (error) {
    console.error('批量删除下载记录失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '删除失败',
    };
  }
}
