'use server';

/**
 * 订阅模块 Server Actions
 */
import Stripe from 'stripe';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { SubscriptionPlan, UserSubscription, UserSubscriptionListResponse } from '@/types/subscription';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * 获取订阅计划列表
 */
export async function getSubscriptionPlans(params?: {
  platform?: string;
  product_type?: string;
  active_only?: boolean;
}): Promise<SubscriptionPlan[]> {
  const { platform, product_type, active_only = true } = params || {};

  const where: Record<string, unknown> = {};

  if (active_only) {
    where.active = true;
  }

  if (platform) {
    where.platform = platform;
  }

  const plans = await prisma.subscription_plans.findMany({
    where,
    orderBy: { sort_order: 'asc' },
  });

  // 按 product_type 筛选
  let filtered = plans;
  if (product_type) {
    filtered = plans.filter((p) => p.product_type === product_type);
  }

  return filtered.map((p) => ({
    id: p.id,
    platform: p.platform,
    product_type: p.product_type,
    product_id: p.product_id,
    base_plan_id: p.base_plan_id,
    plan_name: p.plan_name,
    display_name: p.display_name as Record<string, string>,
    features: p.features as Record<string, string[]>,
    credits_per_cycle: p.credits_per_cycle,
    cycle_days: p.cycle_days,
    active: p.active,
    sort_order: p.sort_order,
    price: p.price as Record<string, number>,
    discounted_price: p.discounted_price as Record<string, number>,
    billing_period: p.billing_period,
    enable_first_month_coupon: p.enable_first_month_coupon,
    first_month_coupon_id: p.first_month_coupon_id,
  }));
}

/**
 * 根据产品 ID 获取订阅计划
 */
export async function getPlansByProductId(
  productId: string,
  activeOnly: boolean = true
): Promise<SubscriptionPlan[]> {
  const where: Record<string, unknown> = {
    product_id: productId,
  };

  if (activeOnly) {
    where.active = true;
  }

  const plans = await prisma.subscription_plans.findMany({
    where,
    orderBy: { sort_order: 'asc' },
  });

  return plans.map((p) => ({
    id: p.id,
    platform: p.platform,
    product_type: p.product_type,
    product_id: p.product_id,
    base_plan_id: p.base_plan_id,
    plan_name: p.plan_name,
    display_name: p.display_name as Record<string, string>,
    features: p.features as Record<string, string[]>,
    credits_per_cycle: p.credits_per_cycle,
    cycle_days: p.cycle_days,
    active: p.active,
    sort_order: p.sort_order,
    price: p.price as Record<string, number>,
    discounted_price: p.discounted_price as Record<string, number>,
    billing_period: p.billing_period,
    enable_first_month_coupon: p.enable_first_month_coupon,
    first_month_coupon_id: p.first_month_coupon_id,
  }));
}

/**
 * 获取单个订阅计划
 */
export async function getSubscriptionPlan(
  platform: string,
  productId: string,
  basePlanId: string | null
): Promise<SubscriptionPlan | null> {
  const where: Record<string, unknown> = {
    platform,
    product_id: productId,
  };

  if (basePlanId && basePlanId !== 'null') {
    where.base_plan_id = basePlanId;
  } else {
    where.base_plan_id = null;
  }

  const plan = await prisma.subscription_plans.findFirst({ where });

  if (!plan) return null;

  return {
    id: plan.id,
    platform: plan.platform,
    product_type: plan.product_type,
    product_id: plan.product_id,
    base_plan_id: plan.base_plan_id,
    plan_name: plan.plan_name,
    display_name: plan.display_name as Record<string, string>,
    features: plan.features as Record<string, string[]>,
    credits_per_cycle: plan.credits_per_cycle,
    cycle_days: plan.cycle_days,
    active: plan.active,
    sort_order: plan.sort_order,
    price: plan.price as Record<string, number>,
    discounted_price: plan.discounted_price as Record<string, number>,
    billing_period: plan.billing_period,
    enable_first_month_coupon: plan.enable_first_month_coupon,
    first_month_coupon_id: plan.first_month_coupon_id,
  };
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
    include: {
      subscription_plans: true,
    },
  });

  // 查询活跃订阅
  const now = new Date();
  const activeSubscription = await prisma.user_subscriptions.findFirst({
    where: {
      user_id: userId,
      status: 'ACTIVE',
      end_date: { gte: now },
    },
    include: {
      subscription_plans: true,
    },
  });

  // 转换为响应格式
  const toResponse = (sub: typeof subscriptions[0]): UserSubscription => {
    const isActive = sub.status === 'ACTIVE';
    let daysRemaining: number | null = null;

    if (isActive && sub.end_date) {
      daysRemaining = Math.max(0, Math.floor((sub.end_date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }

    return {
      id: String(sub.id),
      user_id: sub.user_id,
      subscription_plan_id: String(sub.subscription_plan_id),
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
      display_name: sub.subscription_plans?.display_name as Record<string, string> | null,
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
    include: {
      subscription_plans: true,
    },
  });

  if (!activeSubscription) {
    return null;
  }

  const daysRemaining = Math.max(
    0,
    Math.floor((activeSubscription.end_date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  return {
    id: String(activeSubscription.id),
    user_id: activeSubscription.user_id,
    subscription_plan_id: String(activeSubscription.subscription_plan_id),
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
    display_name: activeSubscription.subscription_plans?.display_name as Record<string, string> | null,
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
