'use server';

/**
 * Native App Payment Server Actions
 *
 * Handles credit pack purchases for native apps via Google Play Billing
 * Independent from web subscription configuration
 *
 * 安全说明：
 * - 所有购买都必须通过 Google Play API 验证真实性
 * - 不能信任客户端传来的任何数据
 */

import { getCurrentUser } from '@/lib/auth-firebase';
import prisma from '@/lib/prisma';
import { addCredits } from '@/lib/credits';
import { ProductType } from '@/config/productType';
import { getCreditPackByGooglePlayProductId } from '@/config/native/subscription';
import {
  verifyProductWithGooglePlay,
  acknowledgeProduct,
} from '@/lib/google-play-api';

/**
 * Verify Google Play one-time purchase (INAPP product) and grant credits
 *
 * 安全流程：
 * 1. 调用 Google Play API 验证 purchaseToken 的真实性
 * 2. 确认购买状态有效（purchaseState === 0）
 * 3. 检查是否已处理过（防止重复发放）
 * 4. 发放积分
 * 5. 确认购买（acknowledge）
 */
export async function verifyGooglePlayCreditPackPurchase(params: {
  purchaseToken: string;
  productId: string;
  orderId?: string;
}): Promise<{
  success: boolean;
  error?: string;
  credits_added?: number;
}> {
  const { purchaseToken, productId: clientProductId, orderId: clientOrderId } = params;

  try {
    const authUser = await getCurrentUser();
    const userId = authUser.uid;

    console.log(`🔵 [GooglePlay] Verifying credit pack purchase...`);
    console.log(`🔵 [GooglePlay] productId: ${clientProductId}, token: ${purchaseToken.substring(0, 30)}...`);

    // ========== 第一步：验证产品配置 ==========
    const creditPack = getCreditPackByGooglePlayProductId(clientProductId);
    if (!creditPack) {
      console.error(`❌ [GooglePlay] Unknown credit pack: ${clientProductId}`);
      return { success: false, error: 'Unknown credit pack' };
    }

    // ========== 第二步：调用 Google Play API 验证购买真实性 ==========
    const verification = await verifyProductWithGooglePlay(clientProductId, purchaseToken);

    if (!verification.valid) {
      console.error(`❌ [GooglePlay] API verification failed: ${verification.error}`);
      return {
        success: false,
        error: verification.error || 'Purchase verification failed',
      };
    }

    // 使用 Google Play API 返回的真实订单 ID
    const verifiedOrderId = verification.orderId || clientOrderId;

    console.log(`✅ [GooglePlay] API verification passed:`, {
      orderId: verifiedOrderId,
      purchaseState: verification.purchaseState,
      consumptionState: verification.consumptionState,
    });

    // ========== 第三步：检查是否已处理过此购买（防止重复发放）==========
    // 使用完整的 purchaseToken 作为唯一标识
    const existingPurchase = await prisma.credit_history.findFirst({
      where: {
        user_id: userId,
        description: { contains: `Token:${purchaseToken.substring(0, 100)}` },
      },
    });

    if (existingPurchase) {
      console.log(`⏭️ [GooglePlay] Purchase already processed: ${purchaseToken.substring(0, 30)}...`);
      return {
        success: true,
        credits_added: creditPack.credits,
      };
    }

    // ========== 第四步：发放积分 ==========
    await addCredits(
      userId,
      creditPack.credits,
      ProductType.SUBSCRIPTION,
      false,
      `Google Play Credit Pack: ${creditPack.id} (Order: ${verifiedOrderId || 'N/A'}) (Token:${purchaseToken.substring(0, 100)})`
    );

    console.log(`✅ [GooglePlay] Credits added: ${creditPack.credits} for user ${userId}`);

    // ========== 第五步：确认购买（acknowledge）==========
    if (!verification.acknowledged) {
      await acknowledgeProduct(clientProductId, purchaseToken);
    }

    return {
      success: true,
      credits_added: creditPack.credits,
    };
  } catch (error) {
    console.error('❌ [GooglePlay] Credit pack verification failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Verification failed',
    };
  }
}
