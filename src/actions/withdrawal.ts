'use server';

/**
 * USDT 提现 Server Action
 *
 * 原子性扣减 usdt_balance，创建提现申请记录（人工审核模式）。
 * 使用 WHERE 条件防止并发超扣。
 */

import db from '@/lib/db';
import { users, withdrawals } from '@/db/schema';
import { eq, sql, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth-firebase';
import { getWithdrawalConfig } from '@/config/appConfig';

export interface WithdrawalResult {
  success: boolean;
  error?: string;
  usdt_balance?: number;
}

export interface WithdrawalInput {
  amount: number;
  network: string;
  walletAddress: string;
  email: string;
  telegram?: string;
}

/**
 * 提交 USDT 提现申请
 */
export async function submitWithdrawal(input: WithdrawalInput): Promise<WithdrawalResult> {
  try {
    // 1. 必须登录
    const authUser = await getCurrentUser();

    // 2. 读取配置
    const config = getWithdrawalConfig();

    if (!config.enabled) {
      return { success: false, error: 'withdrawal_disabled' };
    }

    // 3. 校验金额
    const { amount, network, walletAddress, email, telegram } = input;

    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      return { success: false, error: 'invalid_amount' };
    }

    if (amount < config.min_amount) {
      return { success: false, error: 'below_minimum' };
    }

    // 4. 查找网络配置，获取手续费
    const networkConfig = config.networks.find((n) => n.id === network);
    if (!networkConfig) {
      return { success: false, error: 'invalid_network' };
    }

    const fee = networkConfig.fee;

    // 5. 校验实际到账 > 0
    if (amount <= fee) {
      return { success: false, error: 'amount_too_low' };
    }

    const netAmount = amount - fee;

    // 6. 校验钱包地址和邮箱
    if (!walletAddress || !walletAddress.trim()) {
      return { success: false, error: 'invalid_wallet' };
    }

    if (!email || !email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      return { success: false, error: 'invalid_email' };
    }

    // 7. 原子 UPDATE：usdt_balance - amount WHERE usdt_balance >= amount
    const result = await db
      .update(users)
      .set({
        usdtBalance: sql`${users.usdtBalance}::numeric - ${amount}::numeric`,
      })
      .where(
        and(
          eq(users.userId, authUser.uid),
          sql`${users.usdtBalance}::numeric >= ${amount}::numeric`
        )
      )
      .returning({
        usdtBalance: users.usdtBalance,
      });

    // 8. affected rows = 0 → 余额不足
    if (result.length === 0) {
      return { success: false, error: 'insufficient_balance' };
    }

    const updated = result[0];

    // 9. 写 withdrawals 记录
    await db.insert(withdrawals).values({
      userId: authUser.uid,
      amount: amount.toFixed(6),
      fee: fee.toFixed(6),
      netAmount: netAmount.toFixed(6),
      network,
      walletAddress: walletAddress.trim(),
      email: email.trim(),
      telegram: telegram?.trim() || null,
      status: 'pending',
    });

    console.log(`✅ [Withdrawal] ${authUser.uid}: ${amount} USDT (fee: ${fee}, net: ${netAmount}) via ${network} → ${walletAddress}`);

    return {
      success: true,
      usdt_balance: parseFloat(updated.usdtBalance) || 0,
    };
  } catch (error) {
    console.error('❌ [Withdrawal] 提现失败:', error);
    if (error instanceof Error && (error.message === '未提供认证信息' || error.message === '未登录')) {
      return { success: false, error: 'not_authenticated' };
    }
    return { success: false, error: 'server_error' };
  }
}
