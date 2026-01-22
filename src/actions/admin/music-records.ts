'use server';

/**
 * Music 记录管理 Server Actions
 */
import prisma from '@/lib/prisma';
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
      { title: { contains: search, mode: 'insensitive' } },
      { lyrics: { contains: search, mode: 'insensitive' } },
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
    prisma.music_records.count({ where }),
    prisma.music_records.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const items: MusicRecordItem[] = records.map((record) => ({
    id: record.id,
    taskId: record.task_id,
    externalTaskId: record.external_task_id,
    userId: record.user_id,
    model: record.model,
    prompt: record.prompt,
    style: record.style,
    title: record.title,
    lyrics: record.lyrics,
    isInstrumental: record.is_instrumental,
    isPublic: record.is_public,
    creditsCost: record.credits_cost,
    status: record.status,
    progress: record.progress,
    audioUrl: record.audio_url,
    audioUrl2: record.audio_url_2,
    coverUrl: record.cover_url,
    coverUrl2: record.cover_url_2,
    duration: record.duration,
    duration2: record.duration_2,
    tags: record.tags,
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
 * 获取 Music 记录统计
 */
export async function getMusicRecordsStats() {
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
    prisma.music_records.count(),
    prisma.music_records.count({ where: { status: 'SUCCESS' } }),
    prisma.music_records.count({ where: { status: 'FAILURE' } }),
    prisma.music_records.count({ where: { status: { in: ['PENDING', 'PROCESSING'] } } }),
    prisma.music_records.count({ where: { created_at: { gte: todayStart } } }),
    prisma.music_records.count({ where: { created_at: { gte: weekStart } } }),
    prisma.music_records.aggregate({ _sum: { credits_cost: true } }),
    prisma.music_records.count({ where: { is_public: true } }),
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
 * 删除 Music 记录
 */
export async function deleteMusicRecord(id: number) {
  await verifyAdminWithoutDb();

  try {
    await prisma.music_records.delete({
      where: { id },
    });

    return { success: true, message: '删除成功' };
  } catch (error) {
    console.error('删除 Music 记录失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '删除失败',
    };
  }
}

/**
 * 批量删除 Music 记录
 */
export async function deleteMusicRecords(ids: number[]) {
  await verifyAdminWithoutDb();

  try {
    const result = await prisma.music_records.deleteMany({
      where: { id: { in: ids } },
    });

    return {
      success: true,
      message: `成功删除 ${result.count} 条记录`,
      deleted: result.count,
    };
  } catch (error) {
    console.error('批量删除 Music 记录失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '删除失败',
    };
  }
}

/**
 * 刷新 Music 记录状态（调用 KIE API 查询最新状态）
 */
export async function refreshMusicRecordStatus(id: number) {
  await verifyAdminWithoutDb();

  // 动态导入，避免循环依赖
  const { getMusicTaskStatus } = await import('@/actions/music');

  try {
    const record = await prisma.music_records.findUnique({
      where: { id },
    });

    if (!record) {
      return { success: false, message: '记录不存在' };
    }

    if (record.status !== 'PENDING' && record.status !== 'PROCESSING') {
      return { success: false, message: '只能刷新处理中的任务' };
    }

    if (!record.external_task_id) {
      return { success: false, message: '没有外部任务 ID，无法查询' };
    }

    // 调用现有的 getMusicTaskStatus 方法查询 KIE API
    // 注意：这个方法内部会自动更新数据库
    const status = await getMusicTaskStatus(record.task_id);

    return {
      success: true,
      message: `状态已更新: ${status.status}`,
      status: status.status,
      progress: status.progress,
    };
  } catch (error) {
    console.error('刷新 Music 记录状态失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '刷新失败',
    };
  }
}

/**
 * 获取 Music 记录详情
 */
export async function getMusicRecordDetail(id: number) {
  await verifyAdminWithoutDb();

  const record = await prisma.music_records.findUnique({
    where: { id },
  });

  if (!record) {
    return null;
  }

  return {
    id: record.id,
    taskId: record.task_id,
    externalTaskId: record.external_task_id,
    userId: record.user_id,
    model: record.model,
    prompt: record.prompt,
    style: record.style,
    title: record.title,
    lyrics: record.lyrics,
    isInstrumental: record.is_instrumental,
    isPublic: record.is_public,
    creditsCost: record.credits_cost,
    status: record.status,
    progress: record.progress,
    audioUrl: record.audio_url,
    audioUrl2: record.audio_url_2,
    streamUrl: record.stream_url,
    streamUrl2: record.stream_url_2,
    coverUrl: record.cover_url,
    coverUrl2: record.cover_url_2,
    duration: record.duration,
    duration2: record.duration_2,
    tags: record.tags,
    errorMessage: record.error_message,
    shareId: record.share_id,
    createdAt: record.created_at.toISOString(),
    updatedAt: record.updated_at?.toISOString() || null,
    completedAt: record.completed_at?.toISOString() || null,
  };
}
