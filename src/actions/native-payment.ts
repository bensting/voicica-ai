'use server';

/**
 * Native App Payment Server Actions
 *
 * Handles credit pack purchases for native apps
 * Independent from web subscription configuration
 */

import Stripe from 'stripe';
import { getCurrentUser } from '@/lib/auth-firebase';
import prisma from '@/lib/prisma';
import { addCredits } from '@/lib/credits';
import { ProductType } from '@/config/productType';
import { getCreditPackById, getCreditPackByStripeProductId } from '@/config/native/subscription';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export interface NativeCreditPackCheckoutRequest {
  product_id: string;
  currency?: string;
  success_url: string;
  cancel_url: string;
}

export interface NativeCheckoutResponse {
  checkout_url: string;
  session_id: string;
}

/**
 * Create Stripe Checkout session for native credit pack purchase
 */
export async function createNativeCreditPackCheckout(
  request: NativeCreditPackCheckoutRequest
): Promise<NativeCheckoutResponse> {
  // Verify user is authenticated
  const user = await getCurrentUser();
  const userId = user.uid;

  // Find credit pack from native config
  const creditPack = getCreditPackByStripeProductId(request.product_id);
  if (!creditPack) {
    throw new Error(`Credit pack not found: ${request.product_id}`);
  }

  // Determine currency and price
  const currency = (request.currency || creditPack.currency || 'usd').toLowerCase();
  const unitAmountInCents = Math.round(creditPack.price * 100);

  // Get user info for Stripe customer
  const appUser = await prisma.users.findUnique({
    where: { user_id: userId },
  });

  // Build success URL with session ID
  const successUrl = request.success_url.includes('?')
    ? `${request.success_url}&request_id={CHECKOUT_SESSION_ID}`
    : `${request.success_url}?request_id={CHECKOUT_SESSION_ID}`;

  // Create Stripe Checkout Session (one-time payment)
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: currency,
          unit_amount: unitAmountInCents,
          product_data: {
            name: `${creditPack.credits} Credits`,
            description: `One-time purchase of ${creditPack.credits} credits`,
          },
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: request.cancel_url,
    metadata: {
      user_id: userId,
      product_id: request.product_id,
      pack_id: creditPack.id,
      credits: String(creditPack.credits),
      type: 'credit_pack',
    },
    ...(appUser?.email && {
      customer_email: appUser.email,
    }),
  };

  const session = await stripe.checkout.sessions.create({
    ...sessionParams,
    expand: ['line_items'],
  });

  if (!session.url) {
    throw new Error('Failed to create checkout session');
  }

  console.log(`✅ Native Credit Pack Checkout created: ${session.id}, User: ${userId}`);

  return {
    checkout_url: session.url,
    session_id: session.id,
  };
}

/**
 * Verify native credit pack payment and grant credits
 */
export async function verifyNativeCreditPackPayment(params: { request_id: string }): Promise<{
  success: boolean;
  payment_status: string;
  credits_added?: number;
  message: string;
}> {
  try {
    const session = await stripe.checkout.sessions.retrieve(params.request_id);

    const isPaid = session.payment_status === 'paid';

    if (isPaid && session.metadata) {
      const userId = session.metadata.user_id;
      const credits = parseInt(session.metadata.credits || '0', 10);
      const packId = session.metadata.pack_id;

      // Check if already processed (prevent duplicate credits)
      const existingPurchase = await prisma.credit_history.findFirst({
        where: {
          user_id: userId,
          description: { contains: session.id },
        },
      });

      if (!existingPurchase && credits > 0) {
        // Add credits to user
        await addCredits(
          userId,
          credits,
          ProductType.SUBSCRIPTION,
          false,
          `Credit Pack Purchase: ${packId} (${session.id})`
        );

        console.log(`✅ Credits added: ${credits} for user ${userId}`);
      }

      return {
        success: true,
        payment_status: 'paid',
        credits_added: credits,
        message: 'Payment successful, credits added',
      };
    }

    return {
      success: isPaid,
      payment_status: session.payment_status,
      message: isPaid ? 'Payment successful' : 'Payment not completed',
    };
  } catch (error) {
    console.error('Failed to verify payment:', error);
    return {
      success: false,
      payment_status: 'unknown',
      message: 'Failed to verify payment status',
    };
  }
}

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
    const creditPack = getCreditPackById(productId);
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
