'use server';

/**
 * TTS 记录管理 Server Actions
 */
import { getDb } from '@/lib/db';
import { ttsRecords } from '@/db/schema';
import { eq, and, or, like, desc, count, sum, gte, lte, inArray } from 'drizzle-orm';
import { verifyAdminWithoutDb } from '@/lib/auth-admin';

/**
 * TTS 记录查询参数
 */
interface TtsRecordsQuery {
  page?: number;
  pageSize?: number;
  status?: string;
  userId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  platform?: string;
  isPublic?: boolean;
}

/**
 * TTS 记录列表项
 */
export interface TtsRecordItem {
  id: number;
  taskId: string;
  userId: string;
  text: string;
  voiceName: string;
  language: string | null;
  style: string | null;
  speed: number;
  pitch: number;
  volume: number;
  creditsCost: number;
  characterCount: number;
  status: string;
  progress: number;
  audioUrl: string | null;
  duration: number | null;
  format: string;
  errorMessage: string | null;
  shareId: string | null;
  platform: string | null;
  isPublic: boolean;
  createdAt: string;
  completedAt: string | null;
}

/**
 * 获取 TTS 记录列表
 */
export async function getTtsRecords(query: TtsRecordsQuery = {}) {
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
    platform,
    isPublic,
  } = query;

  // 构建查询条件
  const conditions = [];

  if (status) {
    conditions.push(eq(ttsRecords.status, status));
  }

  if (userId) {
    conditions.push(like(ttsRecords.userId, `%${userId}%`));
  }

  if (search) {
    conditions.push(
      or(
        like(ttsRecords.text, `%${search}%`),
        like(ttsRecords.voiceName, `%${search}%`),
        like(ttsRecords.taskId, `%${search}%`),
      )
    );
  }

  if (startDate) {
    conditions.push(gte(ttsRecords.createdAt, new Date(startDate).toISOString()));
  }
  if (endDate) {
    conditions.push(lte(ttsRecords.createdAt, new Date(endDate + 'T23:59:59.999Z').toISOString()));
  }

  if (platform) {
    conditions.push(eq(ttsRecords.platform, platform));
  }

  if (isPublic !== undefined) {
    conditions.push(eq(ttsRecords.isPublic, isPublic));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [[ { total } ], records] = await Promise.all([
    db.select({ total: count() }).from(ttsRecords).where(whereClause),
    db.select().from(ttsRecords)
      .where(whereClause)
      .orderBy(desc(ttsRecords.createdAt))
      .offset((page - 1) * pageSize)
      .limit(pageSize),
  ]);

  const items: TtsRecordItem[] = records.map((record) => ({
    id: record.id,
    taskId: record.taskId,
    userId: record.userId,
    text: record.text,
    voiceName: record.voiceName,
    language: record.language,
    style: record.style,
    speed: record.speed,
    pitch: record.pitch,
    volume: record.volume,
    creditsCost: record.creditsCost,
    characterCount: record.characterCount,
    status: record.status,
    progress: record.progress,
    audioUrl: record.audioUrl,
    duration: record.duration,
    format: record.format,
    errorMessage: record.errorMessage,
    shareId: record.shareId,
    platform: record.platform,
    isPublic: record.isPublic,
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
 * 获取 TTS 记录统计
 */
export async function getTtsRecordsStats() {
  const db = await getDb();
  await verifyAdminWithoutDb();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();

  const [
    [{ total: totalRecords }],
    [{ total: completedRecords }],
    [{ total: failedRecords }],
    [{ total: pendingRecords }],
    [{ total: todayRecords }],
    [{ total: weekRecords }],
    [{ total: totalCredits }],
    [{ total: totalCharacters }],
  ] = await Promise.all([
    db.select({ total: count() }).from(ttsRecords),
    db.select({ total: count() }).from(ttsRecords).where(eq(ttsRecords.status, 'completed')),
    db.select({ total: count() }).from(ttsRecords).where(eq(ttsRecords.status, 'failed')),
    db.select({ total: count() }).from(ttsRecords).where(or(eq(ttsRecords.status, 'pending'), eq(ttsRecords.status, 'processing'))),
    db.select({ total: count() }).from(ttsRecords).where(gte(ttsRecords.createdAt, todayStart)),
    db.select({ total: count() }).from(ttsRecords).where(gte(ttsRecords.createdAt, weekStart)),
    db.select({ total: sum(ttsRecords.creditsCost) }).from(ttsRecords),
    db.select({ total: sum(ttsRecords.characterCount) }).from(ttsRecords),
  ]);

  return {
    totalRecords: Number(totalRecords),
    completedRecords: Number(completedRecords),
    failedRecords: Number(failedRecords),
    pendingRecords: Number(pendingRecords),
    todayRecords: Number(todayRecords),
    weekRecords: Number(weekRecords),
    totalCredits: Number(totalCredits) || 0,
    totalCharacters: Number(totalCharacters) || 0,
  };
}

/**
 * 删除 TTS 记录
 */
export async function deleteTtsRecord(id: number) {
  const db = await getDb();
  await verifyAdminWithoutDb();

  try {
    await db.delete(ttsRecords).where(eq(ttsRecords.id, id));

    return { success: true, message: '删除成功' };
  } catch (error) {
    console.error('删除 TTS 记录失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '删除失败',
    };
  }
}

/**
 * 批量删除 TTS 记录
 */
export async function deleteTtsRecords(ids: number[]) {
  const db = await getDb();
  await verifyAdminWithoutDb();

  try {
    const result = await db.delete(ttsRecords).where(inArray(ttsRecords.id, ids)).returning();

    return {
      success: true,
      message: `成功删除 ${result.length} 条记录`,
      deleted: result.length,
    };
  } catch (error) {
    console.error('批量删除 TTS 记录失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '删除失败',
    };
  }
}

/**
 * 获取 TTS 记录详情
 */
export async function getTtsRecordDetail(id: number) {
  const db = await getDb();
  await verifyAdminWithoutDb();

  const [record] = await db.select().from(ttsRecords).where(eq(ttsRecords.id, id)).limit(1);

  if (!record) {
    return null;
  }

  return {
    id: record.id,
    taskId: record.taskId,
    userId: record.userId,
    text: record.text,
    voiceName: record.voiceName,
    language: record.language,
    style: record.style,
    speed: record.speed,
    pitch: record.pitch,
    volume: record.volume,
    creditsCost: record.creditsCost,
    characterCount: record.characterCount,
    status: record.status,
    progress: record.progress,
    audioUrl: record.audioUrl,
    duration: record.duration,
    format: record.format,
    errorMessage: record.errorMessage,
    shareId: record.shareId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt || null,
    completedAt: record.completedAt || null,
  };
}

/**
 * 更新 TTS 记录的公开状态
 */
export async function updateTtsRecordPublic(id: number, isPublic: boolean) {
  const db = await getDb();
  await verifyAdminWithoutDb();

  try {
    await db.update(ttsRecords).set({ isPublic }).where(eq(ttsRecords.id, id));

    return { success: true, message: isPublic ? '已设为公开' : '已设为私有' };
  } catch (error) {
    console.error('更新 TTS 记录公开状态失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '更新失败',
    };
  }
}

/**
 * 批量更新 TTS 记录的公开状态
 */
export async function updateTtsRecordsPublic(ids: number[], isPublic: boolean) {
  const db = await getDb();
  await verifyAdminWithoutDb();

  try {
    const result = await db.update(ttsRecords).set({ isPublic }).where(inArray(ttsRecords.id, ids)).returning();

    return {
      success: true,
      message: `成功更新 ${result.length} 条记录`,
      updated: result.length,
    };
  } catch (error) {
    console.error('批量更新 TTS 记录公开状态失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '更新失败',
    };
  }
}
