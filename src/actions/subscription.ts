'use server';

/**
 * 订阅模块 Server Actions
 */
import Stripe from 'stripe';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-firebase';
import type { SubscriptionPlan, UserSubscription, UserSubscriptionListResponse } from '@/types/subscription';
import {
  getPlans,
  getPlanByProductId,
  convertToLegacyFormat,
  type Platform,
  type ProductType,
} from '@/config/subscription';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * 获取订阅计划列表
 *
 * 从配置文件读取，不再查询数据库
 */
export async function getSubscriptionPlans(params?: {
  platform?: string;
  product_type?: string;
  active_only?: boolean;
}): Promise<SubscriptionPlan[]> {
  const { platform = 'stripe', product_type = 'text_to_speech', active_only = true } = params || {};

  // 从配置文件获取计划
  const plans = getPlans(platform as Platform, product_type as ProductType, active_only);

  // 转换为兼容格式
  return plans.map(convertToLegacyFormat);
}

/**
 * 根据产品 ID 获取订阅计划
 *
 * 从配置文件读取
 */
export async function getPlansByProductId(
  productId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _activeOnly: boolean = true
): Promise<SubscriptionPlan[]> {
  const plan = getPlanByProductId(productId);

  if (!plan) {
    return [];
  }

  return [convertToLegacyFormat(plan)];
}

/**
 * 获取单个订阅计划
 *
 * 从配置文件读取
 */
export async function getSubscriptionPlan(
  productId: string
): Promise<SubscriptionPlan | null> {
  const plan = getPlanByProductId(productId);

  if (!plan) return null;

  return convertToLegacyFormat(plan);
}

/**
 * 获取当前用户的订阅历史
 */
export async function getMySubscriptions(params?: {
  status?: string;
  product_type?: string;
  platform?: string;
}): Promise<UserSubscriptionListResponse> {
  const user = await getCurrentUser();
  const userId = user.uid;

  const { status, product_type, platform } = params || {};

  // 构建查询条件
  const where: Record<string, unknown> = {
    user_id: userId,
  };

  if (status) {
    where.status = status;
  }

  if (product_type) {
    where.product_type = product_type;
  }

  if (platform) {
    where.platform = platform;
  }

  // 查询订阅列表
  const subscriptions = await prisma.user_subscriptions.findMany({
    where,
    orderBy: { created_at: 'desc' },
    take: 100,
  });

  // 查询活跃订阅
  const now = new Date();
  const activeSubscription = await prisma.user_subscriptions.findFirst({
    where: {
      user_id: userId,
      status: 'ACTIVE',
      end_date: { gte: now },
    },
  });

  // 转换为响应格式
  const toResponse = (sub: typeof subscriptions[0]): UserSubscription => {
    const isActive = sub.status === 'ACTIVE';
    let daysRemaining: number | null = null;

    if (isActive && sub.end_date) {
      daysRemaining = Math.max(0, Math.floor((sub.end_date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }

    // 从配置文件获取 display_name
    const plan = getPlanByProductId(sub.product_id);

    return {
      id: String(sub.id),
      user_id: sub.user_id,
      product_id: sub.product_id,
      product_type: sub.product_type,
      platform: sub.platform,
      status: sub.status,
      start_date: sub.start_date.toISOString(),
      end_date: sub.end_date.toISOString(),
      credits_allocated: sub.credits_allocated,
      amount: sub.amount ?? undefined,
      currency: sub.currency ?? undefined,
      auto_renew: sub.auto_renew,
      created_at: sub.created_at.toISOString(),
      display_name: plan?.display_name ?? null,
      is_active: isActive,
      days_remaining: daysRemaining,
      external_subscription_id: sub.external_subscription_id,
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
  const user = await getCurrentUser();
  const userId = user.uid;

  const now = new Date();
  const activeSubscription = await prisma.user_subscriptions.findFirst({
    where: {
      user_id: userId,
      status: 'ACTIVE',
      end_date: { gte: now },
    },
  });

  if (!activeSubscription) {
    return null;
  }

  const daysRemaining = Math.max(
    0,
    Math.floor((activeSubscription.end_date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  // 从配置文件获取 display_name
  const plan = getPlanByProductId(activeSubscription.product_id);

  return {
    id: String(activeSubscription.id),
    user_id: activeSubscription.user_id,
    product_id: activeSubscription.product_id,
    product_type: activeSubscription.product_type,
    platform: activeSubscription.platform,
    status: activeSubscription.status,
    start_date: activeSubscription.start_date.toISOString(),
    end_date: activeSubscription.end_date.toISOString(),
    credits_allocated: activeSubscription.credits_allocated,
    amount: activeSubscription.amount ?? undefined,
    currency: activeSubscription.currency ?? undefined,
    auto_renew: activeSubscription.auto_renew,
    created_at: activeSubscription.created_at.toISOString(),
    display_name: plan?.display_name ?? null,
    is_active: true,
    days_remaining: daysRemaining,
    external_subscription_id: activeSubscription.external_subscription_id,
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
  const user = await getCurrentUser();
  const userId = user.uid;

  // 查找订阅
  const subscription = await prisma.user_subscriptions.findFirst({
    where: {
      id: parseInt(subscriptionId),
      user_id: userId,
    },
  });

  if (!subscription) {
    throw new Error('订阅不存在或无权操作');
  }

  if (subscription.status === 'CANCELLED') {
    throw new Error('订阅已取消');
  }

  const now = new Date();

  // 如果有 Stripe 订阅 ID，调用 Stripe API 取消
  if (subscription.external_subscription_id && subscription.platform === 'stripe') {
    try {
      console.log(`🔄 取消 Stripe 订阅: ${subscription.external_subscription_id}`);

      await stripe.subscriptions.cancel(subscription.external_subscription_id, {
        cancellation_details: {
          comment: data?.cancellation_reason,
        },
      });

      console.log(`✅ Stripe 订阅已取消: ${subscription.external_subscription_id}`);
    } catch (error) {
      console.error('❌ Stripe 取消失败:', error);
      // 如果 Stripe 取消失败，仍然更新本地状态（可能是测试数据或已取消的订阅）
    }
  }

  // 更新订阅状态
  await prisma.user_subscriptions.update({
    where: { id: subscription.id },
    data: {
      status: 'CANCELLED',
      auto_renew: false,
      cancelled_at: now,
      cancellation_reason: data?.cancellation_reason || null,
      updated_at: now,
    },
  });

  console.log(`✅ 订阅已取消: ${subscriptionId}`);

  return {
    success: true,
    message: '订阅已成功取消',
    subscription_id: subscriptionId,
    canceled_at: now.toISOString(),
  };
}
