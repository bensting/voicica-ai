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
 * @param userId 用户 ID
 * @param amount 扣除数量
 * @param productType 产品类型
 * @param isAnonymous 是否为匿名用户
 * @param description 描述信息
 */
export async function deductCredits(
  userId: string,
  amount: number,
  productType: ProductType,
  isAnonymous: boolean,
  description: string
): Promise<void> {
  const tableName = isAnonymous ? 'anonymous_users' : 'users';

  // 扣除积分
  if (isAnonymous) {
    await prisma.anonymous_users.update({
      where: { user_id: userId },
      data: { credits: { decrement: amount } },
    });
  } else {
    await prisma.users.update({
      where: { user_id: userId },
      data: { credits: { decrement: amount } },
    });
  }

  // 记录到 credit_history
  await prisma.credit_history.create({
    data: {
      user_id: userId,
      amount: -amount,
      description,
      product_type: productType,
    },
  });

  console.log(`✅ [deductCredits] 扣除积分成功: ${amount}, 用户: ${userId}, 表: ${tableName}`);
}

/**
 * 增加积分并记录到历史
 *
 * @param userId 用户 ID
 * @param amount 增加数量
 * @param productType 产品类型
 * @param isAnonymous 是否为匿名用户
 * @param description 描述信息
 */
export async function addCredits(
  userId: string,
  amount: number,
  productType: ProductType,
  isAnonymous: boolean,
  description: string
): Promise<void> {
  const tableName = isAnonymous ? 'anonymous_users' : 'users';

  // 增加积分
  if (isAnonymous) {
    await prisma.anonymous_users.update({
      where: { user_id: userId },
      data: { credits: { increment: amount } },
    });
  } else {
    await prisma.users.update({
      where: { user_id: userId },
      data: { credits: { increment: amount } },
    });
  }

  // 记录到 credit_history
  await prisma.credit_history.create({
    data: {
      user_id: userId,
      amount: amount,
      description,
      product_type: productType,
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