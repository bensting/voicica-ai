'use server';

/**
 * 统一的积分管理服务
 *
 * 所有积分的检查、扣除、增加操作都应该通过此服务
 */

import prisma from '@/lib/prisma';
import { ProductType } from '@/config/productType';

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
      select: { credits: true },
    });
    const current = user?.credits ?? 0;
    return { hasEnough: current >= required, current };
  }
}

/**
 * 获取用户当前积分
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
      select: { credits: true },
    });
    return user?.credits ?? 0;
  }
}

/**
 * 扣除积分并记录到历史
 *
 * 扣减顺序：先扣当月积分(monthly_credits)，再扣永久积分(permanent_credits)
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
    // 正式用户：先扣当月积分，再扣永久积分
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      select: { monthly_credits: true, permanent_credits: true },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    // 计算扣减分配
    const fromMonthly = Math.min(user.monthly_credits, amount);
    const fromPermanent = amount - fromMonthly;

    await prisma.users.update({
      where: { user_id: userId },
      data: {
        credits: { decrement: amount },
        monthly_credits: { decrement: fromMonthly },
        permanent_credits: { decrement: fromPermanent },
        total_credits_used: { increment: amount },
      },
    });
  }

  // 记录到 credit_history
  await prisma.credit_history.create({
    data: {
      user_id: userId,
      amount: -amount,
      description,
      product_type: productType,
      task_id: taskId,
    },
  });

  console.log(`✅ [deductCredits] 扣除积分成功: ${amount}, 用户: ${userId}, 表: ${tableName}`);
}

/**
 * 增加积分并记录到历史
 *
 * 购买/订阅/退款增加的积分会加到 permanent_credits（永不过期）
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
    // 正式用户：购买/订阅/退款增加的积分加到 permanent_credits
    await prisma.users.update({
      where: { user_id: userId },
      data: {
        credits: { increment: amount },
        permanent_credits: { increment: amount },
        ...(updateTotalUsed ? { total_credits_used: { decrement: amount } } : {}),
      },
    });
  }

  // 记录到 credit_history
  await prisma.credit_history.create({
    data: {
      user_id: userId,
      amount: amount,
      description,
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
 * 原子性扣除积分（使用事务）
 *
 * 使用乐观锁机制，确保扣除时余额充足，避免竞态条件
 * 适用于高并发场景（如任务队列处理）
 * 扣减顺序：先扣当月积分(monthly_credits)，再扣永久积分(permanent_credits)
 *
 * @param userId 用户 ID
 * @param amount 扣除数量
 * @param productType 产品类型
 * @param isAnonymous 是否为匿名用户
 * @param description 描述信息
 * @param taskId 任务 ID（可选）
 * @throws {Error} 余额不足时抛出错误
 */
export async function deductCreditsAtomic(
  userId: string,
  amount: number,
  productType: ProductType,
  isAnonymous: boolean,
  description: string,
  taskId?: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    if (isAnonymous) {
      // 匿名用户：直接从 credits 扣减
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
    } else {
      // 正式用户：先查询当前积分分布，再计算扣减分配
      const user = await tx.users.findUnique({
        where: { user_id: userId },
        select: { credits: true, monthly_credits: true, permanent_credits: true },
      });

      if (!user || user.credits < amount) {
        throw new Error('积分扣减失败，余额不足');
      }

      // 计算扣减分配：先扣当月积分，再扣永久积分
      const fromMonthly = Math.min(user.monthly_credits, amount);
      const fromPermanent = amount - fromMonthly;

      const result = await tx.users.updateMany({
        where: {
          user_id: userId,
          credits: { gte: amount },
        },
        data: {
          credits: { decrement: amount },
          monthly_credits: { decrement: fromMonthly },
          permanent_credits: { decrement: fromPermanent },
          total_credits_used: { increment: amount },
        },
      });

      if (result.count === 0) {
        throw new Error('积分扣减失败，余额不足');
      }
    }

    // 记录到 credit_history
    await tx.credit_history.create({
      data: {
        user_id: userId,
        amount: -amount,
        description,
        product_type: productType,
        task_id: taskId,
      },
    });
  });

  console.log(`✅ [deductCreditsAtomic] 原子性扣除积分成功: ${amount}, 用户: ${userId}`);
}