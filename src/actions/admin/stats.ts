'use server';

/**
 * 管理后台统计 Server Actions
 */
import prisma from '@/lib/prisma';
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

  // 通用任务统计查询函数
  const getTaskStats = async (tableName: string) => {
    const [total, newCount, success, failure, processing, daily] = await Promise.all([
      prisma.$queryRawUnsafe<[{ count: bigint }]>(`SELECT COUNT(*) as count FROM ${tableName}`),
      prisma.$queryRawUnsafe<[{ count: bigint }]>(
        `SELECT COUNT(*) as count FROM ${tableName} WHERE created_at >= $1`,
        startDate
      ),
      prisma.$queryRawUnsafe<[{ count: bigint }]>(
        `SELECT COUNT(*) as count FROM ${tableName} WHERE created_at >= $1 AND status = 'SUCCESS'`,
        startDate
      ),
      prisma.$queryRawUnsafe<[{ count: bigint }]>(
        `SELECT COUNT(*) as count FROM ${tableName} WHERE created_at >= $1 AND status = 'FAILURE'`,
        startDate
      ),
      prisma.$queryRawUnsafe<[{ count: bigint }]>(
        `SELECT COUNT(*) as count FROM ${tableName} WHERE created_at >= $1 AND status = 'PROCESSING'`,
        startDate
      ),
      prisma.$queryRawUnsafe<{ date: Date; count: bigint }[]>(
        `SELECT DATE(created_at) as date, COUNT(*) as count FROM ${tableName} WHERE created_at >= $1 GROUP BY DATE(created_at) ORDER BY date ASC`,
        startDate
      ),
    ]);
    return {
      total: Number(total[0]?.count || 0),
      newInRange: Number(newCount[0]?.count || 0),
      successCount: Number(success[0]?.count || 0),
      failureCount: Number(failure[0]?.count || 0),
      processingCount: Number(processing[0]?.count || 0),
      daily: daily,
    };
  };

  // 并行查询所有统计数据
  const [
    // 用户总数
    registeredTotal,
    anonymousTotal,
    // 时间范围内新增用户
    registeredNew,
    anonymousNew,
    // 每日明细数据 (使用原始 SQL 进行分组)
    registeredDaily,
    anonymousDaily,
    // 各类任务统计
    ttsStats,
    musicStats,
    videoStats,
    imageStats,
    coverStats,
    dialogueStats,
  ] = await Promise.all([
    // 用户总数
    prisma.users.count(),
    prisma.anonymous_users.count(),
    // 时间范围内新增用户
    prisma.users.count({
      where: { created_at: { gte: startDate } },
    }),
    prisma.anonymous_users.count({
      where: { created_at: { gte: startDate } },
    }),
    // 每日明细 - 注册用户
    prisma.$queryRaw<{ date: Date; count: bigint }[]>`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM users
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `,
    // 每日明细 - 匿名用户
    prisma.$queryRaw<{ date: Date; count: bigint }[]>`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM anonymous_users
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `,
    // 各类任务统计
    getTaskStats('tts_records'),
    getTaskStats('music_records'),
    getTaskStats('video_records'),
    getTaskStats('image_records'),
    getTaskStats('cover_records'),
    getTaskStats('dialogue_records'),
  ]);

  // 转换每日数据格式
  const formatDailyData = (data: { date: Date; count: bigint }[]): DailyCount[] => {
    return data.map((item) => ({
      date: item.date.toISOString().split('T')[0],
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
        total: registeredTotal,
        newInRange: registeredNew,
        daily: formatDailyData(registeredDaily),
      },
      anonymous: {
        total: anonymousTotal,
        newInRange: anonymousNew,
        daily: formatDailyData(anonymousDaily),
      },
    },
    tasks: {
      tts: formatTaskStats(ttsStats),
      music: formatTaskStats(musicStats),
      video: formatTaskStats(videoStats),
      image: formatTaskStats(imageStats),
      cover: formatTaskStats(coverStats),
      dialogue: formatTaskStats(dialogueStats),
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