'use server';

/**
 * 管理后台统计 Server Actions
 */
import { getDb } from '@/lib/db';
import { users, anonymousUsers } from '@/db/schema';
import { count, gte, sql } from 'drizzle-orm';
import { verifyAdminWithoutDb } from '@/lib/auth-admin';

export type TimeRange = 'today' | '7days' | '30days';

interface DailyCount {
  date: string; // YYYY-MM-DD
  count: number;
}

// 通用任务统计结构
interface TaskStats {
  total: number;
  newInRange: number;
  successCount: number;
  failureCount: number;
  processingCount: number;
  daily: DailyCount[];
}

interface StatsResult {
  // 用户统计
  users: {
    registered: {
      total: number;
      newInRange: number;
      daily: DailyCount[];
    };
    anonymous: {
      total: number;
      newInRange: number;
      daily: DailyCount[];
    };
  };
  // 各类任务统计
  tasks: {
    tts: TaskStats;
    music: TaskStats;
    video: TaskStats;
    image: TaskStats;
    cover: TaskStats;
    dialogue: TaskStats;
    download: TaskStats;
  };
  // 兼容旧接口
  ttsRecords: {
    total: number;
    newInRange: number;
    successCount: number;
    failureCount: number;
    daily: DailyCount[];
  };
}

/**
 * 获取统计数据
 */
export async function getAdminStats(timeRange: TimeRange): Promise<StatsResult> {
  const db = await getDb();
  await verifyAdminWithoutDb();

  // 计算时间范围
  const now = new Date();
  let startDate: Date;

  switch (timeRange) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case '7days':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      startDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      break;
    case '30days':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      startDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      break;
  }

  const startDateStr = startDate.toISOString();

  // 通用任务统计查询函数 (using raw SQL for table name interpolation)
  const getTaskStats = async (tableName: string) => {
    const db = await getDb();
    const [total, newCount, success, failure, processing, daily] = await Promise.all([
      db.all<{ count: string }>(sql.raw(`SELECT COUNT(*) as count FROM ${tableName}`)),
      db.all<{ count: string }>(sql`SELECT COUNT(*) as count FROM ${sql.raw(tableName)} WHERE created_at >= ${startDateStr}`),
      db.all<{ count: string }>(sql`SELECT COUNT(*) as count FROM ${sql.raw(tableName)} WHERE created_at >= ${startDateStr} AND status = 'SUCCESS'`),
      db.all<{ count: string }>(sql`SELECT COUNT(*) as count FROM ${sql.raw(tableName)} WHERE created_at >= ${startDateStr} AND status = 'FAILURE'`),
      db.all<{ count: string }>(sql`SELECT COUNT(*) as count FROM ${sql.raw(tableName)} WHERE created_at >= ${startDateStr} AND status = 'PROCESSING'`),
      db.all<{ date: string; count: string }>(sql`SELECT DATE(created_at) as date, COUNT(*) as count FROM ${sql.raw(tableName)} WHERE created_at >= ${startDateStr} GROUP BY DATE(created_at) ORDER BY date ASC`),
    ]);
    return {
      total: Number(total[0]?.count || 0),
      newInRange: Number(newCount[0]?.count || 0),
      successCount: Number(success[0]?.count || 0),
      failureCount: Number(failure[0]?.count || 0),
      processingCount: Number(processing[0]?.count || 0),
      daily,
    };
  };

  // 并行查询所有统计数据
  const [
    // 用户总数
    [{ total: registeredTotal }],
    [{ total: anonymousTotal }],
    // 时间范围内新增用户
    [{ total: registeredNew }],
    [{ total: anonymousNew }],
    // 每日明细数据
    registeredDailyResult,
    anonymousDailyResult,
    // 各类任务统计
    ttsStats,
    musicStats,
    videoStats,
    imageStats,
    coverStats,
    dialogueStats,
    downloadStats,
  ] = await Promise.all([
    // 用户总数
    db.select({ total: count() }).from(users),
    db.select({ total: count() }).from(anonymousUsers),
    // 时间范围内新增用户
    db.select({ total: count() }).from(users).where(gte(users.createdAt, startDateStr)),
    db.select({ total: count() }).from(anonymousUsers).where(gte(anonymousUsers.createdAt, startDateStr)),
    // 每日明细 - 注册用户
    db.all<{ date: string; count: string }>(sql`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM users
      WHERE created_at >= ${startDateStr}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `),
    // 每日明细 - 匿名用户
    db.all<{ date: string; count: string }>(sql`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM anonymous_users
      WHERE created_at >= ${startDateStr}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `),
    // 各类任务统计
    getTaskStats('tts_records'),
    getTaskStats('music_records'),
    getTaskStats('video_records'),
    getTaskStats('image_records'),
    getTaskStats('cover_records'),
    getTaskStats('dialogue_records'),
    getTaskStats('video_download_records'),
  ]);

  // 转换每日数据格式
  const formatDailyData = (rows: { date: string; count: string }[]): DailyCount[] => {
    return rows.map((item) => ({
      date: typeof item.date === 'string' ? item.date.split('T')[0] : new Date(item.date).toISOString().split('T')[0],
      count: Number(item.count),
    }));
  };

  // 格式化任务统计数据
  const formatTaskStats = (stats: Awaited<ReturnType<typeof getTaskStats>>): TaskStats => ({
    total: stats.total,
    newInRange: stats.newInRange,
    successCount: stats.successCount,
    failureCount: stats.failureCount,
    processingCount: stats.processingCount,
    daily: formatDailyData(stats.daily),
  });

  return {
    users: {
      registered: {
        total: Number(registeredTotal),
        newInRange: Number(registeredNew),
        daily: formatDailyData(registeredDailyResult),
      },
      anonymous: {
        total: Number(anonymousTotal),
        newInRange: Number(anonymousNew),
        daily: formatDailyData(anonymousDailyResult),
      },
    },
    tasks: {
      tts: formatTaskStats(ttsStats),
      music: formatTaskStats(musicStats),
      video: formatTaskStats(videoStats),
      image: formatTaskStats(imageStats),
      cover: formatTaskStats(coverStats),
      dialogue: formatTaskStats(dialogueStats),
      download: formatTaskStats(downloadStats),
    },
    // 兼容旧接口
    ttsRecords: {
      total: ttsStats.total,
      newInRange: ttsStats.newInRange,
      successCount: ttsStats.successCount,
      failureCount: ttsStats.failureCount,
      daily: formatDailyData(ttsStats.daily),
    },
  };
}
