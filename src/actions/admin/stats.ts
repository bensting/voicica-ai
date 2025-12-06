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
  // TTS 任务统计
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

  // 并行查询所有统计数据
  const [
    // 用户总数
    registeredTotal,
    anonymousTotal,
    // 时间范围内新增用户
    registeredNew,
    anonymousNew,
    // TTS 记录总数
    ttsTotal,
    ttsNew,
    ttsSuccess,
    ttsFailure,
    // 每日明细数据 (使用原始 SQL 进行分组)
    registeredDaily,
    anonymousDaily,
    ttsDaily,
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
    // TTS 记录统计
    prisma.tts_records.count(),
    prisma.tts_records.count({
      where: { created_at: { gte: startDate } },
    }),
    prisma.tts_records.count({
      where: { created_at: { gte: startDate }, status: 'SUCCESS' },
    }),
    prisma.tts_records.count({
      where: { created_at: { gte: startDate }, status: 'FAILURE' },
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
    // 每日明细 - TTS 记录
    prisma.$queryRaw<{ date: Date; count: bigint }[]>`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM tts_records
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `,
  ]);

  // 转换每日数据格式
  const formatDailyData = (data: { date: Date; count: bigint }[]): DailyCount[] => {
    return data.map((item) => ({
      date: item.date.toISOString().split('T')[0],
      count: Number(item.count),
    }));
  };

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
    ttsRecords: {
      total: ttsTotal,
      newInRange: ttsNew,
      successCount: ttsSuccess,
      failureCount: ttsFailure,
      daily: formatDailyData(ttsDaily),
    },
  };
}