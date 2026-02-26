'use server';

/**
 * 兑换记录管理 Server Actions（只读）
 */
import { getDb } from '@/lib/db';
import { conversions } from '@/db/schema';
import { like, desc, count, gte, lte, and, sql } from 'drizzle-orm';
import { verifyAdminWithoutDb } from '@/lib/auth-admin';

interface ConversionsQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface AdminConversionItem {
  id: number;
  userId: string;
  type: string;
  voicicaAmount: number;
  usdtAmount: string;
  rate: string;
  createdAt: string;
}

/**
 * 获取兑换记录列表
 */
export async function getAdminConversions(query: ConversionsQuery = {}) {
  const db = await getDb();
  await verifyAdminWithoutDb();

  const {
    page = 1,
    pageSize = 20,
    search,
    startDate,
    endDate,
  } = query;

  const conditions = [];

  if (search) {
    conditions.push(like(conversions.userId, `%${search}%`));
  }

  if (startDate) {
    conditions.push(gte(conversions.createdAt, new Date(startDate).toISOString()));
  }
  if (endDate) {
    conditions.push(lte(conversions.createdAt, new Date(endDate + 'T23:59:59.999Z').toISOString()));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [[{ total }], records] = await Promise.all([
    db.select({ total: count() }).from(conversions).where(whereClause),
    db.select().from(conversions)
      .where(whereClause)
      .orderBy(desc(conversions.createdAt))
      .offset((page - 1) * pageSize)
      .limit(pageSize),
  ]);

  const items: AdminConversionItem[] = records.map((r) => ({
    id: r.id,
    userId: r.userId,
    type: r.type,
    voicicaAmount: r.voicicaAmount,
    usdtAmount: r.usdtAmount,
    rate: r.rate,
    createdAt: r.createdAt,
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
 * 获取兑换统计
 */
export async function getConversionStats() {
  const db = await getDb();
  await verifyAdminWithoutDb();

  const [[{ total }], [{ totalVoicica }], [{ totalUsdt }]] = await Promise.all([
    db.select({ total: count() }).from(conversions),
    db.select({ totalVoicica: sql<number>`COALESCE(SUM(${conversions.voicicaAmount}), 0)` }).from(conversions),
    db.select({ totalUsdt: sql<string>`COALESCE(SUM(${conversions.usdtAmount}), 0)` }).from(conversions),
  ]);

  return {
    total: Number(total),
    totalVoicica: Number(totalVoicica),
    totalUsdt: totalUsdt,
  };
}
