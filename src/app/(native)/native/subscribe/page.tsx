'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useCredits } from '@/contexts/CreditsContext';
import { getMyActiveSubscription } from '@/actions/subscription';
import { createStripeCheckout } from '@/actions/payment';
import { verifyGooglePlayPurchase } from '@/actions/google-play';
import { verifyGooglePlayCreditPackPurchase } from '@/actions/native-payment';
import { useGooglePlayBilling } from '@/hooks/useGooglePlayBilling';
import type { UserSubscription } from '@/types/subscription';
import LoginModal from '@/components/native/LoginModal';
import CreditsIcon from '@/components/native/common/CreditsIcon';
import GradientButton from '@/components/native/common/GradientButton';
import {
  subscriptionPlans,
  creditPacks,
  formatCredits,
  getBillingPeriodText,
  type SubscriptionPlanConfig,
  type CreditPackConfig,
} from '@/config/native/subscription';

type TabType = 'subscription' | 'credits';

// Close icon
const CloseIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

// Check icon
const CheckIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20,6 9,17 4,12" />
  </svg>
);

// Crown icon
const CrownIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" />
  </svg>
);

/**
 * Native Subscription Page
 * Subscription plans and credit packs
 */
export default function NativeSubscribePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useFirebaseAuth();
  const { credits } = useCredits();
  const { purchase: googlePlayPurchase, shouldUseGooglePlay, isLoading: gpLoading } = useGooglePlayBilling();

  const [activeTab, setActiveTab] = useState<TabType>('subscription');
  const [activeSubscription, setActiveSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanConfig | null>(subscriptionPlans[0]);
  const [selectedCreditPack, setSelectedCreditPack] = useState<CreditPackConfig | null>(creditPacks[0]);

  // Fetch current subscription status
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (user) {
          const subscription = await getMyActiveSubscription();
          setActiveSubscription(subscription);
        }
      } catch (error) {
        console.error('Failed to fetch subscription data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchData();
    }
  }, [user, authLoading]);

  // Handle subscription purchase
  const handleSubscribe = async (plan: SubscriptionPlanConfig) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    const productId = plan.stripeProductId;
    if (!productId) {
      alert('Product information is not available');
      return;
    }

    setProcessingId(plan.id);

    try {
      if (shouldUseGooglePlay && plan.googlePlayProductId) {
        const result = await googlePlayPurchase(plan.googlePlayProductId);
        if (result.success && result.purchaseToken) {
          const verifyResult = await verifyGooglePlayPurchase({
            purchaseToken: result.purchaseToken,
            productId: result.productId || plan.googlePlayProductId,
            orderId: result.orderId,
          });

          if (verifyResult.success) {
            router.push(`/native/payment/success?source=google_play&subscription_id=${verifyResult.subscriptionId}`);
          } else {
            alert(verifyResult.error || 'Failed to verify purchase');
          }
        } else if (!result.cancelled) {
          alert(result.error || 'Purchase could not be completed');
        }
        return;
      }

      const successUrl = `${window.location.origin}/native/payment/success`;
      const cancelUrl = `${window.location.origin}/native/subscribe`;

      const data = await createStripeCheckout({
        product_id: productId,
        currency: plan.currency.toLowerCase(),
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert(error instanceof Error ? error.message : 'Failed to start checkout');
    } finally {
      setProcessingId(null);
    }
  };

  // Handle credit pack purchase (Google Play INAPP for native app)
  const handleBuyCreditPack = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (!selectedCreditPack) {
      alert('Please select a credit pack');
      return;
    }

    // Native app 使用 Google Play Billing 购买积分包
    if (!shouldUseGooglePlay) {
      alert('Credit pack purchase is only available in the app');
      return;
    }

    const googlePlayProductId = selectedCreditPack.googlePlayProductId;
    if (!googlePlayProductId) {
      alert('Product information is not available');
      return;
    }

    setProcessingId(selectedCreditPack.id);

    try {
      // Google Play 一次性购买（INAPP）
      const result = await googlePlayPurchase(googlePlayProductId);

      if (result.success && result.purchaseToken) {
        const verifyResult = await verifyGooglePlayCreditPackPurchase({
          purchaseToken: result.purchaseToken,
          productId: result.productId || googlePlayProductId,
          orderId: result.orderId,
        });

        if (verifyResult.success) {
          router.push(`/native/payment/success?source=google_play&type=credit_pack&credits=${verifyResult.credits_added}`);
        } else {
          alert(verifyResult.error || 'Failed to verify purchase');
        }
      } else if (!result.cancelled) {
        alert(result.error || 'Purchase could not be completed');
      }
    } catch (error) {
      console.error('Credit pack purchase error:', error);
      alert(error instanceof Error ? error.message : 'Failed to purchase');
    } finally {
      setProcessingId(null);
    }
  };

  const isProcessing = processingId !== null || gpLoading;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0a0a1a] flex flex-col overflow-auto">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 via-transparent to-transparent pointer-events-none" />

      {/* 关闭按钮 - 直接放在容器里，和 LoginModal 一样 */}
      <button
        onClick={() => router.back()}
        className="absolute left-4 z-20 w-10 h-10 flex items-center justify-center bg-gray-800/50 rounded-full text-gray-300 hover:text-white transition-colors"
        style={{ top: 'calc(var(--safe-area-inset-top, 0px) + 8px)' }}
      >
        <CloseIcon />
      </button>

      {/* Credits display */}
      <div
        className="relative z-10 text-center py-4"
        style={{ marginTop: 'calc(var(--safe-area-inset-top, 0px) + 56px)' }}
      >
        <div className="flex items-center justify-center gap-2 text-purple-400 mb-1">
          <CreditsIcon className="w-6 h-6" />
          <span className="text-4xl font-bold text-white">{credits}</span>
        </div>
        <p className="text-gray-500 text-sm">
          {activeSubscription ? 'Become VIP: +20% credits on every pack' : 'Not Subscribed'}
        </p>
      </div>

      {/* Tabs */}
      <div className="relative z-10 px-6 mb-4">
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('subscription')}
            className={`flex-1 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${
              activeTab === 'subscription'
                ? 'text-white border-white'
                : 'text-gray-500 border-transparent'
            }`}
          >
            Subscription
          </button>
          <button
            onClick={() => setActiveTab('credits')}
            className={`flex-1 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${
              activeTab === 'credits'
                ? 'text-white border-white'
                : 'text-gray-500 border-transparent'
            }`}
          >
            Credit Packs
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 pb-48">
        {activeTab === 'subscription' ? (
          /* Subscription Tab */
          <div className="space-y-6">
            {/* Subscription plans list */}
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {subscriptionPlans.map((plan) => {
                  const isSelected = selectedPlan?.id === plan.id;

                  return (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan)}
                      className={`relative w-full p-4 rounded-2xl text-left transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 border-2 border-purple-500'
                          : 'bg-gray-800/60 border-2 border-transparent'
                      }`}
                    >
                      {/* Popular badge */}
                      {plan.isPopular && (
                        <span className="absolute -top-2 right-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                          Most Popular
                        </span>
                      )}

                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-white font-semibold">{plan.name}</h3>
                          <p className="text-gray-400 text-sm">
                            {formatCredits(plan.credits)} credits / {getBillingPeriodText(plan.billingPeriod)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-white text-xl font-bold">
                            ${plan.price.toFixed(2)}
                          </span>
                          <span className="text-gray-500 text-sm ml-1">
                            /{getBillingPeriodText(plan.billingPeriod)}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Membership benefits */}
            <div className="bg-gray-800/40 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <CrownIcon />
                <span className="text-white font-semibold">Membership Benefits</span>
              </div>
              <div className="space-y-3">
                {[
                  `${formatCredits(selectedPlan?.credits || 0)} credits refresh monthly`,
                  'Fast Generation Channel',
                  'Simultaneous Generations',
                  'Higher Quality',
                  'Watermark-free Downloads',
                ].map((text, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-green-400 flex-shrink-0">
                      <CheckIcon />
                    </span>
                    <span className="text-gray-300 text-sm">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Credit Packs Tab */
          <div>
            {/* Credit packs grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {creditPacks.map((pack) => {
                const isSelected = selectedCreditPack?.id === pack.id;

                return (
                  <button
                    key={pack.id}
                    onClick={() => setSelectedCreditPack(pack)}
                    className={`rounded-2xl p-4 text-center transition-all ${
                      isSelected
                        ? 'bg-gradient-to-br from-purple-600/40 to-blue-600/40 border-2 border-purple-500'
                        : 'bg-gray-800/60 border-2 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5 mb-2">
                      <CreditsIcon className="w-4 h-4 text-purple-400" />
                      <span className="text-white text-2xl font-bold">{pack.credits}</span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      {pack.currency} ${pack.price.toFixed(2)}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Credit pack description */}
            <div className="text-center text-gray-500 text-xs space-y-2 mt-8">
              <p>Validity Period of the Credits Pack: Lifetime</p>
              <p className="text-[10px] leading-relaxed px-4">
                Subscription Terms: Payment is charged to your account upon confirmation.
                Subscription auto-renews at the original price, unless canceled at least
                24 hours before the current period ends. Manage your subscription and
                auto-renewal in Account Settings.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <Link href="/terms" className="text-purple-400 hover:underline">
                  Terms of Use
                </Link>
                <span className="text-gray-600">|</span>
                <Link href="/privacy" className="text-purple-400 hover:underline">
                  Privacy Policy
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom button */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 px-4 py-4 bg-gradient-to-t from-[#0a0a1a] via-[#0a0a1a] to-transparent"
        style={{ paddingBottom: 'calc(var(--safe-area-inset-bottom, 0px) + 16px)' }}
      >
        {activeTab === 'subscription' && selectedPlan && (
          <GradientButton
            onClick={() => handleSubscribe(selectedPlan)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </>
            ) : (
              <>Subscribe Now - ${selectedPlan.price.toFixed(2)}/{getBillingPeriodText(selectedPlan.billingPeriod)}</>
            )}
          </GradientButton>
        )}

        {activeTab === 'credits' && selectedCreditPack && (
          <GradientButton
            onClick={handleBuyCreditPack}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </>
            ) : (
              <>Buy Now - ${selectedCreditPack.price.toFixed(2)}</>
            )}
          </GradientButton>
        )}
      </div>

      {/* Login modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={() => {
          setShowLoginModal(false);
          window.location.reload();
        }}
      />
    </div>
  );
}
