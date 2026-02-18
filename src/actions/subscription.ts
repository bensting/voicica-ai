'use server';

/**
 * 订阅模块 Server Actions
 */
import db from '@/lib/db';
import { userSubscriptions } from '@/db/schema';
import { eq, and, gte, desc } from 'drizzle-orm';
import { getUserOrAnonymous } from '@/lib/auth-firebase';
import type { UserSubscription, UserSubscriptionListResponse } from '@/types/subscription';
import {
  getPlans,
  getPlanByProductId,
  getCreditTierByProductId,
  type Platform,
  type SubscriptionPlanConfig,
} from '@/config/subscription';
import { cancelStripeSubscription } from '@/lib/stripe-api';

/**
 * 获取订阅计划列表
 *
 * 从配置文件读取，不再查询数据库
 */
export async function getSubscriptionPlans(params?: {
  platform?: string;
  active_only?: boolean;
}): Promise<SubscriptionPlanConfig[]> {
  const { platform = 'stripe', active_only = true } = params || {};

  // 从配置文件获取计划
  return getPlans(platform as Platform, active_only);
}

/**
 * 根据产品 ID 获取订阅计划
 *
 * 从配置文件读取
 */
export async function getPlansByProductId(
  productId: string
): Promise<SubscriptionPlanConfig[]> {
  const plan = getPlanByProductId(productId);

  if (!plan) {
    return [];
  }

  return [plan];
}

/**
 * 获取单个订阅计划
 *
 * 从配置文件读取
 */
export async function getSubscriptionPlan(
  productId: string
): Promise<SubscriptionPlanConfig | null> {
  return getPlanByProductId(productId);
}

/**
 * 根据产品 ID 获取积分档位信息
 */
export async function getCreditTierInfo(productId: string) {
  return getCreditTierByProductId(productId);
}

/**
 * 获取当前用户的订阅历史
 */
export async function getMySubscriptions(params?: {
  status?: string;
  product_type?: string;
  platform?: string;
}): Promise<UserSubscriptionListResponse> {
  const { user_id: userId } = await getUserOrAnonymous();

  const { status, product_type, platform } = params || {};

  // 构建查询条件
  const conditions = [eq(userSubscriptions.userId, userId)];

  if (status) {
    conditions.push(eq(userSubscriptions.status, status));
  }

  if (product_type) {
    conditions.push(eq(userSubscriptions.productType, product_type));
  }

  if (platform) {
    conditions.push(eq(userSubscriptions.platform, platform));
  }

  // 查询订阅列表
  const subscriptions = await db.select().from(userSubscriptions)
    .where(and(...conditions))
    .orderBy(desc(userSubscriptions.createdAt))
    .limit(100);

  // 查询活跃订阅
  const now = new Date();
  const [activeSubscription] = await db.select().from(userSubscriptions)
    .where(and(
      eq(userSubscriptions.userId, userId),
      eq(userSubscriptions.status, 'ACTIVE'),
      gte(userSubscriptions.endDate, now.toISOString()),
    ))
    .limit(1);

  // 转换为响应格式
  const toResponse = (sub: typeof subscriptions[0]): UserSubscription => {
    const isActive = sub.status === 'ACTIVE';
    let daysRemaining: number | null = null;

    if (isActive && sub.endDate) {
      daysRemaining = Math.max(0, Math.floor((new Date(sub.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }

    // 从配置文件获取 display_name
    const plan = getPlanByProductId(sub.productId);

    return {
      id: String(sub.id),
      user_id: sub.userId,
      product_id: sub.productId,
      product_type: sub.productType,
      platform: sub.platform,
      status: sub.status,
      start_date: sub.startDate,
      end_date: sub.endDate,
      credits_allocated: sub.creditsAllocated,
      amount: sub.amount ?? undefined,
      currency: sub.currency ?? undefined,
      auto_renew: sub.autoRenew,
      created_at: sub.createdAt,
      display_name: plan?.display_name ?? null,
      is_active: isActive,
      days_remaining: daysRemaining,
      external_subscription_id: sub.externalSubscriptionId,
    };
  };

  return {
    subscriptions: subscriptions.map(toResponse),
    total: subscriptions.length,
    active_subscription: activeSubscription ? toResponse(activeSubscription) : null,
  };
}

/**
 * 获取当前用户的活跃订阅
 */
export async function getMyActiveSubscription(): Promise<UserSubscription | null> {
  const { user_id: userId } = await getUserOrAnonymous();

  const now = new Date();
  const [activeSubscription] = await db.select().from(userSubscriptions)
    .where(and(
      eq(userSubscriptions.userId, userId),
      eq(userSubscriptions.status, 'ACTIVE'),
      gte(userSubscriptions.endDate, now.toISOString()),
    ))
    .limit(1);

  if (!activeSubscription) {
    return null;
  }

  const daysRemaining = Math.max(
    0,
    Math.floor((new Date(activeSubscription.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  // 从配置文件获取 display_name
  const plan = getPlanByProductId(activeSubscription.productId);

  return {
    id: String(activeSubscription.id),
    user_id: activeSubscription.userId,
    product_id: activeSubscription.productId,
    product_type: activeSubscription.productType,
    platform: activeSubscription.platform,
    status: activeSubscription.status,
    start_date: activeSubscription.startDate,
    end_date: activeSubscription.endDate,
    credits_allocated: activeSubscription.creditsAllocated,
    amount: activeSubscription.amount ?? undefined,
    currency: activeSubscription.currency ?? undefined,
    auto_renew: activeSubscription.autoRenew,
    created_at: activeSubscription.createdAt,
    display_name: plan?.display_name ?? null,
    is_active: true,
    days_remaining: daysRemaining,
    external_subscription_id: activeSubscription.externalSubscriptionId,
  };
}

/**
 * 取消订阅
 */
export async function cancelSubscription(
  subscriptionId: string,
  data?: { cancellation_reason?: string }
): Promise<{
  success: boolean;
  message: string;
  subscription_id: string;
  canceled_at: string;
}> {
  const { user_id: userId } = await getUserOrAnonymous();

  // 查找订阅
  const [subscription] = await db.select().from(userSubscriptions)
    .where(and(
      eq(userSubscriptions.id, parseInt(subscriptionId)),
      eq(userSubscriptions.userId, userId),
    ))
    .limit(1);

  if (!subscription) {
    throw new Error('订阅不存在或无权操作');
  }

  if (subscription.status === 'CANCELLED') {
    throw new Error('订阅已取消');
  }

  const now = new Date();

  // 如果有 Stripe 订阅 ID，调用 Stripe API 取消
  if (subscription.externalSubscriptionId && subscription.platform === 'stripe') {
    try {
      console.log(`🔄 取消 Stripe 订阅: ${subscription.externalSubscriptionId}`);

      await cancelStripeSubscription(subscription.externalSubscriptionId, {
        cancellation_details: {
          comment: data?.cancellation_reason,
        },
      });

      console.log(`✅ Stripe 订阅已取消: ${subscription.externalSubscriptionId}`);
    } catch (error) {
      console.error('❌ Stripe 取消失败:', error);
      // 如果 Stripe 取消失败，仍然更新本地状态（可能是测试数据或已取消的订阅）
    }
  }

  // 更新订阅状态
  await db.update(userSubscriptions)
    .set({
      status: 'CANCELLED',
      autoRenew: false,
      cancelledAt: now.toISOString(),
      cancellationReason: data?.cancellation_reason || null,
      updatedAt: now.toISOString(),
    })
    .where(eq(userSubscriptions.id, subscription.id));

  console.log(`✅ 订阅已取消: ${subscriptionId}`);

  return {
    success: true,
    message: '订阅已成功取消',
    subscription_id: subscriptionId,
    canceled_at: now.toISOString(),
  };
}
