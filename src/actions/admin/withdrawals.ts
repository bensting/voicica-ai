'use server';

/**
 * 提现管理 Server Actions
 */
import { getDb } from '@/lib/db';
import { withdrawals, users } from '@/db/schema';
import { eq, and, or, like, desc, count, gte, lte, sql } from 'drizzle-orm';
import { verifyAdminWithoutDb } from '@/lib/auth-admin';

interface WithdrawalsQuery {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface AdminWithdrawalItem {
  id: number;
  userId: string;
  amount: string;
  fee: string;
  netAmount: string;
  network: string;
  walletAddress: string;
  email: string;
  telegram: string | null;
  status: string;
  txHash: string | null;
  adminNote: string | null;
  completedAt: string | null;
  createdAt: string;
}

/**
 * 获取提现列表
 */
export async function getAdminWithdrawals(query: WithdrawalsQuery = {}) {
  const db = await getDb();
  await verifyAdminWithoutDb();

  const {
    page = 1,
    pageSize = 20,
    status,
    search,
    startDate,
    endDate,
  } = query;

  const conditions = [];

  if (status) {
    conditions.push(eq(withdrawals.status, status));
  }

  if (search) {
    conditions.push(
      or(
        like(withdrawals.userId, `%${search}%`),
        like(withdrawals.walletAddress, `%${search}%`),
        like(withdrawals.email, `%${search}%`),
      )
    );
  }

  if (startDate) {
    conditions.push(gte(withdrawals.createdAt, new Date(startDate).toISOString()));
  }
  if (endDate) {
    conditions.push(lte(withdrawals.createdAt, new Date(endDate + 'T23:59:59.999Z').toISOString()));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [[{ total }], records] = await Promise.all([
    db.select({ total: count() }).from(withdrawals).where(whereClause),
    db.select().from(withdrawals)
      .where(whereClause)
      .orderBy(desc(withdrawals.createdAt))
      .offset((page - 1) * pageSize)
      .limit(pageSize),
  ]);

  const items: AdminWithdrawalItem[] = records.map((r) => ({
    id: r.id,
    userId: r.userId,
    amount: r.amount,
    fee: r.fee,
    netAmount: r.netAmount,
    network: r.network,
    walletAddress: r.walletAddress,
    email: r.email,
    telegram: r.telegram,
    status: r.status,
    txHash: r.txHash,
    adminNote: r.adminNote,
    completedAt: r.completedAt || null,
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
 * 获取提现统计
 */
export async function getWithdrawalStats() {
  const db = await getDb();
  await verifyAdminWithoutDb();

  const [[{ total }], [{ pending }], [{ transferring }], [{ completed }], [{ rejected }], [{ totalAmount }]] = await Promise.all([
    db.select({ total: count() }).from(withdrawals),
    db.select({ pending: count() }).from(withdrawals).where(eq(withdrawals.status, 'pending')),
    db.select({ transferring: count() }).from(withdrawals).where(eq(withdrawals.status, 'transferring')),
    db.select({ completed: count() }).from(withdrawals).where(eq(withdrawals.status, 'completed')),
    db.select({ rejected: count() }).from(withdrawals).where(eq(withdrawals.status, 'rejected')),
    db.select({ totalAmount: sql<string>`COALESCE(SUM(${withdrawals.netAmount}), 0)` }).from(withdrawals).where(eq(withdrawals.status, 'completed')),
  ]);

  return {
    total: Number(total),
    pending: Number(pending),
    transferring: Number(transferring),
    completed: Number(completed),
    rejected: Number(rejected),
    totalAmount: totalAmount,
  };
}

/**
 * 开始转账（pending → transferring）
 */
export async function startTransfer(id: number) {
  const db = await getDb();
  await verifyAdminWithoutDb();

  try {
    const [record] = await db.select().from(withdrawals).where(eq(withdrawals.id, id)).limit(1);
    if (!record) return { success: false, message: '记录不存在' };
    if (record.status !== 'pending') return { success: false, message: '只能对待处理的提现执行此操作' };

    await db.update(withdrawals).set({
      status: 'transferring',
    }).where(eq(withdrawals.id, id));

    return { success: true, message: '已标记为转账中' };
  } catch (error) {
    console.error('标记转账中失败:', error);
    return { success: false, message: error instanceof Error ? error.message : '操作失败' };
  }
}

/**
 * 完成转账（transferring → completed）
 */
export async function completeTransfer(id: number, txHash: string) {
  const db = await getDb();
  await verifyAdminWithoutDb();

  try {
    const [record] = await db.select().from(withdrawals).where(eq(withdrawals.id, id)).limit(1);
    if (!record) return { success: false, message: '记录不存在' };
    if (record.status !== 'transferring') return { success: false, message: '只能对转账中的提现执行此操作' };

    await db.update(withdrawals).set({
      status: 'completed',
      txHash: txHash.trim() || null,
      completedAt: new Date().toISOString(),
    }).where(eq(withdrawals.id, id));

    return { success: true, message: '已完成' };
  } catch (error) {
    console.error('完成转账失败:', error);
    return { success: false, message: error instanceof Error ? error.message : '操作失败' };
  }
}

/**
 * 拒绝提现 + 退款到 USDT 余额（pending / transferring 均可拒绝）
 */
export async function rejectWithdrawal(id: number, adminNote: string) {
  const db = await getDb();
  await verifyAdminWithoutDb();

  try {
    const [record] = await db.select().from(withdrawals).where(eq(withdrawals.id, id)).limit(1);
    if (!record) return { success: false, message: '记录不存在' };
    if (record.status !== 'pending' && record.status !== 'transferring') {
      return { success: false, message: '只能拒绝待处理或转账中的提现' };
    }

    // 退还 USDT 到用户余额（退还原始 amount，不是 netAmount）
    await db.update(users).set({
      usdtBalance: sql`${users.usdtBalance} + ${record.amount}`,
    }).where(eq(users.userId, record.userId));

    // 更新提现状态
    await db.update(withdrawals).set({
      status: 'rejected',
      adminNote: adminNote.trim() || null,
      completedAt: new Date().toISOString(),
    }).where(eq(withdrawals.id, id));

    return { success: true, message: '已拒绝，USDT 已退还' };
  } catch (error) {
    console.error('拒绝提现失败:', error);
    return { success: false, message: error instanceof Error ? error.message : '操作失败' };
  }
}
