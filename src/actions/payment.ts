'use server';

/**
 * 支付模块 Server Actions
 */
import Stripe from 'stripe';
import { getCurrentUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { users, subscriptionPlans, userSubscriptions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// Lazy initialization to avoid build-time errors
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

// 支付特有的类型定义
export interface StripeCheckoutRequest {
  product_id: string;
  currency?: string;
  success_url: string;
  cancel_url: string;
}

export interface CheckoutResponse {
  checkout_url: string;
  session_id: string;
}

/**
 * 创建 Stripe Checkout 会话
 */
export async function createStripeCheckout(request: StripeCheckoutRequest): Promise<CheckoutResponse> {
  // 验证用户已登录
  const user = await getCurrentUser();
  const userId = user.uid;
  const db = await getDb();

  // 获取订阅计划
  const plans = await db
    .select()
    .from(subscriptionPlans)
    .where(
      and(
        eq(subscriptionPlans.productId, request.product_id),
        eq(subscriptionPlans.platform, 'stripe'),
        eq(subscriptionPlans.active, true)
      )
    )
    .limit(1);

  const plan = plans[0];

  if (!plan) {
    throw new Error(`订阅计划不存在: ${request.product_id}`);
  }

  // 确定货币和价格
  const currency = (request.currency || 'usd').toLowerCase();
  const priceData = plan.discountedPrice as Record<string, number> | null;
  const originalPriceData = plan.price as Record<string, number> | null;

  // 优先使用折扣价，没有则使用原价
  const priceMap = priceData || originalPriceData;
  if (!priceMap) {
    throw new Error('订阅计划没有价格信息');
  }

  // 获取指定货币的价格，回退到 USD
  const currencyKey = currency.toUpperCase();
  let unitAmount = priceMap[currencyKey];
  if (unitAmount === undefined) {
    unitAmount = priceMap['USD'];
  }
  if (unitAmount === undefined) {
    throw new Error(`不支持的货币: ${currency}`);
  }

  // 转换为分（Stripe 使用最小货币单位）
  const unitAmountInCents = Math.round(unitAmount * 100);

  // 获取用户信息（用于 Stripe customer）
  const appUser = await db.query.users.findFirst({
    where: eq(users.userId, userId),
  });

  // 构建带 session ID 的 success URL
  const successUrl = request.success_url.includes('?')
    ? `${request.success_url}&request_id={CHECKOUT_SESSION_ID}`
    : `${request.success_url}?request_id={CHECKOUT_SESSION_ID}`;

  // 创建 Stripe Checkout Session
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: plan.billingPeriod ? 'subscription' : 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: currency,
          unit_amount: unitAmountInCents,
          product_data: {
            name: (plan.displayName as Record<string, string>)?.en || plan.planName,
            description: `${plan.creditsPerCycle} credits for ${plan.cycleDays} days`,
          },
          ...(plan.billingPeriod && {
            recurring: {
              interval: plan.billingPeriod === 'year' ? 'year' : 'month',
            },
          }),
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: request.cancel_url,
    metadata: {
      user_id: userId,
      product_id: request.product_id,
      plan_id: String(plan.id),
      credits: String(plan.creditsPerCycle),
    },
    ...(appUser?.email && {
      customer_email: appUser.email,
    }),
  };

  const session = await getStripe().checkout.sessions.create({
    ...sessionParams,
    // 展开 line_items 以便在 webhook 中获取
    expand: ['line_items'],
  });

  if (!session.url) {
    throw new Error('Failed to create checkout session');
  }

  console.log(`✅ Stripe Checkout 创建成功: ${session.id}, 用户: ${userId}`);

  return {
    checkout_url: session.url,
    session_id: session.id,
  };
}

/**
 * 验证 Stripe 支付状态
 */
export async function verifyStripePayment(params: { request_id: string }): Promise<{
  success: boolean;
  payment_status: string;
  subscription_id?: string;
  message: string;
}> {
  try {
    const session = await getStripe().checkout.sessions.retrieve(params.request_id);
    const db = await getDb();

    const isPaid = session.payment_status === 'paid';

    // 查找订阅记录
    let subscriptionId: string | undefined;
    if (isPaid) {
      const subscription = await db.query.userSubscriptions.findFirst({
        where: and(
          eq(userSubscriptions.externalTransactionId, session.id),
          eq(userSubscriptions.platform, 'stripe')
        ),
      });
      subscriptionId = subscription ? String(subscription.id) : undefined;
    }

    return {
      success: isPaid,
      payment_status: session.payment_status,
      subscription_id: subscriptionId,
      message: isPaid ? '支付成功' : '支付未完成',
    };
  } catch (error) {
    console.error('验证支付状态失败:', error);
    return {
      success: false,
      payment_status: 'unknown',
      message: '验证支付状态失败',
    };
  }
}

/**
 * 获取 Stripe 产品价格列表
 */
export async function getStripePrices(productId: string): Promise<Array<{
  id: string;
  unit_amount: number;
  currency: string;
  active: boolean;
  billing_type: 'recurring' | 'one_time';
  billing_period: string | null;
}>> {
  const db = await getDb();

  // 从数据库获取订阅计划的价格信息
  const plan = await db.query.subscriptionPlans.findFirst({
    where: and(
      eq(subscriptionPlans.productId, productId),
      eq(subscriptionPlans.platform, 'stripe'),
      eq(subscriptionPlans.active, true)
    ),
  });

  if (!plan) {
    return [];
  }

  const priceData = (plan.discountedPrice || plan.price) as Record<string, number> | null;
  if (!priceData) {
    return [];
  }

  // 转换为价格数组
  return Object.entries(priceData).map(([currency, amount]) => ({
    id: `${plan.productId}_${currency}`,
    unit_amount: Math.round(amount * 100),
    currency: currency.toLowerCase(),
    active: true,
    billing_type: plan.billingPeriod ? 'recurring' : 'one_time',
    billing_period: plan.billingPeriod,
  }));
}