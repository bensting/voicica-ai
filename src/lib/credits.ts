'use server';

/**
 * 统一的积分管理服务
 *
 * 所有积分的检查、扣除、增加操作都应该通过此服务
 */

import db from '@/lib/db';
import { anonymousUsers, users, creditHistory } from '@/db/schema';
import { eq, sql, and, gte } from 'drizzle-orm';
import { ProductType } from '@/config/productType';

/**
 * 清理 description 字符串，移除可能导致问题的字符
 */
function sanitizeDescription(description: string): string {
  return description
    .replace(/\\/g, '/')
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '')
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '')
    .replace(/[\u{231A}-\u{231B}]/gu, '')
    .replace(/[\u{23E9}-\u{23F3}]/gu, '')
    .replace(/[\u{23F8}-\u{23FA}]/gu, '')
    .replace(/[\u{25AA}-\u{25AB}]/gu, '')
    .replace(/[\u{25B6}]/gu, '')
    .replace(/[\u{25C0}]/gu, '')
    .replace(/[\u{25FB}-\u{25FE}]/gu, '')
    .replace(/[\u{200D}]/gu, '')
    .replace(/[\u{20E3}]/gu, '')
    .trim();
}

/**
 * 检查积分结果
 */
export interface CheckCreditsResult {
  hasEnough: boolean;
  current: number;
}

/**
 * 检查用户积分是否足够
 */
export async function checkCredits(
  userId: string,
  required: number,
  isAnonymous: boolean
): Promise<CheckCreditsResult> {
  if (isAnonymous) {
    const [user] = await db.select({ credits: anonymousUsers.credits })
      .from(anonymousUsers)
      .where(eq(anonymousUsers.userId, userId))
      .limit(1);
    const current = user?.credits ?? 0;
    return { hasEnough: current >= required, current };
  } else {
    const [user] = await db.select({ credits: users.credits, monthlyCredits: users.monthlyCredits })
      .from(users)
      .where(eq(users.userId, userId))
      .limit(1);
    const current = (user?.credits ?? 0) + (user?.monthlyCredits ?? 0);
    return { hasEnough: current >= required, current };
  }
}

/**
 * 获取用户当前积分
 */
export async function getCredits(
  userId: string,
  isAnonymous: boolean
): Promise<number> {
  if (isAnonymous) {
    const [user] = await db.select({ credits: anonymousUsers.credits })
      .from(anonymousUsers)
      .where(eq(anonymousUsers.userId, userId))
      .limit(1);
    return user?.credits ?? 0;
  } else {
    const [user] = await db.select({ credits: users.credits, monthlyCredits: users.monthlyCredits })
      .from(users)
      .where(eq(users.userId, userId))
      .limit(1);
    return (user?.credits ?? 0) + (user?.monthlyCredits ?? 0);
  }
}

/**
 * 扣除积分并记录到历史
 */
export async function deductCredits(
  userId: string,
  amount: number,
  productType: ProductType,
  isAnonymous: boolean,
  description: string,
  taskId?: string
): Promise<void> {
  const tableName = isAnonymous ? 'anonymous_users' : 'users';

  if (isAnonymous) {
    await db.update(anonymousUsers)
      .set({
        credits: sql`${anonymousUsers.credits} - ${amount}`,
        totalCreditsUsed: sql`${anonymousUsers.totalCreditsUsed} + ${amount}`,
      })
      .where(eq(anonymousUsers.userId, userId));
  } else {
    const [user] = await db.select({ monthlyCredits: users.monthlyCredits, credits: users.credits })
      .from(users)
      .where(eq(users.userId, userId))
      .limit(1);

    if (!user) {
      throw new Error('用户不存在');
    }

    const fromMonthly = Math.min(user.monthlyCredits, amount);
    const fromCredits = amount - fromMonthly;

    await db.update(users)
      .set({
        credits: sql`${users.credits} - ${fromCredits}`,
        monthlyCredits: sql`${users.monthlyCredits} - ${fromMonthly}`,
        totalCreditsUsed: sql`${users.totalCreditsUsed} + ${amount}`,
      })
      .where(eq(users.userId, userId));
  }

  await db.insert(creditHistory).values({
    userId,
    amount: -amount,
    description: sanitizeDescription(description),
    productType,
    taskId,
  });

  console.log(`✅ [deductCredits] 扣除积分成功: ${amount}, 用户: ${userId}, 表: ${tableName}`);
}

/**
 * 增加积分并记录到历史
 */
export async function addCredits(
  userId: string,
  amount: number,
  productType: ProductType,
  isAnonymous: boolean,
  description: string,
  taskId?: string,
  updateTotalUsed: boolean = false
): Promise<void> {
  const tableName = isAnonymous ? 'anonymous_users' : 'users';

  if (isAnonymous) {
    await db.update(anonymousUsers)
      .set({
        credits: sql`${anonymousUsers.credits} + ${amount}`,
        ...(updateTotalUsed ? { totalCreditsUsed: sql`${anonymousUsers.totalCreditsUsed} - ${amount}` } : {}),
      })
      .where(eq(anonymousUsers.userId, userId));
  } else {
    await db.update(users)
      .set({
        credits: sql`${users.credits} + ${amount}`,
        ...(updateTotalUsed ? { totalCreditsUsed: sql`${users.totalCreditsUsed} - ${amount}` } : {}),
      })
      .where(eq(users.userId, userId));
  }

  await db.insert(creditHistory).values({
    userId,
    amount,
    description: sanitizeDescription(description),
    productType,
    taskId,
  });

  console.log(`✅ [addCredits] 增加积分成功: ${amount}, 用户: ${userId}, 表: ${tableName}`);
}

/**
 * 检查并扣除积分（组合操作）
 */
export async function checkAndDeductCredits(
  userId: string,
  amount: number,
  productType: ProductType,
  isAnonymous: boolean,
  description: string
): Promise<void> {
  const { hasEnough, current } = await checkCredits(userId, amount, isAnonymous);

  if (!hasEnough) {
    const { InsufficientCreditsError } = await import('@/lib/errors');
    throw new InsufficientCreditsError(amount, current);
  }

  await deductCredits(userId, amount, productType, isAnonymous, description);
}

/**
 * 积分扣减详情（用于精确返还）
 */
export interface DeductionBreakdown {
  fromCredits: number;
  fromMonthlyCredits: number;
  total: number;
}

/**
 * 原子性扣除积分（使用事务）
 */
export async function deductCreditsAtomic(
  userId: string,
  amount: number,
  productType: ProductType,
  isAnonymous: boolean,
  description: string,
  taskId?: string
): Promise<DeductionBreakdown> {
  let breakdown: DeductionBreakdown = {
    fromCredits: 0,
    fromMonthlyCredits: 0,
    total: amount,
  };

  if (isAnonymous) {
    // 使用 WHERE 条件做乐观锁，防止余额不足时扣减
    const result = await db.update(anonymousUsers)
      .set({
        credits: sql`${anonymousUsers.credits} - ${amount}`,
        totalCreditsUsed: sql`${anonymousUsers.totalCreditsUsed} + ${amount}`,
      })
      .where(and(
        eq(anonymousUsers.userId, userId),
        gte(anonymousUsers.credits, amount)
      ));

    if (result.rowCount === 0) {
      throw new Error('积分扣减失败，余额不足');
    }

    breakdown = {
      fromCredits: amount,
      fromMonthlyCredits: 0,
      total: amount,
    };
  } else {
    const [user] = await db.select({ credits: users.credits, monthlyCredits: users.monthlyCredits })
      .from(users)
      .where(eq(users.userId, userId))
      .limit(1);

    const totalCredits = (user?.credits ?? 0) + (user?.monthlyCredits ?? 0);
    if (!user || totalCredits < amount) {
      throw new Error('积分扣减失败，余额不足');
    }

    const fromMonthly = Math.min(user.monthlyCredits, amount);
    const fromCredits = amount - fromMonthly;

    await db.update(users)
      .set({
        credits: sql`${users.credits} - ${fromCredits}`,
        monthlyCredits: sql`${users.monthlyCredits} - ${fromMonthly}`,
        totalCreditsUsed: sql`${users.totalCreditsUsed} + ${amount}`,
      })
      .where(eq(users.userId, userId));

    breakdown = {
      fromCredits,
      fromMonthlyCredits: fromMonthly,
      total: amount,
    };
  }

  await db.insert(creditHistory).values({
    userId,
    amount: -amount,
    description: sanitizeDescription(description),
    productType,
    taskId,
  });

  console.log(`✅ [deductCreditsAtomic] 原子性扣除积分成功: ${amount} (永久: ${breakdown.fromCredits}, 当月: ${breakdown.fromMonthlyCredits}), 用户: ${userId}`);

  return breakdown;
}

/**
 * 精确返还积分（根据扣减详情返还到原处）
 */
export async function refundCredits(
  userId: string,
  breakdown: DeductionBreakdown,
  productType: ProductType,
  isAnonymous: boolean,
  description: string,
  taskId?: string
): Promise<void> {
  if (isAnonymous) {
    await db.update(anonymousUsers)
      .set({
        credits: sql`${anonymousUsers.credits} + ${breakdown.total}`,
        totalCreditsUsed: sql`${anonymousUsers.totalCreditsUsed} - ${breakdown.total}`,
      })
      .where(eq(anonymousUsers.userId, userId));
  } else {
    await db.update(users)
      .set({
        credits: sql`${users.credits} + ${breakdown.fromCredits}`,
        monthlyCredits: sql`${users.monthlyCredits} + ${breakdown.fromMonthlyCredits}`,
        totalCreditsUsed: sql`${users.totalCreditsUsed} - ${breakdown.total}`,
      })
      .where(eq(users.userId, userId));
  }

  await db.insert(creditHistory).values({
    userId,
    amount: breakdown.total,
    description: sanitizeDescription(description),
    productType,
    taskId,
  });

  console.log(`✅ [refundCredits] 精确返还积分成功: ${breakdown.total} (永久: ${breakdown.fromCredits}, 当月: ${breakdown.fromMonthlyCredits}), 用户: ${userId}`);
}

/**
 * 简化版积分返还（不需要 breakdown 信息）
 */
export async function refundCreditsSimple(
  userId: string,
  amount: number,
  productType: ProductType,
  description: string,
  taskId?: string
): Promise<void> {
  const [normalUser] = await db.select({ userId: users.userId })
    .from(users)
    .where(eq(users.userId, userId))
    .limit(1);

  const isAnonymous = !normalUser;

  if (isAnonymous) {
    await db.update(anonymousUsers)
      .set({
        credits: sql`${anonymousUsers.credits} + ${amount}`,
        totalCreditsUsed: sql`${anonymousUsers.totalCreditsUsed} - ${amount}`,
      })
      .where(eq(anonymousUsers.userId, userId));
  } else {
    await db.update(users)
      .set({
        credits: sql`${users.credits} + ${amount}`,
        totalCreditsUsed: sql`${users.totalCreditsUsed} - ${amount}`,
      })
      .where(eq(users.userId, userId));
  }

  await db.insert(creditHistory).values({
    userId,
    amount,
    description: sanitizeDescription(description),
    productType,
    taskId,
  });

  console.log(`✅ [refundCreditsSimple] 返还积分成功: ${amount}, 用户: ${userId}, 匿名: ${isAnonymous}`);
}
