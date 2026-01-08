'use server';

/**
 * Google Play Billing Server Actions
 *
 * 处理 Google Play 订阅购买的验证和积分发放
 */

import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-firebase';
import { getCreditTierByProductId } from '@/config/subscription';
import { addCredits } from '@/lib/credits';
import { ProductType } from '@/config/productType';
import { googlePlayProducts } from '@/config/payment/google-play';

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
  const { purchaseToken, productId, orderId } = params;

  try {
    const authUser = await getCurrentUser();
    const userId = authUser.uid;

    console.log(`🔵 [GooglePlay] 验证购买: productId=${productId}, orderId=${orderId}`);

    // 检查是否已处理过此购买（防止重复发放）
    const existingSubscription = await prisma.user_subscriptions.findFirst({
      where: {
        external_transaction_id: purchaseToken,
        platform: 'google_play',
      },
    });

    if (existingSubscription) {
      console.log(`⏭️ [GooglePlay] 购买已处理: ${purchaseToken}`);
      return {
        success: true,
        subscriptionId: existingSubscription.id,
      };
    }

    // 将 Google Play 产品 ID 转换为 Stripe 产品 ID（用于查找配置）
    const stripeProductId = getStripeProductIdFromGooglePlay(productId);
    if (!stripeProductId) {
      console.error(`❌ [GooglePlay] 未知产品 ID: ${productId}`);
      return { success: false, error: 'Unknown product ID' };
    }

    // 从配置获取订阅计划信息
    const result = getCreditTierByProductId(stripeProductId);
    if (!result || !result.plan.active) {
      console.error(`❌ [GooglePlay] 找不到订阅计划: ${stripeProductId}`);
      return { success: false, error: 'Subscription plan not found' };
    }

    const { plan, tier } = result;

    // 计算订阅日期
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + plan.cycle_days);

    // 创建订阅记录
    const subscription = await prisma.user_subscriptions.create({
      data: {
        user_id: userId,
        product_id: stripeProductId,
        product_type: null,
        platform: 'google_play',
        external_transaction_id: purchaseToken,
        external_subscription_id: orderId || null,
        request_id: `gp_${purchaseToken.substring(0, 50)}`,
        status: 'ACTIVE',
        start_date: now,
        end_date: endDate,
        credits_allocated: tier.credits,
        amount: null, // Google Play 不提供金额
        currency: null,
        auto_renew: true,
        cancel_at_period_end: false,
        activated_at: now,
      },
    });

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
    await prisma.subscription_history.create({
      data: {
        subscription_id: subscription.id,
        user_id: userId,
        event_type: 'CREATED',
        old_status: null,
        new_status: 'ACTIVE',
        stripe_event_id: `gp_${Date.now()}`,
        stripe_event_type: 'google_play.purchase',
        amount: null,
        currency: null,
        credits_change: tier.credits,
        metadata: {
          product_id: productId,
          order_id: orderId,
          plan_name: plan.plan_name,
          cycle_days: plan.cycle_days,
        },
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
 */
export async function handleGooglePlayRenewal(params: {
  purchaseToken: string;
  productId: string;
  eventTime: number;
}): Promise<{ success: boolean; error?: string }> {
  const { purchaseToken, productId, eventTime } = params;

  try {
    console.log(`🔄 [GooglePlay] 处理续订: productId=${productId}`);

    // 查找现有订阅
    const subscription = await prisma.user_subscriptions.findFirst({
      where: {
        external_transaction_id: purchaseToken,
        platform: 'google_play',
      },
    });

    if (!subscription) {
      console.log(`⏭️ [GooglePlay] 未找到订阅: ${purchaseToken}`);
      return { success: false, error: 'Subscription not found' };
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

    // 更新订阅日期
    const newEndDate = new Date(subscription.end_date);
    newEndDate.setDate(newEndDate.getDate() + plan.cycle_days);

    await prisma.user_subscriptions.update({
      where: { id: subscription.id },
      data: {
        status: 'ACTIVE',
        end_date: newEndDate,
        updated_at: new Date(),
      },
    });

    // 给用户添加积分
    await addCredits(
      subscription.user_id,
      tier.credits,
      ProductType.SUBSCRIPTION,
      false,
      `Google Play 续订: ${plan.plan_name}`
    );

    console.log(`✅ [GooglePlay] 订阅已续订: ${subscription.id}, 积分: +${tier.credits}`);

    // 记录历史
    await prisma.subscription_history.create({
      data: {
        subscription_id: subscription.id,
        user_id: subscription.user_id,
        event_type: 'RENEWED',
        old_status: oldStatus,
        new_status: 'ACTIVE',
        stripe_event_id: `gp_renewal_${eventTime}`,
        stripe_event_type: 'google_play.renewal',
        credits_change: tier.credits,
        metadata: {
          new_end_date: newEndDate.toISOString(),
        },
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
 * 处理 Google Play 取消通知
 */
export async function handleGooglePlayCancellation(params: {
  purchaseToken: string;
  cancelReason?: number;
}): Promise<{ success: boolean; error?: string }> {
  const { purchaseToken, cancelReason } = params;

  try {
    console.log(`❌ [GooglePlay] 处理取消: purchaseToken=${purchaseToken}`);

    const subscription = await prisma.user_subscriptions.findFirst({
      where: {
        external_transaction_id: purchaseToken,
        platform: 'google_play',
      },
    });

    if (!subscription) {
      return { success: false, error: 'Subscription not found' };
    }

    const oldStatus = subscription.status;

    await prisma.user_subscriptions.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELLED',
        cancelled_at: new Date(),
        auto_renew: false,
        updated_at: new Date(),
      },
    });

    console.log(`✅ [GooglePlay] 订阅已取消: ${subscription.id}`);

    // 记录历史
    await prisma.subscription_history.create({
      data: {
        subscription_id: subscription.id,
        user_id: subscription.user_id,
        event_type: 'CANCELLED',
        old_status: oldStatus,
        new_status: 'CANCELLED',
        stripe_event_id: `gp_cancel_${Date.now()}`,
        stripe_event_type: 'google_play.cancellation',
        metadata: {
          cancel_reason: cancelReason,
        },
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
