import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getDb } from '@/lib/db';
import { subscriptionPlans, userSubscriptions, users, creditHistory, subscriptionHistory } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

// Lazy initialization to avoid build-time errors
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

function getWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET!;
}

/**
 * 记录订阅历史
 */
async function recordSubscriptionHistory(params: {
  subscriptionId: number;
  userId: string;
  eventType: string;
  oldStatus?: string;
  newStatus?: string;
  stripeEventId: string;
  stripeEventType: string;
  amount?: number;
  currency?: string;
  creditsChange?: number;
  metadata?: object;
}) {
  try {
    const db = await getDb();
    await db.insert(subscriptionHistory).values({
      subscriptionId: params.subscriptionId,
      userId: params.userId,
      eventType: params.eventType,
      oldStatus: params.oldStatus,
      newStatus: params.newStatus,
      stripeEventId: params.stripeEventId,
      stripeEventType: params.stripeEventType,
      amount: params.amount,
      currency: params.currency,
      creditsChange: params.creditsChange,
      metadata: params.metadata,
    });
    console.log(`📝 订阅历史已记录: ${params.eventType} for subscription ${params.subscriptionId}`);
  } catch (error) {
    // 如果是重复事件（stripe_event_id unique constraint），忽略
    if ((error as { code?: string }).code === 'SQLITE_CONSTRAINT') {
      console.log(`⏭️ 事件已处理过，跳过: ${params.stripeEventId}`);
      return;
    }
    throw error;
  }
}

/**
 * 处理 checkout.session.completed 事件
 * 用户完成支付后触发
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session, eventId: string) {
  console.log('💳 处理 checkout.session.completed:', session.id);

  const metadata = session.metadata || {};
  const userId = metadata.user_id;
  const productId = metadata.product_id;

  if (!userId || !productId) {
    console.error('❌ 缺少必要的 metadata:', { userId, productId });
    return;
  }

  const db = await getDb();

  // 获取订阅计划
  const plan = await db.query.subscriptionPlans.findFirst({
    where: and(
      eq(subscriptionPlans.productId, productId),
      eq(subscriptionPlans.active, true)
    ),
  });

  if (!plan) {
    console.error(`❌ 找不到订阅计划: ${productId}`);
    return;
  }

  // 获取金额和货币（从 line items 或 session）
  const lineItem = session.line_items?.data?.[0];
  const amount = session.amount_total ?? lineItem?.amount_total ?? null;
  const currency = (session.currency ?? lineItem?.currency)?.toUpperCase() ?? null;

  // 判断是否为订阅模式
  const isSubscription = session.mode === 'subscription';
  const stripeSubscriptionId = typeof session.subscription === 'string'
    ? session.subscription
    : session.subscription?.id ?? null;

  // 计算订阅日期
  const now = new Date();
  let endDate: Date;

  if (isSubscription && stripeSubscriptionId) {
    // 订阅模式：从 Stripe 获取周期结束时间
    try {
      const stripeSubscription = await getStripe().subscriptions.retrieve(stripeSubscriptionId);
      const currentPeriodEnd = (stripeSubscription as unknown as { current_period_end: number }).current_period_end;
      endDate = new Date(currentPeriodEnd * 1000);
      console.log(`📅 从 Stripe 获取订阅周期: ${now.toISOString()} - ${endDate.toISOString()}`);
    } catch (error) {
      console.error('⚠️ 获取 Stripe 订阅失败，使用 cycle_days 计算:', error);
      endDate = new Date(now);
      endDate.setDate(endDate.getDate() + plan.cycleDays);
    }
  } else {
    // 一次性支付：用 cycle_days 计算
    endDate = new Date(now);
    endDate.setDate(endDate.getDate() + plan.cycleDays);
    console.log(`📅 一次性支付，使用 cycle_days (${plan.cycleDays}) 计算: ${now.toISOString()} - ${endDate.toISOString()}`);
  }

  console.log('📊 Checkout 数据:', {
    amount,
    currency,
    mode: session.mode,
    subscription_id: stripeSubscriptionId,
  });

  // 创建订阅记录
  const result = await db
    .insert(userSubscriptions)
    .values({
      userId: userId,
      subscriptionPlanId: plan.id,
      productId: productId,
      productType: plan.productType,
      platform: 'stripe',
      externalTransactionId: session.id,
      externalSubscriptionId: stripeSubscriptionId,
      requestId: `stripe_${session.id}`,
      status: 'ACTIVE',
      startDate: now,
      endDate: endDate,
      creditsAllocated: plan.creditsPerCycle,
      amount: amount,
      currency: currency,
      autoRenew: isSubscription,
      cancelAtPeriodEnd: false,
      activatedAt: now,
    })
    .returning();

  const subscription = result[0];

  // 给用户添加积分
  await db
    .update(users)
    .set({
      credits: sql`${users.credits} + ${plan.creditsPerCycle}`,
    })
    .where(eq(users.userId, userId));

  // 记录积分变动历史
  await db.insert(creditHistory).values({
    userId: userId,
    amount: plan.creditsPerCycle,
    description: `订阅购买: ${plan.planName}`,
    taskId: `subscription_${subscription.id}`,
  });

  console.log(`✅ 订阅已创建: ${subscription.id}, 积分: +${plan.creditsPerCycle}`);

  // 记录历史
  await recordSubscriptionHistory({
    subscriptionId: subscription.id,
    userId,
    eventType: 'CREATED',
    newStatus: 'ACTIVE',
    stripeEventId: eventId,
    stripeEventType: 'checkout.session.completed',
    amount: amount || undefined,
    currency: currency || undefined,
    creditsChange: plan.creditsPerCycle,
    metadata: {
      session_id: session.id,
      plan_name: plan.planName,
      cycle_days: plan.cycleDays,
    },
  });
}

/**
 * 处理 invoice.paid 事件
 * 订阅续费成功后触发
 */
async function handleInvoicePaid(invoice: Stripe.Invoice, eventId: string) {
  console.log('💰 处理 invoice.paid:', invoice.id);

  // 从 line items 获取订阅 ID
  const lineItem = invoice.lines?.data?.[0];
  const subscriptionId = lineItem?.parent?.subscription_item_details?.subscription;

  if (!subscriptionId) {
    console.log('⏭️ 非订阅发票，跳过');
    return;
  }

  const db = await getDb();

  // 查找现有订阅
  const subscription = await db.query.userSubscriptions.findFirst({
    where: and(
      eq(userSubscriptions.externalSubscriptionId, subscriptionId),
      eq(userSubscriptions.platform, 'stripe')
    ),
  });

  if (!subscription) {
    console.log(`⏭️ 未找到订阅记录: ${subscriptionId}`);
    return;
  }

  // 获取计划信息
  const plan = await db.query.subscriptionPlans.findFirst({
    where: eq(subscriptionPlans.id, subscription.subscriptionPlanId),
  });

  if (!plan) {
    console.log(`⏭️ 未找到计划记录: ${subscription.subscriptionPlanId}`);
    return;
  }

  const oldStatus = subscription.status;

  // 更新订阅日期
  const now = new Date();
  const newEndDate = new Date(subscription.endDate);
  newEndDate.setDate(newEndDate.getDate() + plan.cycleDays);

  await db
    .update(userSubscriptions)
    .set({
      status: 'ACTIVE',
      endDate: newEndDate,
      updatedAt: now,
    })
    .where(eq(userSubscriptions.id, subscription.id));

  // 给用户添加积分
  await db
    .update(users)
    .set({
      credits: sql`${users.credits} + ${plan.creditsPerCycle}`,
    })
    .where(eq(users.userId, subscription.userId));

  // 记录积分变动历史
  await db.insert(creditHistory).values({
    userId: subscription.userId,
    amount: plan.creditsPerCycle,
    description: `订阅续费: ${plan.planName}`,
    taskId: `subscription_${subscription.id}_renewal`,
  });

  console.log(`✅ 订阅已续费: ${subscription.id}, 积分: +${plan.creditsPerCycle}`);

  // 记录历史
  await recordSubscriptionHistory({
    subscriptionId: subscription.id,
    userId: subscription.userId,
    eventType: 'RENEWED',
    oldStatus,
    newStatus: 'ACTIVE',
    stripeEventId: eventId,
    stripeEventType: 'invoice.paid',
    amount: invoice.amount_paid,
    currency: invoice.currency.toUpperCase(),
    creditsChange: plan.creditsPerCycle,
    metadata: {
      invoice_id: invoice.id,
      new_end_date: newEndDate.toISOString(),
    },
  });
}

/**
 * 处理 customer.subscription.updated 事件
 */
async function handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription, eventId: string) {
  console.log('🔄 处理 customer.subscription.updated:', stripeSubscription.id);

  const db = await getDb();

  const subscription = await db.query.userSubscriptions.findFirst({
    where: and(
      eq(userSubscriptions.externalSubscriptionId, stripeSubscription.id),
      eq(userSubscriptions.platform, 'stripe')
    ),
  });

  if (!subscription) {
    console.log(`⏭️ 未找到订阅记录: ${stripeSubscription.id}`);
    return;
  }

  const oldStatus = subscription.status;
  let newStatus = oldStatus;

  // 根据 Stripe 状态更新本地状态
  switch (stripeSubscription.status) {
    case 'active':
      newStatus = 'ACTIVE';
      break;
    case 'past_due':
      newStatus = 'SUSPENDED';
      break;
    case 'canceled':
      newStatus = 'CANCELLED';
      break;
    case 'unpaid':
      newStatus = 'EXPIRED';
      break;
  }

  // 获取 Stripe 的周期结束时间
  const currentPeriodEnd = (stripeSubscription as unknown as { current_period_end: number }).current_period_end;

  await db
    .update(userSubscriptions)
    .set({
      status: newStatus,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      // 同步 Stripe 的周期结束时间
      endDate: new Date(currentPeriodEnd * 1000),
      updatedAt: new Date(),
    })
    .where(eq(userSubscriptions.id, subscription.id));

  console.log(`✅ 订阅状态已更新: ${oldStatus} -> ${newStatus}, end_date: ${new Date(currentPeriodEnd * 1000).toISOString()}`);

  // 记录历史
  await recordSubscriptionHistory({
    subscriptionId: subscription.id,
    userId: subscription.userId,
    eventType: 'UPDATED',
    oldStatus,
    newStatus,
    stripeEventId: eventId,
    stripeEventType: 'customer.subscription.updated',
    metadata: {
      stripe_status: stripeSubscription.status,
      cancel_at_period_end: stripeSubscription.cancel_at_period_end,
    },
  });
}

/**
 * 处理 customer.subscription.deleted 事件
 */
async function handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription, eventId: string) {
  console.log('❌ 处理 customer.subscription.deleted:', stripeSubscription.id);

  const db = await getDb();

  // 先用 external_subscription_id 查找
  let subscription = await db.query.userSubscriptions.findFirst({
    where: and(
      eq(userSubscriptions.externalSubscriptionId, stripeSubscription.id),
      eq(userSubscriptions.platform, 'stripe')
    ),
  });

  // 如果找不到，尝试用最新的 invoice 中的 checkout session 查找
  if (!subscription) {
    console.log(`⚠️ 未通过 subscription_id 找到记录，尝试其他方式...`);

    // 获取最近一次活跃的订阅（同一用户）
    const customerId = typeof stripeSubscription.customer === 'string'
      ? stripeSubscription.customer
      : stripeSubscription.customer?.id;

    if (customerId) {
      const subscriptions = await db
        .select()
        .from(userSubscriptions)
        .where(
          and(
            eq(userSubscriptions.platform, 'stripe'),
            eq(userSubscriptions.status, 'ACTIVE')
          )
        )
        .orderBy(desc(userSubscriptions.createdAt))
        .limit(1);

      subscription = subscriptions[0];
    }
  }

  if (!subscription) {
    console.log(`⏭️ 未找到订阅记录: ${stripeSubscription.id}`);
    return;
  }

  const oldStatus = subscription.status;

  await db
    .update(userSubscriptions)
    .set({
      status: 'CANCELLED',
      cancelledAt: new Date(),
      autoRenew: false,
      updatedAt: new Date(),
    })
    .where(eq(userSubscriptions.id, subscription.id));

  console.log(`✅ 订阅已取消: ${subscription.id}`);

  // 记录历史
  await recordSubscriptionHistory({
    subscriptionId: subscription.id,
    userId: subscription.userId,
    eventType: 'CANCELLED',
    oldStatus,
    newStatus: 'CANCELLED',
    stripeEventId: eventId,
    stripeEventType: 'customer.subscription.deleted',
    metadata: {
      cancellation_reason: stripeSubscription.cancellation_details?.reason,
    },
  });
}

/**
 * POST /api/webhooks/stripe
 * Stripe Webhook 处理器
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('❌ 缺少 Stripe 签名');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // 验证签名
    let event: Stripe.Event;
    try {
      event = getStripe().webhooks.constructEvent(body, signature, getWebhookSecret());
    } catch (err) {
      console.error('❌ Webhook 签名验证失败:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`📥 收到 Stripe 事件: ${event.type} (${event.id})`);

    // 处理不同事件类型
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, event.id);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice, event.id);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, event.id);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, event.id);
        break;

      default:
        console.log(`⏭️ 未处理的事件类型: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook 处理错误:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}