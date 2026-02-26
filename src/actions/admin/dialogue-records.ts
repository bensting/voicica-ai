'use server';

/**
 * Dialogue 记录管理 Server Actions
 */
import { getDb } from '@/lib/db';
import { dialogueRecords } from '@/db/schema';
import { eq, and, or, like, desc, count, sum, gte, lte, inArray } from 'drizzle-orm';
import { verifyAdminWithoutDb } from '@/lib/auth-admin';

/**
 * Dialogue 记录查询参数
 */
interface DialogueRecordsQuery {
  page?: number;
  pageSize?: number;
  status?: string;
  userId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  isPublic?: boolean;
}

/**
 * Dialogue 记录列表项
 */
export interface DialogueRecordItem {
  id: number;
  taskId: string;
  externalTaskId: string | null;
  userId: string;
  dialogueJson: string;
  totalCharacters: number;
  creditsCost: number;
  status: string;
  progress: number;
  audioUrl: string | null;
  duration: number | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
  isPublic: boolean;
}

/**
 * 获取 Dialogue 记录列表
 */
export async function getDialogueRecords(query: DialogueRecordsQuery = {}) {
  const db = await getDb();
  await verifyAdminWithoutDb();

  const {
    page = 1,
    pageSize = 20,
    status,
    userId,
    search,
    startDate,
    endDate,
    isPublic,
  } = query;

  const conditions = [];

  if (status) {
    conditions.push(eq(dialogueRecords.status, status));
  }

  if (userId) {
    conditions.push(like(dialogueRecords.userId, `%${userId}%`));
  }

  if (search) {
    conditions.push(
      or(
        like(dialogueRecords.dialogueJson, `%${search}%`),
        like(dialogueRecords.taskId, `%${search}%`),
      )
    );
  }

  if (startDate) {
    conditions.push(gte(dialogueRecords.createdAt, new Date(startDate).toISOString()));
  }
  if (endDate) {
    conditions.push(lte(dialogueRecords.createdAt, new Date(endDate + 'T23:59:59.999Z').toISOString()));
  }

  if (isPublic !== undefined) {
    conditions.push(eq(dialogueRecords.isPublic, isPublic));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [[{ total }], records] = await Promise.all([
    db.select({ total: count() }).from(dialogueRecords).where(whereClause),
    db.select().from(dialogueRecords)
      .where(whereClause)
      .orderBy(desc(dialogueRecords.createdAt))
      .offset((page - 1) * pageSize)
      .limit(pageSize),
  ]);

  const items: DialogueRecordItem[] = records.map((record) => ({
    id: record.id,
    taskId: record.taskId,
    externalTaskId: record.externalTaskId,
    userId: record.userId,
    dialogueJson: record.dialogueJson,
    totalCharacters: record.totalCharacters,
    creditsCost: record.creditsCost,
    status: record.status,
    progress: record.progress,
    audioUrl: record.audioUrl,
    duration: record.duration,
    errorMessage: record.errorMessage,
    createdAt: record.createdAt,
    completedAt: record.completedAt || null,
    isPublic: record.isPublic,
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
 * 获取 Dialogue 记录统计
 */
export async function getDialogueRecordsStats() {
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
    [{ total: totalCharacters }],
  ] = await Promise.all([
    db.select({ total: count() }).from(dialogueRecords),
    db.select({ total: count() }).from(dialogueRecords).where(eq(dialogueRecords.status, 'SUCCESS')),
    db.select({ total: count() }).from(dialogueRecords).where(eq(dialogueRecords.status, 'FAILURE')),
    db.select({ total: count() }).from(dialogueRecords).where(or(eq(dialogueRecords.status, 'PENDING'), eq(dialogueRecords.status, 'PROCESSING'))),
    db.select({ total: count() }).from(dialogueRecords).where(gte(dialogueRecords.createdAt, todayStart)),
    db.select({ total: count() }).from(dialogueRecords).where(gte(dialogueRecords.createdAt, weekStart)),
    db.select({ total: sum(dialogueRecords.creditsCost) }).from(dialogueRecords),
    db.select({ total: sum(dialogueRecords.totalCharacters) }).from(dialogueRecords),
  ]);

  return {
    totalRecords: Number(totalRecords),
    successRecords: Number(successRecords),
    failedRecords: Number(failedRecords),
    processingRecords: Number(processingRecords),
    todayRecords: Number(todayRecords),
    weekRecords: Number(weekRecords),
    totalCredits: Number(totalCredits) || 0,
    totalCharacters: Number(totalCharacters) || 0,
  };
}

/**
 * 删除 Dialogue 记录
 */
export async function deleteDialogueRecord(id: number) {
  const db = await getDb();
  await verifyAdminWithoutDb();

  try {
    await db.delete(dialogueRecords).where(eq(dialogueRecords.id, id));
    return { success: true, message: '删除成功' };
  } catch (error) {
    console.error('删除 Dialogue 记录失败:', error);
    return { success: false, message: error instanceof Error ? error.message : '删除失败' };
  }
}

/**
 * 批量删除 Dialogue 记录
 */
export async function deleteDialogueRecords(ids: number[]) {
  const db = await getDb();
  await verifyAdminWithoutDb();

  try {
    const result = await db.delete(dialogueRecords).where(inArray(dialogueRecords.id, ids)).returning();
    return {
      success: true,
      message: `成功删除 ${result.length} 条记录`,
      deleted: result.length,
    };
  } catch (error) {
    console.error('批量删除 Dialogue 记录失败:', error);
    return { success: false, message: error instanceof Error ? error.message : '删除失败' };
  }
}

/**
 * 更新 Dialogue 记录公开状态
 */
export async function updateDialogueRecordPublic(id: number, isPublic: boolean) {
  const db = await getDb();
  await verifyAdminWithoutDb();

  try {
    await db.update(dialogueRecords).set({ isPublic }).where(eq(dialogueRecords.id, id));
    return { success: true, message: isPublic ? '已设为公开' : '已设为私有' };
  } catch (error) {
    console.error('更新 Dialogue 记录公开状态失败:', error);
    return { success: false, message: error instanceof Error ? error.message : '更新失败' };
  }
}

/**
 * 批量更新 Dialogue 记录公开状态
 */
export async function updateDialogueRecordsPublic(ids: number[], isPublic: boolean) {
  const db = await getDb();
  await verifyAdminWithoutDb();

  try {
    const result = await db.update(dialogueRecords).set({ isPublic }).where(inArray(dialogueRecords.id, ids)).returning();
    return {
      success: true,
      message: `成功更新 ${result.length} 条记录`,
      updated: result.length,
    };
  } catch (error) {
    console.error('批量更新 Dialogue 记录公开状态失败:', error);
    return { success: false, message: error instanceof Error ? error.message : '更新失败' };
  }
}
