'use server';

/**
 * Image 记录管理 Server Actions
 */
import { getDb } from '@/lib/db';
import { imageRecords } from '@/db/schema';
import { eq, and, or, like, desc, count, sum, gte, lte, inArray } from 'drizzle-orm';
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
    conditions.push(eq(imageRecords.status, status));
  }

  if (model) {
    conditions.push(eq(imageRecords.model, model));
  }

  if (userId) {
    conditions.push(like(imageRecords.userId, `%${userId}%`));
  }

  if (search) {
    conditions.push(
      or(
        like(imageRecords.prompt, `%${search}%`),
        like(imageRecords.taskId, `%${search}%`),
      )
    );
  }

  if (startDate) {
    conditions.push(gte(imageRecords.createdAt, new Date(startDate).toISOString()));
  }
  if (endDate) {
    conditions.push(lte(imageRecords.createdAt, new Date(endDate + 'T23:59:59.999Z').toISOString()));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [[{ total }], records] = await Promise.all([
    db.select({ total: count() }).from(imageRecords).where(whereClause),
    db.select().from(imageRecords)
      .where(whereClause)
      .orderBy(desc(imageRecords.createdAt))
      .offset((page - 1) * pageSize)
      .limit(pageSize),
  ]);

  const items: ImageRecordItem[] = records.map((record) => ({
    id: record.id,
    taskId: record.taskId,
    userId: record.userId,
    model: record.model,
    prompt: record.prompt,
    aspectRatio: record.aspectRatio,
    quality: record.quality,
    isPublic: record.isPublic,
    creditsUsed: record.creditsUsed,
    status: record.status,
    progress: record.progress,
    imageUrl: record.imageUrl,
    error: record.error,
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
 * 获取 Image 记录统计
 */
export async function getImageRecordsStats() {
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
    db.select({ total: count() }).from(imageRecords),
    db.select({ total: count() }).from(imageRecords).where(eq(imageRecords.status, 'SUCCESS')),
    db.select({ total: count() }).from(imageRecords).where(eq(imageRecords.status, 'FAILURE')),
    db.select({ total: count() }).from(imageRecords).where(or(eq(imageRecords.status, 'PENDING'), eq(imageRecords.status, 'PROCESSING'))),
    db.select({ total: count() }).from(imageRecords).where(gte(imageRecords.createdAt, todayStart)),
    db.select({ total: count() }).from(imageRecords).where(gte(imageRecords.createdAt, weekStart)),
    db.select({ total: sum(imageRecords.creditsUsed) }).from(imageRecords),
    db.select({ total: count() }).from(imageRecords).where(eq(imageRecords.isPublic, true)),
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
 * 删除 Image 记录
 */
export async function deleteImageRecord(id: number) {
  const db = await getDb();
  await verifyAdminWithoutDb();

  try {
    await db.delete(imageRecords).where(eq(imageRecords.id, id));
    return { success: true, message: '删除成功' };
  } catch (error) {
    console.error('删除 Image 记录失败:', error);
    return { success: false, message: error instanceof Error ? error.message : '删除失败' };
  }
}

/**
 * 批量删除 Image 记录
 */
export async function deleteImageRecords(ids: number[]) {
  const db = await getDb();
  await verifyAdminWithoutDb();

  try {
    const result = await db.delete(imageRecords).where(inArray(imageRecords.id, ids)).returning();
    return {
      success: true,
      message: `成功删除 ${result.length} 条记录`,
      deleted: result.length,
    };
  } catch (error) {
    console.error('批量删除 Image 记录失败:', error);
    return { success: false, message: error instanceof Error ? error.message : '删除失败' };
  }
}
