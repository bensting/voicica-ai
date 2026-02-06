'use server';

/**
 * TTS 记录管理 Server Actions
 */
import prisma from '@/lib/prisma';
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
      { text: { contains: search, mode: 'insensitive' } },
      { voice_name: { contains: search, mode: 'insensitive' } },
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

  if (platform) {
    where.platform = platform;
  }

  if (isPublic !== undefined) {
    where.is_public = isPublic;
  }

  const [total, records] = await Promise.all([
    prisma.tts_records.count({ where }),
    prisma.tts_records.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const items: TtsRecordItem[] = records.map((record) => ({
    id: record.id,
    taskId: record.task_id,
    userId: record.user_id,
    text: record.text,
    voiceName: record.voice_name,
    language: record.language,
    style: record.style,
    speed: record.speed,
    pitch: record.pitch,
    volume: record.volume,
    creditsCost: record.credits_cost,
    characterCount: record.character_count,
    status: record.status,
    progress: record.progress,
    audioUrl: record.audio_url,
    duration: record.duration,
    format: record.format,
    errorMessage: record.error_message,
    shareId: record.share_id,
    platform: record.platform,
    isPublic: record.is_public,
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
 * 获取 TTS 记录统计
 */
export async function getTtsRecordsStats() {
  await verifyAdminWithoutDb();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  const [
    totalRecords,
    completedRecords,
    failedRecords,
    pendingRecords,
    todayRecords,
    weekRecords,
    totalCredits,
    totalCharacters,
  ] = await Promise.all([
    prisma.tts_records.count(),
    prisma.tts_records.count({ where: { status: 'completed' } }),
    prisma.tts_records.count({ where: { status: 'failed' } }),
    prisma.tts_records.count({ where: { status: { in: ['pending', 'processing'] } } }),
    prisma.tts_records.count({ where: { created_at: { gte: todayStart } } }),
    prisma.tts_records.count({ where: { created_at: { gte: weekStart } } }),
    prisma.tts_records.aggregate({ _sum: { credits_cost: true } }),
    prisma.tts_records.aggregate({ _sum: { character_count: true } }),
  ]);

  return {
    totalRecords,
    completedRecords,
    failedRecords,
    pendingRecords,
    todayRecords,
    weekRecords,
    totalCredits: totalCredits._sum.credits_cost || 0,
    totalCharacters: totalCharacters._sum.character_count || 0,
  };
}

/**
 * 删除 TTS 记录
 */
export async function deleteTtsRecord(id: number) {
  await verifyAdminWithoutDb();

  try {
    await prisma.tts_records.delete({
      where: { id },
    });

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
  await verifyAdminWithoutDb();

  try {
    const result = await prisma.tts_records.deleteMany({
      where: { id: { in: ids } },
    });

    return {
      success: true,
      message: `成功删除 ${result.count} 条记录`,
      deleted: result.count,
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
  await verifyAdminWithoutDb();

  const record = await prisma.tts_records.findUnique({
    where: { id },
  });

  if (!record) {
    return null;
  }

  return {
    id: record.id,
    taskId: record.task_id,
    userId: record.user_id,
    text: record.text,
    voiceName: record.voice_name,
    language: record.language,
    style: record.style,
    speed: record.speed,
    pitch: record.pitch,
    volume: record.volume,
    creditsCost: record.credits_cost,
    characterCount: record.character_count,
    status: record.status,
    progress: record.progress,
    audioUrl: record.audio_url,
    duration: record.duration,
    format: record.format,
    errorMessage: record.error_message,
    shareId: record.share_id,
    createdAt: record.created_at.toISOString(),
    updatedAt: record.updated_at?.toISOString() || null,
    completedAt: record.completed_at?.toISOString() || null,
  };
}

/**
 * 更新 TTS 记录的公开状态
 */
export async function updateTtsRecordPublic(id: number, isPublic: boolean) {
  await verifyAdminWithoutDb();

  try {
    await prisma.tts_records.update({
      where: { id },
      data: { is_public: isPublic },
    });

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
  await verifyAdminWithoutDb();

  try {
    const result = await prisma.tts_records.updateMany({
      where: { id: { in: ids } },
      data: { is_public: isPublic },
    });

    return {
      success: true,
      message: `成功更新 ${result.count} 条记录`,
      updated: result.count,
    };
  } catch (error) {
    console.error('批量更新 TTS 记录公开状态失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '更新失败',
    };
  }
}