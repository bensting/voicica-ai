import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { userSubscriptions, subscriptionHistory } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getCreditTierByProductId } from '@/config/subscription';
import { addCredits } from '@/lib/credits';
import { ProductType } from '@/config/productType';
import { handleLuckyDrawPurchase, handleLuckyDrawSessionExpired } from '@/actions/lucky-draw';
import {
  verifyWebhookSignature,
  retrieveSubscription,
  type CheckoutSession,
  type Subscription,
  type Invoice,
  type WebhookEvent,
} from '@/lib/stripe-api';

function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }
  return secret;
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
  const db = await getDb();
  try {
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
    if ((error as { code?: string }).code === '23505') {
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
async function handleCheckoutCompleted(session: CheckoutSession, eventId: string) {
  const db = await getDb();
  console.log('💳 处理 checkout.session.completed:', session.id);

  const metadata = session.metadata || {};

  // Lucky Draw 购买走独立流程
  if (metadata.type === 'lucky_draw') {
    await handleLuckyDrawPurchase(session, eventId);
    return;
  }

  const userId = metadata.user_id;
  const productId = metadata.product_id;

  if (!userId || !productId) {
    console.error('❌ 缺少必要的 metadata:', { userId, productId });
    return;
  }

  // 从配置文件获取订阅计划和档位信息
  const result = getCreditTierByProductId(productId);

  if (!result || !result.plan.active) {
    console.error(`❌ 找不到订阅计划: ${productId}`);
    return;
  }

  const { plan, tier } = result;

  // 获取金额和货币（从 line items 或 session）
  const lineItem = session.line_items?.data?.[0];
  const amount = session.amount_total ?? lineItem?.amount_total ?? null;
  const currency = (session.currency ?? lineItem?.currency)?.toUpperCase() ?? null;

  // 判断是否为订阅模式
  const isSubscription = session.mode === 'subscription';
  const stripeSubscriptionId = session.subscription ?? null;

  // 计算订阅日期
  const now = new Date();
  let endDate: Date;

  if (isSubscription && stripeSubscriptionId) {
    // 订阅模式：从 Stripe 获取周期结束时间（新版 API 中周期信息在 items.data 中）
    try {
      const stripeSubscription = await retrieveSubscription(stripeSubscriptionId);
      const subscriptionItem = stripeSubscription.items.data[0];
      console.log('🔍 Stripe Subscription Item:', JSON.stringify({
        id: stripeSubscription.id,
        status: stripeSubscription.status,
        current_period_start: subscriptionItem?.current_period_start,
        current_period_end: subscriptionItem?.current_period_end,
      }, null, 2));
      const currentPeriodEnd = subscriptionItem?.current_period_end;
      if (typeof currentPeriodEnd === 'number' && currentPeriodEnd > 0) {
        endDate = new Date(currentPeriodEnd * 1000);
        console.log(`📅 从 Stripe 获取订阅周期: ${now.toISOString()} - ${endDate.toISOString()}`);
      } else {
        // 缺少周期信息，使用 cycle_days 计算
        console.warn('⚠️ Stripe 订阅缺少 current_period_end，使用 cycle_days 计算');
        endDate = new Date(now);
        endDate.setDate(endDate.getDate() + plan.cycle_days);
      }
    } catch (error) {
      console.error('⚠️ 获取 Stripe 订阅失败，使用 cycle_days 计算:', error);
      endDate = new Date(now);
      endDate.setDate(endDate.getDate() + plan.cycle_days);
    }
  } else {
    // 一次性支付：用 cycle_days 计算
    endDate = new Date(now);
    endDate.setDate(endDate.getDate() + plan.cycle_days);
    console.log(`📅 一次性支付，使用 cycle_days (${plan.cycle_days}) 计算: ${now.toISOString()} - ${endDate.toISOString()}`);
  }

  console.log('📊 Checkout 数据:', {
    amount,
    currency,
    mode: session.mode,
    subscription_id: stripeSubscriptionId,
  });

  // 创建订阅记录（不再依赖 subscription_plans 表，使用 product_id 关联配置文件）
  const [subscription] = await db.insert(userSubscriptions).values({
    userId,
    productId,
    productType: null,
    platform: 'stripe',
    externalTransactionId: session.id,
    externalSubscriptionId: stripeSubscriptionId,
    requestId: `stripe_${session.id}`,
    status: 'ACTIVE',
    startDate: now.toISOString(),
    endDate: endDate.toISOString(),
    creditsAllocated: tier.credits,
    amount: amount,
    currency: currency,
    autoRenew: isSubscription,
    cancelAtPeriodEnd: false,
    activatedAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }).returning();

  // 给用户添加积分（使用统一的积分管理服务）
  await addCredits(
    userId,
    tier.credits,
    ProductType.SUBSCRIPTION,
    false, // 订阅用户都是正式用户
    `订阅购买: ${plan.plan_name}`
  );

  console.log(`✅ 订阅已创建: ${subscription.id}, 积分: +${tier.credits}`);

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
    creditsChange: tier.credits,
    metadata: {
      session_id: session.id,
      plan_name: plan.plan_name,
      cycle_days: plan.cycle_days,
    },
  });
}

/**
 * 处理 invoice.paid 事件
 * 订阅续费成功后触发
 */
async function handleInvoicePaid(invoice: Invoice, eventId: string) {
  const db = await getDb();
  console.log('💰 处理 invoice.paid:', invoice.id, 'billing_reason:', invoice.billing_reason);

  // 只处理续费发票，初次订阅由 checkout.session.completed 处理
  if (invoice.billing_reason === 'subscription_create') {
    console.log('⏭️ 初次订阅发票，由 checkout.session.completed 处理，跳过');
    return;
  }

  // 只处理周期续费
  if (invoice.billing_reason !== 'subscription_cycle') {
    console.log(`⏭️ 非续费发票 (${invoice.billing_reason})，跳过`);
    return;
  }

  // 从 line items 获取订阅 ID
  const lineItem = invoice.lines?.data?.[0];
  const subscriptionId = lineItem?.parent?.subscription_item_details?.subscription;

  if (!subscriptionId) {
    console.log('⏭️ 非订阅发票，跳过');
    return;
  }

  // 查找现有订阅
  const [subscription] = await db.select().from(userSubscriptions)
    .where(and(
      eq(userSubscriptions.externalSubscriptionId, subscriptionId),
      eq(userSubscriptions.platform, 'stripe'),
    ))
    .limit(1);

  if (!subscription) {
    console.log(`⏭️ 未找到订阅记录: ${subscriptionId}`);
    return;
  }

  // 从配置文件获取订阅计划和档位信息
  const result = getCreditTierByProductId(subscription.productId);
  if (!result) {
    console.error(`❌ 找不到订阅计划: ${subscription.productId}`);
    return;
  }

  const { plan, tier } = result;
  const oldStatus = subscription.status;

  // 更新订阅日期
  const now = new Date();
  const newEndDate = new Date(subscription.endDate);
  newEndDate.setDate(newEndDate.getDate() + plan.cycle_days);

  await db.update(userSubscriptions)
    .set({
      status: 'ACTIVE',
      endDate: newEndDate.toISOString(),
      updatedAt: now.toISOString(),
    })
    .where(eq(userSubscriptions.id, subscription.id));

  // 给用户添加积分（使用统一的积分管理服务）
  await addCredits(
    subscription.userId,
    tier.credits,
    ProductType.SUBSCRIPTION,
    false, // 订阅用户都是正式用户
    `订阅续费: ${plan.plan_name}`
  );

  console.log(`✅ 订阅已续费: ${subscription.id}, 积分: +${tier.credits}`);

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
    creditsChange: tier.credits,
    metadata: {
      invoice_id: invoice.id,
      new_end_date: newEndDate.toISOString(),
    },
  });
}

/**
 * 处理 customer.subscription.updated 事件
 */
async function handleSubscriptionUpdated(stripeSubscription: Subscription, eventId: string) {
  const db = await getDb();
  console.log('🔄 处理 customer.subscription.updated:', stripeSubscription.id);

  const [subscription] = await db.select().from(userSubscriptions)
    .where(and(
      eq(userSubscriptions.externalSubscriptionId, stripeSubscription.id),
      eq(userSubscriptions.platform, 'stripe'),
    ))
    .limit(1);

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

  // 获取 Stripe 的周期结束时间（新版 API 中周期信息在 items.data 中）
  const subscriptionItem = stripeSubscription.items.data[0];
  const currentPeriodEnd = subscriptionItem?.current_period_end;
  const endDate = typeof currentPeriodEnd === 'number' && currentPeriodEnd > 0
    ? new Date(currentPeriodEnd * 1000).toISOString()
    : subscription.endDate;

  const now = new Date();

  await db.update(userSubscriptions)
    .set({
      status: newStatus,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      // 同步 Stripe 的周期结束时间
      endDate: endDate,
      updatedAt: now.toISOString(),
    })
    .where(eq(userSubscriptions.id, subscription.id));

  console.log(`✅ 订阅状态已更新: ${oldStatus} -> ${newStatus}, end_date: ${endDate}`);

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
async function handleSubscriptionDeleted(stripeSubscription: Subscription, eventId: string) {
  const db = await getDb();
  console.log('❌ 处理 customer.subscription.deleted:', stripeSubscription.id);

  // 先用 external_subscription_id 查找
  let [subscription] = await db.select().from(userSubscriptions)
    .where(and(
      eq(userSubscriptions.externalSubscriptionId, stripeSubscription.id),
      eq(userSubscriptions.platform, 'stripe'),
    ))
    .limit(1);

  // 如果找不到，尝试用最新的 invoice 中的 checkout session 查找
  if (!subscription) {
    console.log(`⚠️ 未通过 subscription_id 找到记录，尝试其他方式...`);

    // 获取最近一次活跃的订阅（同一用户）
    const customerId = typeof stripeSubscription.customer === 'string'
      ? stripeSubscription.customer
      : stripeSubscription.customer?.id;

    if (customerId) {
      [subscription] = await db.select().from(userSubscriptions)
        .where(and(
          eq(userSubscriptions.platform, 'stripe'),
          eq(userSubscriptions.status, 'ACTIVE'),
        ))
        .orderBy(desc(userSubscriptions.createdAt))
        .limit(1);
    }
  }

  if (!subscription) {
    console.log(`⏭️ 未找到订阅记录: ${stripeSubscription.id}`);
    return;
  }

  const oldStatus = subscription.status;
  const now = new Date();

  await db.update(userSubscriptions)
    .set({
      status: 'CANCELLED',
      cancelledAt: now.toISOString(),
      autoRenew: false,
      updatedAt: now.toISOString(),
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
    let event: WebhookEvent;
    try {
      event = await verifyWebhookSignature(body, signature, getWebhookSecret());
    } catch (err) {
      console.error('❌ Webhook 签名验证失败:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`📥 收到 Stripe 事件: ${event.type} (${event.id})`);

    // 处理不同事件类型
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as unknown as CheckoutSession, event.id);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as unknown as Invoice, event.id);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as unknown as Subscription, event.id);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as unknown as Subscription, event.id);
        break;

      case 'checkout.session.expired': {
        const expiredSession = event.data.object as unknown as CheckoutSession;
        if (expiredSession.metadata?.type === 'lucky_draw') {
          await handleLuckyDrawSessionExpired(expiredSession);
        }
        break;
      }

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
