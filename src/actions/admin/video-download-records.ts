'use server';

/**
 * Video 下载记录管理 Server Actions
 */
import { getDb } from '@/lib/db';
import { videoDownloadRecords } from '@/db/schema';
import { eq, and, or, like, desc, count, sum, gte, lte, inArray } from 'drizzle-orm';
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
  const db = await getDb();
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

  const conditions = [];

  if (status) {
    conditions.push(eq(videoDownloadRecords.status, status));
  }

  if (platform) {
    conditions.push(eq(videoDownloadRecords.platform, platform));
  }

  if (userId) {
    conditions.push(like(videoDownloadRecords.userId, `%${userId}%`));
  }

  if (search) {
    conditions.push(
      or(
        like(videoDownloadRecords.url, `%${search}%`),
        like(videoDownloadRecords.videoTitle, `%${search}%`),
        like(videoDownloadRecords.videoAuthor, `%${search}%`),
      )
    );
  }

  if (startDate) {
    conditions.push(gte(videoDownloadRecords.createdAt, new Date(startDate).toISOString()));
  }
  if (endDate) {
    conditions.push(lte(videoDownloadRecords.createdAt, new Date(endDate + 'T23:59:59.999Z').toISOString()));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [[{ total }], records] = await Promise.all([
    db.select({ total: count() }).from(videoDownloadRecords).where(whereClause),
    db.select().from(videoDownloadRecords)
      .where(whereClause)
      .orderBy(desc(videoDownloadRecords.createdAt))
      .offset((page - 1) * pageSize)
      .limit(pageSize),
  ]);

  const items: VideoDownloadRecordItem[] = records.map((record) => ({
    id: record.id,
    userId: record.userId,
    url: record.url,
    platform: record.platform,
    videoTitle: record.videoTitle,
    videoAuthor: record.videoAuthor,
    status: record.status,
    errorCode: record.errorCode,
    creditsCost: record.creditsCost,
    isAnonymous: record.isAnonymous,
    createdAt: record.createdAt,
  }));

  return {
    items,
    total: Number(total),
    page,
    pageSize,
    totalPages: Math.ceil(Number(total) / pageSize),
  };
}

/**
 * 获取统计数据
 */
export async function getVideoDownloadRecordsStats() {
  const db = await getDb();
  await verifyAdminWithoutDb();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();

  const [
    [{ total: totalRecords }],
    [{ total: successRecords }],
    [{ total: failedRecords }],
    [{ total: todayRecords }],
    [{ total: weekRecords }],
    [{ total: totalCredits }],
  ] = await Promise.all([
    db.select({ total: count() }).from(videoDownloadRecords),
    db.select({ total: count() }).from(videoDownloadRecords).where(eq(videoDownloadRecords.status, 'SUCCESS')),
    db.select({ total: count() }).from(videoDownloadRecords).where(eq(videoDownloadRecords.status, 'FAILURE')),
    db.select({ total: count() }).from(videoDownloadRecords).where(gte(videoDownloadRecords.createdAt, todayStart)),
    db.select({ total: count() }).from(videoDownloadRecords).where(gte(videoDownloadRecords.createdAt, weekStart)),
    db.select({ total: sum(videoDownloadRecords.creditsCost) }).from(videoDownloadRecords),
  ]);

  return {
    totalRecords: Number(totalRecords),
    successRecords: Number(successRecords),
    failedRecords: Number(failedRecords),
    todayRecords: Number(todayRecords),
    weekRecords: Number(weekRecords),
    totalCredits: Number(totalCredits) || 0,
  };
}

/**
 * 删除单条记录
 */
export async function deleteVideoDownloadRecord(id: number) {
  const db = await getDb();
  await verifyAdminWithoutDb();

  try {
    await db.delete(videoDownloadRecords).where(eq(videoDownloadRecords.id, id));
    return { success: true, message: '删除成功' };
  } catch (error) {
    console.error('删除下载记录失败:', error);
    return { success: false, message: error instanceof Error ? error.message : '删除失败' };
  }
}

/**
 * 批量删除记录
 */
export async function deleteVideoDownloadRecords(ids: number[]) {
  const db = await getDb();
  await verifyAdminWithoutDb();

  try {
    const result = await db.delete(videoDownloadRecords).where(inArray(videoDownloadRecords.id, ids)).returning();
    return {
      success: true,
      message: `成功删除 ${result.length} 条记录`,
      deleted: result.length,
    };
  } catch (error) {
    console.error('批量删除下载记录失败:', error);
    return { success: false, message: error instanceof Error ? error.message : '删除失败' };
  }
}
