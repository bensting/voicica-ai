'use server';

/**
 * Native App Payment Server Actions
 *
 * Handles credit pack purchases for native apps via Google Play Billing
 * Independent from web subscription configuration
 */

import { getCurrentUser } from '@/lib/auth-firebase';
import prisma from '@/lib/prisma';
import { addCredits } from '@/lib/credits';
import { ProductType } from '@/config/productType';
import { getCreditPackByGooglePlayProductId } from '@/config/native/subscription';

/**
 * Verify Google Play one-time purchase (INAPP product) and grant credits
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
  const { purchaseToken, productId, orderId } = params;

  try {
    const authUser = await getCurrentUser();
    const userId = authUser.uid;

    console.log(`🔵 [GooglePlay] Verifying credit pack purchase...`);

    // Find credit pack from native config by Google Play product ID
    const creditPack = getCreditPackByGooglePlayProductId(productId);
    if (!creditPack) {
      console.error(`❌ [GooglePlay] Unknown credit pack: ${productId}`);
      return { success: false, error: 'Unknown credit pack' };
    }

    // Check if already processed (prevent duplicate)
    const existingPurchase = await prisma.credit_history.findFirst({
      where: {
        user_id: userId,
        description: { contains: purchaseToken.substring(0, 50) },
      },
    });

    if (existingPurchase) {
      console.log(`⏭️ [GooglePlay] Purchase already processed: ${purchaseToken}`);
      return {
        success: true,
        credits_added: creditPack.credits,
      };
    }

    // Add credits to user (this also records to credit_history)
    await addCredits(
      userId,
      creditPack.credits,
      ProductType.SUBSCRIPTION,
      false,
      `Google Play Credit Pack: ${creditPack.id} (Order: ${orderId || purchaseToken.substring(0, 30)})`
    );

    console.log(`✅ [GooglePlay] Credits added: ${creditPack.credits} for user ${userId}`);

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
