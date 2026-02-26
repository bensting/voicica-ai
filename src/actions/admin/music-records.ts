'use server';

/**
 * Music 记录管理 Server Actions
 */
import { getDb } from '@/lib/db';
import { musicRecords } from '@/db/schema';
import { eq, and, or, like, desc, count, sum, gte, lte, inArray } from 'drizzle-orm';
import { verifyAdminWithoutDb } from '@/lib/auth-admin';

/**
 * Music 记录查询参数
 */
interface MusicRecordsQuery {
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
 * Music 记录列表项
 */
export interface MusicRecordItem {
  id: number;
  taskId: string;
  externalTaskId: string | null;
  userId: string;
  model: string;
  prompt: string;
  style: string | null;
  title: string | null;
  lyrics: string | null;
  isInstrumental: boolean;
  isPublic: boolean;
  creditsCost: number;
  status: string;
  progress: number;
  audioUrl: string | null;
  audioUrl2: string | null;
  coverUrl: string | null;
  coverUrl2: string | null;
  duration: number | null;
  duration2: number | null;
  tags: string | null;
  errorMessage: string | null;
  shareId: string | null;
  createdAt: string;
  completedAt: string | null;
}

/**
 * 获取 Music 记录列表
 */
export async function getMusicRecords(query: MusicRecordsQuery = {}) {
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
    conditions.push(eq(musicRecords.status, status));
  }

  if (model) {
    conditions.push(eq(musicRecords.model, model));
  }

  if (userId) {
    conditions.push(like(musicRecords.userId, `%${userId}%`));
  }

  if (search) {
    conditions.push(
      or(
        like(musicRecords.prompt, `%${search}%`),
        like(musicRecords.title, `%${search}%`),
        like(musicRecords.lyrics, `%${search}%`),
        like(musicRecords.taskId, `%${search}%`),
      )
    );
  }

  if (startDate) {
    conditions.push(gte(musicRecords.createdAt, new Date(startDate).toISOString()));
  }
  if (endDate) {
    conditions.push(lte(musicRecords.createdAt, new Date(endDate + 'T23:59:59.999Z').toISOString()));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [[{ total }], records] = await Promise.all([
    db.select({ total: count() }).from(musicRecords).where(whereClause),
    db.select().from(musicRecords)
      .where(whereClause)
      .orderBy(desc(musicRecords.createdAt))
      .offset((page - 1) * pageSize)
      .limit(pageSize),
  ]);

  const items: MusicRecordItem[] = records.map((record) => ({
    id: record.id,
    taskId: record.taskId,
    externalTaskId: record.externalTaskId,
    userId: record.userId,
    model: record.model,
    prompt: record.prompt,
    style: record.style,
    title: record.title,
    lyrics: record.lyrics,
    isInstrumental: record.isInstrumental,
    isPublic: record.isPublic,
    creditsCost: record.creditsCost,
    status: record.status,
    progress: record.progress,
    audioUrl: record.audioUrl,
    audioUrl2: record.audioUrl2,
    coverUrl: record.coverUrl,
    coverUrl2: record.coverUrl2,
    duration: record.duration,
    duration2: record.duration2,
    tags: record.tags,
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
 * 获取 Music 记录统计
 */
export async function getMusicRecordsStats() {
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
    db.select({ total: count() }).from(musicRecords),
    db.select({ total: count() }).from(musicRecords).where(eq(musicRecords.status, 'SUCCESS')),
    db.select({ total: count() }).from(musicRecords).where(eq(musicRecords.status, 'FAILURE')),
    db.select({ total: count() }).from(musicRecords).where(or(eq(musicRecords.status, 'PENDING'), eq(musicRecords.status, 'PROCESSING'))),
    db.select({ total: count() }).from(musicRecords).where(gte(musicRecords.createdAt, todayStart)),
    db.select({ total: count() }).from(musicRecords).where(gte(musicRecords.createdAt, weekStart)),
    db.select({ total: sum(musicRecords.creditsCost) }).from(musicRecords),
    db.select({ total: count() }).from(musicRecords).where(eq(musicRecords.isPublic, true)),
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
 * 删除 Music 记录
 */
export async function deleteMusicRecord(id: number) {
  const db = await getDb();
  await verifyAdminWithoutDb();

  try {
    await db.delete(musicRecords).where(eq(musicRecords.id, id));
    return { success: true, message: '删除成功' };
  } catch (error) {
    console.error('删除 Music 记录失败:', error);
    return { success: false, message: error instanceof Error ? error.message : '删除失败' };
  }
}

/**
 * 批量删除 Music 记录
 */
export async function deleteMusicRecords(ids: number[]) {
  const db = await getDb();
  await verifyAdminWithoutDb();

  try {
    const result = await db.delete(musicRecords).where(inArray(musicRecords.id, ids)).returning();
    return {
      success: true,
      message: `成功删除 ${result.length} 条记录`,
      deleted: result.length,
    };
  } catch (error) {
    console.error('批量删除 Music 记录失败:', error);
    return { success: false, message: error instanceof Error ? error.message : '删除失败' };
  }
}

// KIE API 配置
const KIE_API_BASE = 'https://api.kie.ai/api/v1';
const KIE_API_KEY = process.env.KIE_API_KEY || '';

/**
 * 刷新 Music 记录状态（调用 KIE API 查询最新状态）
 * Admin 专用版本，无超时限制
 */
export async function refreshMusicRecordStatus(id: number) {
  const db = await getDb();
  await verifyAdminWithoutDb();

  try {
    const [record] = await db.select().from(musicRecords).where(eq(musicRecords.id, id)).limit(1);

    if (!record) {
      return { success: false, message: '记录不存在' };
    }

    if (record.status !== 'PENDING' && record.status !== 'PROCESSING') {
      return { success: false, message: '只能刷新处理中的任务' };
    }

    if (!record.externalTaskId) {
      return { success: false, message: '没有外部任务 ID，无法查询' };
    }

    console.log(`🎵 [Admin] 刷新任务状态: ${record.externalTaskId}`);

    const response = await fetch(`${KIE_API_BASE}/generate/record-info?taskId=${record.externalTaskId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${KIE_API_KEY}` },
    });

    const result = await response.json();
    console.log('🎵 [Admin] KIE API 响应:', JSON.stringify(result, null, 2));

    if (result.code !== 200) {
      return {
        success: true,
        message: `API 返回: ${result.msg || '任务仍在处理中'}`,
        status: 'PROCESSING',
        progress: record.progress,
      };
    }

    const data = result.data;
    const kieStatus = data?.status;
    const sunoData = data?.response?.sunoData;

    if (kieStatus === 'SUCCESS' && sunoData && Array.isArray(sunoData) && sunoData.length > 0) {
      const firstTrack = sunoData[0];
      const secondTrack = sunoData.length > 1 ? sunoData[1] : null;

      await db.update(musicRecords).set({
        status: 'SUCCESS',
        progress: 100,
        audioUrl: firstTrack.audioUrl || null,
        streamUrl: firstTrack.streamAudioUrl || null,
        coverUrl: firstTrack.imageUrl || null,
        duration: firstTrack.duration || null,
        title: firstTrack.title || record.title,
        tags: firstTrack.tags || null,
        lyrics: firstTrack.prompt || record.lyrics,
        audioUrl2: secondTrack?.audioUrl || null,
        streamUrl2: secondTrack?.streamAudioUrl || null,
        coverUrl2: secondTrack?.imageUrl || null,
        duration2: secondTrack?.duration || null,
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).where(eq(musicRecords.id, id));

      return { success: true, message: '任务已完成', status: 'SUCCESS', progress: 100 };
    }

    let newProgress = record.progress;
    if (kieStatus === 'FIRST_SUCCESS') newProgress = 70;
    else if (kieStatus === 'TEXT_SUCCESS') newProgress = 40;
    else if (kieStatus === 'PENDING') newProgress = 30;

    if (newProgress !== record.progress) {
      await db.update(musicRecords).set({ progress: newProgress, updatedAt: new Date().toISOString() }).where(eq(musicRecords.id, id));
    }

    return {
      success: true,
      message: `KIE 状态: ${kieStatus}, 进度: ${newProgress}%`,
      status: 'PROCESSING',
      progress: newProgress,
    };
  } catch (error) {
    console.error('🎵 [Admin] 刷新 Music 记录状态失败:', error);
    return { success: false, message: error instanceof Error ? error.message : '刷新失败' };
  }
}

/**
 * 获取 Music 记录详情
 */
export async function getMusicRecordDetail(id: number) {
  const db = await getDb();
  await verifyAdminWithoutDb();

  const [record] = await db.select().from(musicRecords).where(eq(musicRecords.id, id)).limit(1);

  if (!record) {
    return null;
  }

  return {
    id: record.id,
    taskId: record.taskId,
    externalTaskId: record.externalTaskId,
    userId: record.userId,
    model: record.model,
    prompt: record.prompt,
    style: record.style,
    title: record.title,
    lyrics: record.lyrics,
    isInstrumental: record.isInstrumental,
    isPublic: record.isPublic,
    creditsCost: record.creditsCost,
    status: record.status,
    progress: record.progress,
    audioUrl: record.audioUrl,
    audioUrl2: record.audioUrl2,
    streamUrl: record.streamUrl,
    streamUrl2: record.streamUrl2,
    coverUrl: record.coverUrl,
    coverUrl2: record.coverUrl2,
    duration: record.duration,
    duration2: record.duration2,
    tags: record.tags,
    errorMessage: record.errorMessage,
    shareId: record.shareId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt || null,
    completedAt: record.completedAt || null,
  };
}
