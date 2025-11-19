'use server';

/**
 * 订阅模块 Server Actions
 */
import Stripe from 'stripe';
import { getDb } from '@/lib/db';
import { subscriptionPlans, userSubscriptions } from '@/db/schema';
import { eq, and, gte, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import type { SubscriptionPlan, UserSubscription, UserSubscriptionListResponse } from '@/types/subscription';

// Lazy initialization to avoid build-time errors
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

/**
 * 获取订阅计划列表
 */
export async function getSubscriptionPlans(params?: {
  platform?: string;
  product_type?: string;
  active_only?: boolean;
}): Promise<SubscriptionPlan[]> {
  const { platform, product_type, active_only = true } = params || {};
  const db = await getDb();

  // 构建查询条件
  const conditions = [];
  if (active_only) {
    conditions.push(eq(subscriptionPlans.active, true));
  }
  if (platform) {
    conditions.push(eq(subscriptionPlans.platform, platform));
  }

  const plans = await db
    .select()
    .from(subscriptionPlans)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(subscriptionPlans.sortOrder);

  // 按 product_type 筛选
  let filtered = plans;
  if (product_type) {
    filtered = plans.filter((p) => p.productType === product_type);
  }

  return filtered.map((p) => ({
    id: p.id,
    platform: p.platform,
    product_type: p.productType,
    product_id: p.productId,
    base_plan_id: p.basePlanId,
    plan_name: p.planName,
    display_name: p.displayName as Record<string, string>,
    features: p.features as Record<string, string[]>,
    credits_per_cycle: p.creditsPerCycle,
    cycle_days: p.cycleDays,
    active: p.active,
    sort_order: p.sortOrder,
    price: p.price as Record<string, number>,
    discounted_price: p.discountedPrice as Record<string, number>,
    billing_period: p.billingPeriod,
    enable_first_month_coupon: p.enableFirstMonthCoupon,
    first_month_coupon_id: p.firstMonthCouponId,
  }));
}

/**
 * 根据产品 ID 获取订阅计划
 */
export async function getPlansByProductId(
  productId: string,
  activeOnly: boolean = true
): Promise<SubscriptionPlan[]> {
  const db = await getDb();

  const conditions = [eq(subscriptionPlans.productId, productId)];
  if (activeOnly) {
    conditions.push(eq(subscriptionPlans.active, true));
  }

  const plans = await db
    .select()
    .from(subscriptionPlans)
    .where(and(...conditions))
    .orderBy(subscriptionPlans.sortOrder);

  return plans.map((p) => ({
    id: p.id,
    platform: p.platform,
    product_type: p.productType,
    product_id: p.productId,
    base_plan_id: p.basePlanId,
    plan_name: p.planName,
    display_name: p.displayName as Record<string, string>,
    features: p.features as Record<string, string[]>,
    credits_per_cycle: p.creditsPerCycle,
    cycle_days: p.cycleDays,
    active: p.active,
    sort_order: p.sortOrder,
    price: p.price as Record<string, number>,
    discounted_price: p.discountedPrice as Record<string, number>,
    billing_period: p.billingPeriod,
    enable_first_month_coupon: p.enableFirstMonthCoupon,
    first_month_coupon_id: p.firstMonthCouponId,
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
  const db = await getDb();

  const conditions = [
    eq(subscriptionPlans.platform, platform),
    eq(subscriptionPlans.productId, productId),
  ];

  // 处理 basePlanId 条件
  if (basePlanId && basePlanId !== 'null') {
    conditions.push(eq(subscriptionPlans.basePlanId, basePlanId));
  }

  const plans = await db
    .select()
    .from(subscriptionPlans)
    .where(and(...conditions))
    .limit(1);

  // 如果需要 null basePlanId，在结果中过滤
  let plan = plans[0];
  if (!basePlanId || basePlanId === 'null') {
    plan = plans.find(p => p.basePlanId === null) || plans[0];
  }

  if (!plan) return null;

  return {
    id: plan.id,
    platform: plan.platform,
    product_type: plan.productType,
    product_id: plan.productId,
    base_plan_id: plan.basePlanId,
    plan_name: plan.planName,
    display_name: plan.displayName as Record<string, string>,
    features: plan.features as Record<string, string[]>,
    credits_per_cycle: plan.creditsPerCycle,
    cycle_days: plan.cycleDays,
    active: plan.active,
    sort_order: plan.sortOrder,
    price: plan.price as Record<string, number>,
    discounted_price: plan.discountedPrice as Record<string, number>,
    billing_period: plan.billingPeriod,
    enable_first_month_coupon: plan.enableFirstMonthCoupon,
    first_month_coupon_id: plan.firstMonthCouponId,
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
  const db = await getDb();

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
  const subscriptions = await db
    .select()
    .from(userSubscriptions)
    .where(and(...conditions))
    .orderBy(desc(userSubscriptions.createdAt))
    .limit(100);

  // 获取关联的计划信息
  const planIds = [...new Set(subscriptions.map(s => s.subscriptionPlanId))];
  const plans = planIds.length > 0
    ? await db.select().from(subscriptionPlans)
    : [];

  // 查询活跃订阅
  const now = new Date();
  const activeSubscriptions = await db
    .select()
    .from(userSubscriptions)
    .where(
      and(
        eq(userSubscriptions.userId, userId),
        eq(userSubscriptions.status, 'ACTIVE'),
        gte(userSubscriptions.endDate, now)
      )
    )
    .limit(1);

  const activeSubscription = activeSubscriptions[0] || null;

  // 转换为响应格式
  const toResponse = (sub: typeof subscriptions[0]): UserSubscription => {
    const isActive = sub.status === 'ACTIVE';
    let daysRemaining: number | null = null;

    if (isActive && sub.endDate) {
      daysRemaining = Math.max(0, Math.floor((sub.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }

    const plan = plans.find(p => p.id === sub.subscriptionPlanId);

    return {
      id: String(sub.id),
      user_id: sub.userId,
      subscription_plan_id: String(sub.subscriptionPlanId),
      product_id: sub.productId,
      product_type: sub.productType,
      platform: sub.platform,
      status: sub.status,
      start_date: sub.startDate.toISOString(),
      end_date: sub.endDate.toISOString(),
      credits_allocated: sub.creditsAllocated,
      amount: sub.amount ?? undefined,
      currency: sub.currency ?? undefined,
      auto_renew: sub.autoRenew,
      created_at: sub.createdAt.toISOString(),
      display_name: plan?.displayName as Record<string, string> | null,
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
  const user = await getCurrentUser();
  const userId = user.uid;
  const db = await getDb();

  const now = new Date();
  const activeSubscriptions = await db
    .select()
    .from(userSubscriptions)
    .where(
      and(
        eq(userSubscriptions.userId, userId),
        eq(userSubscriptions.status, 'ACTIVE'),
        gte(userSubscriptions.endDate, now)
      )
    )
    .limit(1);

  const activeSubscription = activeSubscriptions[0];

  if (!activeSubscription) {
    return null;
  }

  // 获取计划信息
  const plan = await db.query.subscriptionPlans.findFirst({
    where: eq(subscriptionPlans.id, activeSubscription.subscriptionPlanId),
  });

  const daysRemaining = Math.max(
    0,
    Math.floor((activeSubscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  return {
    id: String(activeSubscription.id),
    user_id: activeSubscription.userId,
    subscription_plan_id: String(activeSubscription.subscriptionPlanId),
    product_id: activeSubscription.productId,
    product_type: activeSubscription.productType,
    platform: activeSubscription.platform,
    status: activeSubscription.status,
    start_date: activeSubscription.startDate.toISOString(),
    end_date: activeSubscription.endDate.toISOString(),
    credits_allocated: activeSubscription.creditsAllocated,
    amount: activeSubscription.amount ?? undefined,
    currency: activeSubscription.currency ?? undefined,
    auto_renew: activeSubscription.autoRenew,
    created_at: activeSubscription.createdAt.toISOString(),
    display_name: plan?.displayName as Record<string, string> | null,
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
  const user = await getCurrentUser();
  const userId = user.uid;
  const db = await getDb();

  // 查找订阅
  const subscriptions = await db
    .select()
    .from(userSubscriptions)
    .where(
      and(
        eq(userSubscriptions.id, parseInt(subscriptionId)),
        eq(userSubscriptions.userId, userId)
      )
    )
    .limit(1);

  const subscription = subscriptions[0];

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

      await getStripe().subscriptions.cancel(subscription.externalSubscriptionId, {
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
  await db
    .update(userSubscriptions)
    .set({
      status: 'CANCELLED',
      autoRenew: false,
      cancelledAt: now,
      cancellationReason: data?.cancellation_reason || null,
      updatedAt: now,
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