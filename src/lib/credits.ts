'use server';

/**
 * 统一的积分管理服务
 *
 * 所有积分的检查、扣除、增加操作都应该通过此服务
 */

import prisma from '@/lib/prisma';
import { ProductType } from '@/config/productType';

/**
 * 清理 description 字符串，移除可能导致 Prisma 转义问题的字符
 *
 * Prisma 会将 \x 解释为十六进制转义序列，当用户输入包含 emoji 或其他
 * 特殊字符时可能会导致 "unexpected end of hex escape" 错误
 */
function sanitizeDescription(description: string): string {
  // 移除所有 emoji 和其他非 ASCII 可打印字符，只保留基本 ASCII
  // 或者更宽松一些，保留常见的多语言字符但移除可能导致问题的控制字符
  return description
    // 移除可能导致转义问题的反斜杠序列
    .replace(/\\/g, '/')
    // 移除 emoji（Unicode surrogate pairs 和 emoji 范围）
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols and Pictographs
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and Map
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
    .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')   // Variation Selectors
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental Symbols
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // Chess Symbols
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Symbols and Pictographs Extended-A
    .replace(/[\u{231A}-\u{231B}]/gu, '')   // Watch, Hourglass
    .replace(/[\u{23E9}-\u{23F3}]/gu, '')   // Various symbols
    .replace(/[\u{23F8}-\u{23FA}]/gu, '')   // Various symbols
    .replace(/[\u{25AA}-\u{25AB}]/gu, '')   // Squares
    .replace(/[\u{25B6}]/gu, '')            // Play button
    .replace(/[\u{25C0}]/gu, '')            // Reverse button
    .replace(/[\u{25FB}-\u{25FE}]/gu, '')   // Squares
    .replace(/[\u{200D}]/gu, '')            // Zero Width Joiner
    .replace(/[\u{20E3}]/gu, '')            // Combining Enclosing Keycap
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
 *
 * 正式用户总可用积分 = credits（永久积分） + monthly_credits（当月积分）
 *
 * @param userId 用户 ID
 * @param required 所需积分
 * @param isAnonymous 是否为匿名用户
 * @returns 检查结果（是否足够、当前积分）
 */
export async function checkCredits(
  userId: string,
  required: number,
  isAnonymous: boolean
): Promise<CheckCreditsResult> {
  if (isAnonymous) {
    const user = await prisma.anonymous_users.findUnique({
      where: { user_id: userId },
      select: { credits: true },
    });
    const current = user?.credits ?? 0;
    return { hasEnough: current >= required, current };
  } else {
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      select: { credits: true, monthly_credits: true },
    });
    // 总可用积分 = 永久积分 + 当月积分
    const current = (user?.credits ?? 0) + (user?.monthly_credits ?? 0);
    return { hasEnough: current >= required, current };
  }
}

/**
 * 获取用户当前积分
 *
 * 正式用户总可用积分 = credits（永久积分） + monthly_credits（当月积分）
 *
 * @param userId 用户 ID
 * @param isAnonymous 是否为匿名用户
 * @returns 当前积分数量
 */
export async function getCredits(
  userId: string,
  isAnonymous: boolean
): Promise<number> {
  if (isAnonymous) {
    const user = await prisma.anonymous_users.findUnique({
      where: { user_id: userId },
      select: { credits: true },
    });
    return user?.credits ?? 0;
  } else {
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      select: { credits: true, monthly_credits: true },
    });
    // 总可用积分 = 永久积分 + 当月积分
    return (user?.credits ?? 0) + (user?.monthly_credits ?? 0);
  }
}

/**
 * 扣除积分并记录到历史
 *
 * 扣减顺序：先扣当月积分(monthly_credits)，再扣永久积分(credits)
 *
 * @param userId 用户 ID
 * @param amount 扣除数量
 * @param productType 产品类型
 * @param isAnonymous 是否为匿名用户
 * @param description 描述信息
 * @param taskId 任务 ID（可选）
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

  // 扣除积分并更新累计使用量
  if (isAnonymous) {
    // 匿名用户：直接从 credits 扣减（匿名用户没有分类积分）
    await prisma.anonymous_users.update({
      where: { user_id: userId },
      data: {
        credits: { decrement: amount },
        total_credits_used: { increment: amount },
      },
    });
  } else {
    // 正式用户：先扣当月积分，再扣永久积分(credits)
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      select: { monthly_credits: true, credits: true },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    // 计算扣减分配：先扣当月积分，再扣永久积分
    const fromMonthly = Math.min(user.monthly_credits, amount);
    const fromCredits = amount - fromMonthly;

    await prisma.users.update({
      where: { user_id: userId },
      data: {
        credits: { decrement: fromCredits },
        monthly_credits: { decrement: fromMonthly },
        total_credits_used: { increment: amount },
      },
    });
  }

  // 记录到 credit_history
  await prisma.credit_history.create({
    data: {
      user_id: userId,
      amount: -amount,
      description: sanitizeDescription(description),
      product_type: productType,
      task_id: taskId,
    },
  });

  console.log(`✅ [deductCredits] 扣除积分成功: ${amount}, 用户: ${userId}, 表: ${tableName}`);
}

/**
 * 增加积分并记录到历史
 *
 * 购买/订阅/退款增加的积分会加到 credits（永久积分，永不过期）
 *
 * @param userId 用户 ID
 * @param amount 增加数量
 * @param productType 产品类型
 * @param isAnonymous 是否为匿名用户
 * @param description 描述信息
 * @param taskId 任务 ID（可选）
 * @param updateTotalUsed 是否更新累计使用量（默认 false，用于退款场景）
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

  // 增加积分，并根据需要更新累计使用量（退款时需要减少累计使用量）
  if (isAnonymous) {
    // 匿名用户：只有一个 credits 字段
    await prisma.anonymous_users.update({
      where: { user_id: userId },
      data: {
        credits: { increment: amount },
        ...(updateTotalUsed ? { total_credits_used: { decrement: amount } } : {}),
      },
    });
  } else {
    // 正式用户：购买/订阅/退款增加的积分加到 credits（永久积分）
    await prisma.users.update({
      where: { user_id: userId },
      data: {
        credits: { increment: amount },
        ...(updateTotalUsed ? { total_credits_used: { decrement: amount } } : {}),
      },
    });
  }

  // 记录到 credit_history
  await prisma.credit_history.create({
    data: {
      user_id: userId,
      amount: amount,
      description: sanitizeDescription(description),
      product_type: productType,
      task_id: taskId,
    },
  });

  console.log(`✅ [addCredits] 增加积分成功: ${amount}, 用户: ${userId}, 表: ${tableName}`);
}

/**
 * 检查并扣除积分（组合操作）
 *
 * 常用于需要先检查积分是否足够，再扣除的场景
 *
 * @param userId 用户 ID
 * @param amount 扣除数量
 * @param productType 产品类型
 * @param isAnonymous 是否为匿名用户
 * @param description 描述信息
 * @throws {InsufficientCreditsError} 积分不足时抛出错误
 */
export async function checkAndDeductCredits(
  userId: string,
  amount: number,
  productType: ProductType,
  isAnonymous: boolean,
  description: string
): Promise<void> {
  // 检查积分
  const { hasEnough, current } = await checkCredits(userId, amount, isAnonymous);

  if (!hasEnough) {
    const { InsufficientCreditsError } = await import('@/lib/errors');
    throw new InsufficientCreditsError(amount, current);
  }

  // 扣除积分
  await deductCredits(userId, amount, productType, isAnonymous, description);
}

/**
 * 积分扣减详情（用于精确返还）
 */
export interface DeductionBreakdown {
  fromCredits: number;      // 从永久积分扣减的数量
  fromMonthlyCredits: number; // 从当月积分扣减的数量
  total: number;            // 总扣减数量
}

/**
 * 原子性扣除积分（使用事务）
 *
 * 使用乐观锁机制，确保扣除时余额充足，避免竞态条件
 * 适用于高并发场景（如任务队列处理）
 * 扣减顺序：先扣当月积分(monthly_credits)，再扣永久积分(credits)
 *
 * @param userId 用户 ID
 * @param amount 扣除数量
 * @param productType 产品类型
 * @param isAnonymous 是否为匿名用户
 * @param description 描述信息
 * @param taskId 任务 ID（可选）
 * @returns 扣减详情，包含从各积分池扣减的具体数量
 * @throws {Error} 余额不足时抛出错误
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

  await prisma.$transaction(async (tx) => {
    if (isAnonymous) {
      // 匿名用户：直接从 credits 扣减（匿名用户没有 monthly_credits）
      const result = await tx.anonymous_users.updateMany({
        where: {
          user_id: userId,
          credits: { gte: amount },
        },
        data: {
          credits: { decrement: amount },
          total_credits_used: { increment: amount },
        },
      });

      if (result.count === 0) {
        throw new Error('积分扣减失败，余额不足');
      }

      breakdown = {
        fromCredits: amount,
        fromMonthlyCredits: 0,
        total: amount,
      };
    } else {
      // 正式用户：先查询当前积分分布，再计算扣减分配
      const user = await tx.users.findUnique({
        where: { user_id: userId },
        select: { credits: true, monthly_credits: true },
      });

      // 总可用积分 = 永久积分 + 当月积分
      const totalCredits = (user?.credits ?? 0) + (user?.monthly_credits ?? 0);
      if (!user || totalCredits < amount) {
        throw new Error('积分扣减失败，余额不足');
      }

      // 计算扣减分配：先扣当月积分，再扣永久积分(credits)
      const fromMonthly = Math.min(user.monthly_credits, amount);
      const fromCredits = amount - fromMonthly;

      await tx.users.update({
        where: { user_id: userId },
        data: {
          credits: { decrement: fromCredits },
          monthly_credits: { decrement: fromMonthly },
          total_credits_used: { increment: amount },
        },
      });

      breakdown = {
        fromCredits,
        fromMonthlyCredits: fromMonthly,
        total: amount,
      };
    }

    // 记录到 credit_history
    await tx.credit_history.create({
      data: {
        user_id: userId,
        amount: -amount,
        description: sanitizeDescription(description),
        product_type: productType,
        task_id: taskId,
      },
    });
  });

  console.log(`✅ [deductCreditsAtomic] 原子性扣除积分成功: ${amount} (永久: ${breakdown.fromCredits}, 当月: ${breakdown.fromMonthlyCredits}), 用户: ${userId}`);

  return breakdown;
}

/**
 * 精确返还积分（根据扣减详情返还到原处）
 *
 * @param userId 用户 ID
 * @param breakdown 扣减详情
 * @param productType 产品类型
 * @param isAnonymous 是否为匿名用户
 * @param description 描述信息
 * @param taskId 任务 ID（可选）
 */
export async function refundCredits(
  userId: string,
  breakdown: DeductionBreakdown,
  productType: ProductType,
  isAnonymous: boolean,
  description: string,
  taskId?: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    if (isAnonymous) {
      // 匿名用户：返还到 credits
      await tx.anonymous_users.update({
        where: { user_id: userId },
        data: {
          credits: { increment: breakdown.total },
          total_credits_used: { decrement: breakdown.total },
        },
      });
    } else {
      // 正式用户：精确返还到原来的积分池
      await tx.users.update({
        where: { user_id: userId },
        data: {
          credits: { increment: breakdown.fromCredits },
          monthly_credits: { increment: breakdown.fromMonthlyCredits },
          total_credits_used: { decrement: breakdown.total },
        },
      });
    }

    // 记录到 credit_history
    await tx.credit_history.create({
      data: {
        user_id: userId,
        amount: breakdown.total,
        description: sanitizeDescription(description),
        product_type: productType,
        task_id: taskId,
      },
    });
  });

  console.log(`✅ [refundCredits] 精确返还积分成功: ${breakdown.total} (永久: ${breakdown.fromCredits}, 当月: ${breakdown.fromMonthlyCredits}), 用户: ${userId}`);
}

/**
 * 简化版积分返还（不需要 breakdown 信息）
 *
 * 用于 KIE 等异步任务失败时的积分返还，此时无法获取原始扣减详情。
 * 返还的积分全部加到永久积分(credits)，对用户更有利（永久积分不会过期）。
 *
 * @param userId 用户 ID
 * @param amount 返还数量
 * @param productType 产品类型
 * @param description 描述信息
 * @param taskId 任务 ID（可选）
 */
export async function refundCreditsSimple(
  userId: string,
  amount: number,
  productType: ProductType,
  description: string,
  taskId?: string
): Promise<void> {
  // 判断是否为匿名用户：先尝试在 users 表中查找
  const normalUser = await prisma.users.findUnique({
    where: { user_id: userId },
    select: { user_id: true },
  });

  const isAnonymous = !normalUser;

  await prisma.$transaction(async (tx) => {
    if (isAnonymous) {
      // 匿名用户：返还到 credits
      await tx.anonymous_users.update({
        where: { user_id: userId },
        data: {
          credits: { increment: amount },
          total_credits_used: { decrement: amount },
        },
      });
    } else {
      // 正式用户：返还到永久积分(credits)
      await tx.users.update({
        where: { user_id: userId },
        data: {
          credits: { increment: amount },
          total_credits_used: { decrement: amount },
        },
      });
    }

    // 记录到 credit_history
    await tx.credit_history.create({
      data: {
        user_id: userId,
        amount: amount,
        description: sanitizeDescription(description),
        product_type: productType,
        task_id: taskId,
      },
    });
  });

  console.log(`✅ [refundCreditsSimple] 返还积分成功: ${amount}, 用户: ${userId}, 匿名: ${isAnonymous}`);
}