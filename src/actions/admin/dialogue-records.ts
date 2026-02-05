'use server';

/**
 * Dialogue 记录管理 Server Actions
 */
import prisma from '@/lib/prisma';
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

  // 构建查询条件
  const where: Record<string, unknown> = {};

  if (status) {
    where.status = status;
  }

  if (userId) {
    where.user_id = {
      contains: userId,
      mode: 'insensitive',
    };
  }

  if (search) {
    where.OR = [
      { dialogue_json: { contains: search, mode: 'insensitive' } },
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

  if (isPublic !== undefined) {
    where.is_public = isPublic;
  }

  const [total, records] = await Promise.all([
    prisma.dialogue_records.count({ where }),
    prisma.dialogue_records.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const items: DialogueRecordItem[] = records.map((record) => ({
    id: record.id,
    taskId: record.task_id,
    externalTaskId: record.external_task_id,
    userId: record.user_id,
    dialogueJson: record.dialogue_json,
    totalCharacters: record.total_characters,
    creditsCost: record.credits_cost,
    status: record.status,
    progress: record.progress,
    audioUrl: record.audio_url,
    duration: record.duration,
    errorMessage: record.error_message,
    createdAt: record.created_at.toISOString(),
    completedAt: record.completed_at?.toISOString() || null,
    isPublic: record.is_public,
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
 * 获取 Dialogue 记录统计
 */
export async function getDialogueRecordsStats() {
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
    totalCharacters,
  ] = await Promise.all([
    prisma.dialogue_records.count(),
    prisma.dialogue_records.count({ where: { status: 'SUCCESS' } }),
    prisma.dialogue_records.count({ where: { status: 'FAILURE' } }),
    prisma.dialogue_records.count({ where: { status: { in: ['PENDING', 'PROCESSING'] } } }),
    prisma.dialogue_records.count({ where: { created_at: { gte: todayStart } } }),
    prisma.dialogue_records.count({ where: { created_at: { gte: weekStart } } }),
    prisma.dialogue_records.aggregate({ _sum: { credits_cost: true } }),
    prisma.dialogue_records.aggregate({ _sum: { total_characters: true } }),
  ]);

  return {
    totalRecords,
    successRecords,
    failedRecords,
    processingRecords,
    todayRecords,
    weekRecords,
    totalCredits: totalCredits._sum.credits_cost || 0,
    totalCharacters: totalCharacters._sum.total_characters || 0,
  };
}

/**
 * 删除 Dialogue 记录
 */
export async function deleteDialogueRecord(id: number) {
  await verifyAdminWithoutDb();

  try {
    await prisma.dialogue_records.delete({
      where: { id },
    });

    return { success: true, message: '删除成功' };
  } catch (error) {
    console.error('删除 Dialogue 记录失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '删除失败',
    };
  }
}

/**
 * 批量删除 Dialogue 记录
 */
export async function deleteDialogueRecords(ids: number[]) {
  await verifyAdminWithoutDb();

  try {
    const result = await prisma.dialogue_records.deleteMany({
      where: { id: { in: ids } },
    });

    return {
      success: true,
      message: `成功删除 ${result.count} 条记录`,
      deleted: result.count,
    };
  } catch (error) {
    console.error('批量删除 Dialogue 记录失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '删除失败',
    };
  }
}

/**
 * 更新 Dialogue 记录公开状态
 */
export async function updateDialogueRecordPublic(id: number, isPublic: boolean) {
  await verifyAdminWithoutDb();

  try {
    await prisma.dialogue_records.update({
      where: { id },
      data: { is_public: isPublic },
    });

    return { success: true, message: isPublic ? '已设为公开' : '已设为私有' };
  } catch (error) {
    console.error('更新 Dialogue 记录公开状态失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '更新失败',
    };
  }
}

/**
 * 批量更新 Dialogue 记录公开状态
 */
export async function updateDialogueRecordsPublic(ids: number[], isPublic: boolean) {
  await verifyAdminWithoutDb();

  try {
    const result = await prisma.dialogue_records.updateMany({
      where: { id: { in: ids } },
      data: { is_public: isPublic },
    });

    return {
      success: true,
      message: `成功更新 ${result.count} 条记录`,
      updated: result.count,
    };
  } catch (error) {
    console.error('批量更新 Dialogue 记录公开状态失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '更新失败',
    };
  }
}
