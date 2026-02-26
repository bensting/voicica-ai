'use server';

/**
 * 交易历史 Server Actions
 * 获取兑换记录和提现记录
 */
import { getDb } from '@/lib/db';
import { conversions, withdrawals } from '@/db/schema';
import { eq, desc, count } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth-firebase';

export interface ConversionItem {
  id: number;
  voicicaAmount: number;
  usdtAmount: string;
  rate: string;
  createdAt: string;
}

export interface ConversionHistoryResponse {
  items: ConversionItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface WithdrawalItem {
  id: number;
  amount: string;
  fee: string;
  netAmount: string;
  network: string;
  walletAddress: string;
  status: string;
  txHash: string | null;
  createdAt: string;
}

export interface WithdrawalHistoryResponse {
  items: WithdrawalItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export async function getConversionHistory(
  page: number = 1,
  pageSize: number = 20
): Promise<ConversionHistoryResponse> {
  const db = await getDb();
  const authUser = await getCurrentUser();

  const whereClause = eq(conversions.userId, authUser.uid);

  const [totalResult, items] = await Promise.all([
    db.select({ total: count() }).from(conversions).where(whereClause),
    db
      .select({
        id: conversions.id,
        voicicaAmount: conversions.voicicaAmount,
        usdtAmount: conversions.usdtAmount,
        rate: conversions.rate,
        createdAt: conversions.createdAt,
      })
      .from(conversions)
      .where(whereClause)
      .orderBy(desc(conversions.createdAt))
      .offset((page - 1) * pageSize)
      .limit(pageSize),
  ]);

  const total = totalResult[0].total;

  return {
    items: items.map((item) => ({
      id: item.id,
      voicicaAmount: item.voicicaAmount,
      usdtAmount: item.usdtAmount,
      rate: item.rate,
      createdAt: item.createdAt,
    })),
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  };
}

export async function getWithdrawalHistory(
  page: number = 1,
  pageSize: number = 20
): Promise<WithdrawalHistoryResponse> {
  const db = await getDb();
  const authUser = await getCurrentUser();

  const whereClause = eq(withdrawals.userId, authUser.uid);

  const [totalResult, items] = await Promise.all([
    db.select({ total: count() }).from(withdrawals).where(whereClause),
    db
      .select({
        id: withdrawals.id,
        amount: withdrawals.amount,
        fee: withdrawals.fee,
        netAmount: withdrawals.netAmount,
        network: withdrawals.network,
        walletAddress: withdrawals.walletAddress,
        status: withdrawals.status,
        txHash: withdrawals.txHash,
        createdAt: withdrawals.createdAt,
      })
      .from(withdrawals)
      .where(whereClause)
      .orderBy(desc(withdrawals.createdAt))
      .offset((page - 1) * pageSize)
      .limit(pageSize),
  ]);

  const total = totalResult[0].total;

  return {
    items: items.map((item) => ({
      id: item.id,
      amount: item.amount,
      fee: item.fee,
      netAmount: item.netAmount,
      network: item.network,
      walletAddress: item.walletAddress,
      status: item.status,
      txHash: item.txHash,
      createdAt: item.createdAt,
    })),
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  };
}
