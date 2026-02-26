'use server';

/**
 * Google Play Billing Server Actions
 *
 * 处理 Google Play 订阅购买的验证和积分发放
 *
 * 安全说明：
 * - 所有购买都必须通过 Google Play API 验证真实性
 * - 不能信任客户端传来的任何数据
 */

import { getDb } from '@/lib/db';
import { userSubscriptions, subscriptionHistory } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth-firebase';
import { getCreditTierByProductId } from '@/config/subscription';
import { addCredits } from '@/lib/credits';
import { ProductType } from '@/config/productType';
import { googlePlayProducts } from '@/config/payment/google-play';
import { verifySubscriptionWithGooglePlay } from '@/lib/google-play-api';

// Google Play 产品 ID 到 Stripe 产品 ID 的映射（反向查找）
function getStripeProductIdFromGooglePlay(googlePlayProductId: string): string | null {
  for (const product of Object.values(googlePlayProducts)) {
    if (product.productId === googlePlayProductId) {
      return product.stripeProductId;
    }
  }
  return null;
}

/**
 * 验证 Google Play 购买并发放积分
 *
 * 安全流程：
 * 1. 调用 Google Play API 验证 purchaseToken 的真实性
 * 2. 确认订阅状态有效（ACTIVE 或 IN_GRACE_PERIOD）
 * 3. 使用 API 返回的 productId（不信任客户端传来的）
 * 4. 发放积分
 */
export async function verifyGooglePlayPurchase(params: {
  purchaseToken: string;
  productId: string;
  orderId?: string;
}): Promise<{
  success: boolean;
  error?: string;
  subscriptionId?: number;
}> {
  const db = await getDb();
  const { purchaseToken, productId: clientProductId, orderId: clientOrderId } = params;

  try {
    const authUser = await getCurrentUser();
    const userId = authUser.uid;

    console.log(`🔵 [GooglePlay] 开始验证购买...`);

    // ========== 第一步：调用 Google Play API 验证 purchaseToken ==========
    const verification = await verifySubscriptionWithGooglePlay(purchaseToken);

    if (!verification.valid) {
      console.error(`❌ [GooglePlay] API 验证失败: ${verification.error}`);
      return {
        success: false,
        error: verification.error || 'Purchase verification failed',
      };
    }

    // 使用 Google Play API 返回的真实数据，不信任客户端
    const verifiedProductId = verification.productId || clientProductId;
    const verifiedOrderId = verification.orderId || clientOrderId;

    console.log(`✅ [GooglePlay] API 验证通过:`, {
      productId: verifiedProductId,
      orderId: verifiedOrderId,
      state: verification.subscriptionState,
      expiryTime: verification.expiryTime,
    });

    // ========== 第二步：检查是否已处理过此购买（防止重复发放）==========
    const [existingSubscription] = await db.select().from(userSubscriptions)
      .where(and(
        eq(userSubscriptions.externalTransactionId, purchaseToken),
        eq(userSubscriptions.platform, 'google_play'),
      ))
      .limit(1);

    if (existingSubscription) {
      console.log(`⏭️ [GooglePlay] 购买已处理: ${purchaseToken}`);
      return {
        success: true,
        subscriptionId: existingSubscription.id,
      };
    }

    // ========== 第三步：查找订阅计划配置 ==========
    // 使用验证后的 productId
    const stripeProductId = getStripeProductIdFromGooglePlay(verifiedProductId);
    if (!stripeProductId) {
      console.error(`❌ [GooglePlay] 未知产品 ID: ${verifiedProductId}`);
      return { success: false, error: 'Unknown product ID' };
    }

    // 从配置获取订阅计划信息
    const result = getCreditTierByProductId(stripeProductId);
    if (!result || !result.plan.active) {
      console.error(`❌ [GooglePlay] 找不到订阅计划: ${stripeProductId}`);
      return { success: false, error: 'Subscription plan not found' };
    }

    const { plan, tier } = result;

    // ========== 第四步：创建订阅记录并发放积分 ==========
    // 计算订阅日期（优先使用 API 返回的过期时间）
    const now = new Date();
    let endDate: Date;
    if (verification.expiryTime) {
      endDate = new Date(verification.expiryTime);
    } else {
      endDate = new Date(now);
      endDate.setDate(endDate.getDate() + plan.cycle_days);
    }

    // 创建订阅记录
    const [subscription] = await db.insert(userSubscriptions).values({
      userId,
      productId: stripeProductId,
      productType: null,
      platform: 'google_play',
      externalTransactionId: purchaseToken,
      externalSubscriptionId: verifiedOrderId || null,
      requestId: `gp_${purchaseToken.substring(0, 50)}`,
      status: 'ACTIVE',
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      creditsAllocated: tier.credits,
      amount: null, // Google Play 不提供金额
      currency: null,
      autoRenew: verification.autoRenewing ?? true,
      cancelAtPeriodEnd: false,
      activatedAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }).returning();

    // 给用户添加积分
    await addCredits(
      userId,
      tier.credits,
      ProductType.SUBSCRIPTION,
      false,
      `Google Play 订阅: ${plan.plan_name}`
    );

    console.log(`✅ [GooglePlay] 订阅已创建: ${subscription.id}, 积分: +${tier.credits}`);

    // 记录历史
    await db.insert(subscriptionHistory).values({
      subscriptionId: subscription.id,
      userId,
      eventType: 'CREATED',
      oldStatus: null,
      newStatus: 'ACTIVE',
      stripeEventId: `gp_${Date.now()}`,
      stripeEventType: 'google_play.purchase',
      amount: null,
      currency: null,
      creditsChange: tier.credits,
      metadata: {
        product_id: verifiedProductId,
        order_id: verifiedOrderId,
        plan_name: plan.plan_name,
        cycle_days: plan.cycle_days,
        verified_state: verification.subscriptionState,
        expiry_time: verification.expiryTime,
      },
    });

    return {
      success: true,
      subscriptionId: subscription.id,
    };
  } catch (error) {
    console.error('❌ [GooglePlay] 验证购买失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Verification failed',
    };
  }
}

/**
 * 处理 Google Play 续订通知
 * 由 RTDN Webhook 调用
 *
 * 注意：此函数只处理真正的续费（自动续费到下一个周期）
 * 首次购买/重新订阅的积分由客户端 verifyGooglePlayPurchase 处理
 */
export async function handleGooglePlayRenewal(params: {
  purchaseToken: string;
  productId: string;
  eventTime: number;
}): Promise<{ success: boolean; error?: string }> {
  const db = await getDb();
  const { purchaseToken, productId, eventTime } = params;

  try {
    console.log(`🔄 [GooglePlay] 处理续订: productId=${productId}`);

    // ========== 第一步：调用 Google Play API 获取最新订单信息 ==========
    const verification = await verifySubscriptionWithGooglePlay(purchaseToken);
    if (!verification.valid) {
      console.log(`⏭️ [GooglePlay] 订阅验证失败: ${verification.error}`);
      return { success: false, error: verification.error };
    }

    const latestOrderId = verification.orderId;
    if (!latestOrderId) {
      console.log(`⏭️ [GooglePlay] 无法获取 orderId`);
      return { success: false, error: 'Missing orderId' };
    }

    console.log(`📦 [GooglePlay] latestOrderId: ${latestOrderId}`);

    // 查找现有订阅
    const [subscription] = await db.select().from(userSubscriptions)
      .where(and(
        eq(userSubscriptions.externalTransactionId, purchaseToken),
        eq(userSubscriptions.platform, 'google_play'),
      ))
      .limit(1);

    if (!subscription) {
      console.log(`⏭️ [GooglePlay] 未找到订阅: ${purchaseToken}`);
      return { success: false, error: 'Subscription not found' };
    }

    // ========== 去重检查：用 orderId 判断是否已处理过此次支付 ==========
    // Google Play 的 orderId 格式：GPA.xxxx-xxxx-xxxx-xxxxx（首次）或 GPA.xxxx..0, GPA.xxxx..1（续订）
    // 每次支付都有唯一的 orderId，用它来判断是否重复
    const [existingHistory] = await db.select().from(subscriptionHistory)
      .where(and(
        eq(subscriptionHistory.subscriptionId, subscription.id),
        sql`${subscriptionHistory.metadata}->>'order_id' = ${latestOrderId}`,
      ))
      .limit(1);

    if (existingHistory) {
      console.log(`⏭️ [GooglePlay] orderId ${latestOrderId} 已处理过，跳过`);
      return { success: true };
    }

    // 将 Google Play 产品 ID 转换为 Stripe 产品 ID
    const stripeProductId = getStripeProductIdFromGooglePlay(productId);
    if (!stripeProductId) {
      return { success: false, error: 'Unknown product ID' };
    }

    // 从配置获取订阅计划信息
    const result = getCreditTierByProductId(stripeProductId);
    if (!result) {
      return { success: false, error: 'Plan not found' };
    }

    const { plan, tier } = result;
    const oldStatus = subscription.status;
    const now = new Date();

    // 使用 Google API 返回的 expiryTime 作为新的 end_date（Google 是权威来源）
    let newEndDate: Date;
    if (verification.expiryTime) {
      newEndDate = new Date(verification.expiryTime);
    } else {
      // 备用方案：基于当前 end_date 计算
      const currentEndDate = new Date(subscription.endDate);
      newEndDate = new Date(currentEndDate);
      newEndDate.setDate(newEndDate.getDate() + plan.cycle_days);
    }

    await db.update(userSubscriptions)
      .set({
        status: 'ACTIVE',
        endDate: newEndDate.toISOString(),
        updatedAt: now.toISOString(),
      })
      .where(eq(userSubscriptions.id, subscription.id));

    // 给用户添加积分（真正的续费）
    await addCredits(
      subscription.userId,
      tier.credits,
      ProductType.SUBSCRIPTION,
      false,
      `Google Play 续订: ${plan.plan_name}`
    );

    console.log(`✅ [GooglePlay] 订阅已续订: ${subscription.id}, 积分: +${tier.credits}`);

    // 记录历史（包含 order_id 用于去重）
    await db.insert(subscriptionHistory).values({
      subscriptionId: subscription.id,
      userId: subscription.userId,
      eventType: 'RENEWED',
      oldStatus,
      newStatus: 'ACTIVE',
      stripeEventId: `gp_renewal_${eventTime}`,
      stripeEventType: 'google_play.renewal',
      creditsChange: tier.credits,
      metadata: {
        order_id: latestOrderId,
        new_end_date: newEndDate.toISOString(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error('❌ [GooglePlay] 处理续订失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Renewal failed',
    };
  }
}

/**
 * 处理 Google Play 订阅恢复/重新激活
 *
 * 用于 SUBSCRIPTION_RECOVERED 和 SUBSCRIPTION_RESTARTED 通知
 * 只更新订阅状态为 ACTIVE，不添加积分（积分已在客户端处理或订阅期没变）
 */
export async function handleGooglePlayReactivation(params: {
  purchaseToken: string;
}): Promise<{ success: boolean; error?: string }> {
  const db = await getDb();
  const { purchaseToken } = params;

  try {
    console.log(`🔄 [GooglePlay] 处理订阅恢复/重新激活: ${purchaseToken.substring(0, 30)}...`);

    // 调用 Google API 获取最新订阅信息
    const verification = await verifySubscriptionWithGooglePlay(purchaseToken);
    if (!verification.valid) {
      console.log(`⏭️ [GooglePlay] 订阅验证失败: ${verification.error}`);
      return { success: false, error: verification.error };
    }

    // 查找现有订阅
    const [subscription] = await db.select().from(userSubscriptions)
      .where(and(
        eq(userSubscriptions.externalTransactionId, purchaseToken),
        eq(userSubscriptions.platform, 'google_play'),
      ))
      .limit(1);

    if (!subscription) {
      console.log(`⏭️ [GooglePlay] 未找到订阅: ${purchaseToken}`);
      return { success: false, error: 'Subscription not found' };
    }

    const oldStatus = subscription.status;
    const now = new Date();

    // 更新状态为 ACTIVE，并同步 Google 的 expiryTime
    const updateData: {
      status: string;
      autoRenew: boolean;
      updatedAt: string;
      endDate?: string;
    } = {
      status: 'ACTIVE',
      autoRenew: verification.autoRenewing ?? true,
      updatedAt: now.toISOString(),
    };

    // 如果 Google 返回了 expiryTime，同步到 end_date
    if (verification.expiryTime) {
      updateData.endDate = new Date(verification.expiryTime).toISOString();
    }

    await db.update(userSubscriptions)
      .set(updateData)
      .where(eq(userSubscriptions.id, subscription.id));

    console.log(`✅ [GooglePlay] 订阅已恢复: ${subscription.id} (${oldStatus} -> ACTIVE，无积分变动)`);

    // 记录历史（无积分变动）
    await db.insert(subscriptionHistory).values({
      subscriptionId: subscription.id,
      userId: subscription.userId,
      eventType: 'REACTIVATED',
      oldStatus,
      newStatus: 'ACTIVE',
      stripeEventId: `gp_reactivate_${Date.now()}`,
      stripeEventType: 'google_play.reactivation',
      creditsChange: 0,
      metadata: {
        order_id: verification.orderId,
        expiry_time: verification.expiryTime,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('❌ [GooglePlay] 处理订阅恢复失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Reactivation failed',
    };
  }
}

/**
 * 处理 Google Play 取消通知
 */
export async function handleGooglePlayCancellation(params: {
  purchaseToken: string;
  cancelReason?: number;
}): Promise<{ success: boolean; error?: string }> {
  const db = await getDb();
  const { purchaseToken, cancelReason } = params;

  try {
    console.log(`❌ [GooglePlay] 处理取消: purchaseToken=${purchaseToken}`);

    const [subscription] = await db.select().from(userSubscriptions)
      .where(and(
        eq(userSubscriptions.externalTransactionId, purchaseToken),
        eq(userSubscriptions.platform, 'google_play'),
      ))
      .limit(1);

    if (!subscription) {
      return { success: false, error: 'Subscription not found' };
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

    console.log(`✅ [GooglePlay] 订阅已取消: ${subscription.id}`);

    // 记录历史
    await db.insert(subscriptionHistory).values({
      subscriptionId: subscription.id,
      userId: subscription.userId,
      eventType: 'CANCELLED',
      oldStatus,
      newStatus: 'CANCELLED',
      stripeEventId: `gp_cancel_${Date.now()}`,
      stripeEventType: 'google_play.cancellation',
      metadata: {
        cancel_reason: cancelReason,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('❌ [GooglePlay] 处理取消失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Cancellation failed',
    };
  }
}
