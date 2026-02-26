'use server';

/**
 * Video 记录管理 Server Actions
 */
import { getDb } from '@/lib/db';
import { videoRecords } from '@/db/schema';
import { eq, and, or, like, desc, count, sum, gte, lte, inArray } from 'drizzle-orm';
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
  const db = await getDb();
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

  const conditions = [];

  if (status) {
    conditions.push(eq(videoRecords.status, status));
  }

  if (model) {
    conditions.push(eq(videoRecords.model, model));
  }

  if (userId) {
    conditions.push(like(videoRecords.userId, `%${userId}%`));
  }

  if (search) {
    conditions.push(
      or(
        like(videoRecords.prompt, `%${search}%`),
        like(videoRecords.taskId, `%${search}%`),
      )
    );
  }

  if (startDate) {
    conditions.push(gte(videoRecords.createdAt, new Date(startDate).toISOString()));
  }
  if (endDate) {
    conditions.push(lte(videoRecords.createdAt, new Date(endDate + 'T23:59:59.999Z').toISOString()));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [[{ total }], records] = await Promise.all([
    db.select({ total: count() }).from(videoRecords).where(whereClause),
    db.select().from(videoRecords)
      .where(whereClause)
      .orderBy(desc(videoRecords.createdAt))
      .offset((page - 1) * pageSize)
      .limit(pageSize),
  ]);

  const items: VideoRecordItem[] = records.map((record) => ({
    id: record.id,
    taskId: record.taskId,
    externalTaskId: record.externalTaskId,
    userId: record.userId,
    taskType: record.taskType,
    model: record.model,
    prompt: record.prompt,
    resolution: record.resolution,
    duration: record.duration,
    aspectRatio: record.aspectRatio,
    isPublic: record.isPublic,
    creditsCost: record.creditsCost,
    status: record.status,
    progress: record.progress,
    videoUrl: record.videoUrl,
    thumbnailUrl: record.thumbnailUrl,
    actualDuration: record.actualDuration,
    errorMessage: record.errorMessage,
    shareId: record.shareId,
    createdAt: record.createdAt,
    completedAt: record.completedAt || null,
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
 * 获取 Video 记录统计
 */
export async function getVideoRecordsStats() {
  const db = await getDb();
  await verifyAdminWithoutDb();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();

  const [
    [{ total: totalRecords }],
    [{ total: successRecords }],
    [{ total: failedRecords }],
    [{ total: processingRecords }],
    [{ total: todayRecords }],
    [{ total: weekRecords }],
    [{ total: totalCredits }],
    [{ total: publicRecords }],
  ] = await Promise.all([
    db.select({ total: count() }).from(videoRecords),
    db.select({ total: count() }).from(videoRecords).where(eq(videoRecords.status, 'SUCCESS')),
    db.select({ total: count() }).from(videoRecords).where(eq(videoRecords.status, 'FAILURE')),
    db.select({ total: count() }).from(videoRecords).where(or(eq(videoRecords.status, 'PENDING'), eq(videoRecords.status, 'PROCESSING'))),
    db.select({ total: count() }).from(videoRecords).where(gte(videoRecords.createdAt, todayStart)),
    db.select({ total: count() }).from(videoRecords).where(gte(videoRecords.createdAt, weekStart)),
    db.select({ total: sum(videoRecords.creditsCost) }).from(videoRecords),
    db.select({ total: count() }).from(videoRecords).where(eq(videoRecords.isPublic, true)),
  ]);

  return {
    totalRecords: Number(totalRecords),
    successRecords: Number(successRecords),
    failedRecords: Number(failedRecords),
    processingRecords: Number(processingRecords),
    todayRecords: Number(todayRecords),
    weekRecords: Number(weekRecords),
    totalCredits: Number(totalCredits) || 0,
    publicRecords: Number(publicRecords),
  };
}

/**
 * 删除 Video 记录
 */
export async function deleteVideoRecord(id: number) {
  const db = await getDb();
  await verifyAdminWithoutDb();

  try {
    await db.delete(videoRecords).where(eq(videoRecords.id, id));
    return { success: true, message: '删除成功' };
  } catch (error) {
    console.error('删除 Video 记录失败:', error);
    return { success: false, message: error instanceof Error ? error.message : '删除失败' };
  }
}

/**
 * 批量删除 Video 记录
 */
export async function deleteVideoRecords(ids: number[]) {
  const db = await getDb();
  await verifyAdminWithoutDb();

  try {
    const result = await db.delete(videoRecords).where(inArray(videoRecords.id, ids)).returning();
    return {
      success: true,
      message: `成功删除 ${result.length} 条记录`,
      deleted: result.length,
    };
  } catch (error) {
    console.error('批量删除 Video 记录失败:', error);
    return { success: false, message: error instanceof Error ? error.message : '删除失败' };
  }
}
