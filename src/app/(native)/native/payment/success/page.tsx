'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyStripePayment } from '@/actions/payment';
import type { StripeVerifyResponse } from '@/types/subscription';
import { useCredits } from '@/contexts/CreditsContext';
import { useSubscription } from '@/contexts/SubscriptionContext';

type PaymentStatus = 'verifying' | 'success' | 'pending' | 'failed';

interface PaymentDetails {
  orderId: string;
  subscriptionId?: string;
  message?: string;
}

// 成功图标
const SuccessIcon = () => (
  <svg className="w-16 h-16 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

// 待处理图标
const PendingIcon = () => (
  <svg className="w-16 h-16 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// 失败图标
const FailedIcon = () => (
  <svg className="w-16 h-16 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshCredits } = useCredits();
  const { refreshSubscription } = useSubscription();
  const [status, setStatus] = useState<PaymentStatus>('verifying');
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [error, setError] = useState<string>('');
  const [countdown, setCountdown] = useState(5);

  // 验证 Stripe 支付（仅用于订阅）
  const doVerifyPayment = useCallback(async (params: URLSearchParams) => {
    const requestId = params.get('request_id');
    if (!requestId) {
      throw new Error('Missing Stripe Request ID');
    }

    const response: StripeVerifyResponse = await verifyStripePayment({
      request_id: requestId,
    });

    const details: PaymentDetails = {
      orderId: requestId,
      subscriptionId: response.subscription_id,
      message: response.message,
    };

    setPaymentDetails(details);

    if (response.success && response.payment_status === 'paid') {
      setStatus('success');
      refreshCredits();
      refreshSubscription();
    } else if (response.payment_status === 'unpaid') {
      setStatus('pending');
      setError(response.message);
    } else {
      setStatus('failed');
      setError(response.message || `Payment status: ${response.payment_status}`);
    }
  }, [refreshCredits, refreshSubscription]);

  // 验证支付
  useEffect(() => {
    const doVerify = async () => {
      try {
        // 检查是否是 Google Play 购买
        const source = searchParams.get('source');
        if (source === 'google_play') {
          const paymentType = searchParams.get('type');
          const subscriptionId = searchParams.get('subscription_id');
          const creditsAdded = searchParams.get('credits');

          setPaymentDetails({
            orderId: `GP-${subscriptionId || Date.now()}`,
            subscriptionId: subscriptionId || undefined,
            message: paymentType === 'credit_pack'
              ? `${creditsAdded} credits added to your account`
              : 'Google Play purchase verified',
          });
          setStatus('success');
          // 刷新积分和订阅状态
          refreshCredits();
          refreshSubscription();
          return;
        }

        // Stripe 支付验证
        const { auth } = await import('@/lib/firebase');
        await new Promise<void>((resolve) => {
          const unsubscribe = auth.onAuthStateChanged(() => {
            unsubscribe();
            resolve();
          });
          setTimeout(() => {
            unsubscribe();
            resolve();
          }, 5000);
        });

        await doVerifyPayment(searchParams);
      } catch (err) {
        console.error('Payment verification failed:', err);
        setStatus('failed');
        setError(err instanceof Error ? err.message : 'Payment verification failed');
      }
    };

    doVerify();
  }, [searchParams, refreshCredits, refreshSubscription, doVerifyPayment]);

  // 自动跳转倒计时
  useEffect(() => {
    if (status === 'success' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (status === 'success' && countdown === 0) {
      router.push('/native/me');
    }
  }, [status, countdown, router]);

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        {/* 验证中状态 */}
        {status === 'verifying' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-purple-500/20 mb-6">
              <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Verifying Payment
            </h2>
            <p className="text-gray-400">
              Please wait while we confirm your payment...
            </p>
          </div>
        )}

        {/* 成功状态 */}
        {status === 'success' && (
          <div className="text-center animate-fadeIn">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-500/20 mb-6">
              <SuccessIcon />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Payment Successful!
            </h2>
            <p className="text-gray-400 mb-6">
              {paymentDetails?.message || 'Your purchase is complete. Enjoy your credits!'}
            </p>

            {/* 订单摘要 */}
            {paymentDetails && (
              <div className="bg-gray-800/50 rounded-2xl p-4 mb-6 text-left">
                <h3 className="text-gray-400 text-xs uppercase tracking-wide mb-3">
                  Order Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Order ID</span>
                    <span className="text-white font-mono text-xs">
                      {paymentDetails.orderId.slice(0, 16)}...
                    </span>
                  </div>
                  {paymentDetails.subscriptionId && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Subscription</span>
                      <span className="text-white font-mono text-xs">
                        #{paymentDetails.subscriptionId}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 自动跳转提示 */}
            <p className="text-gray-500 text-sm mb-4">
              Redirecting in {countdown} seconds...
            </p>

            {/* 立即跳转按钮 */}
            <button
              onClick={() => router.push('/native/me')}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              Go to My Page
            </button>
          </div>
        )}

        {/* 待处理状态 */}
        {status === 'pending' && (
          <div className="text-center animate-fadeIn">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-yellow-500/20 mb-6">
              <PendingIcon />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Payment Pending
            </h2>
            <p className="text-gray-400 mb-6">
              {error || 'Your payment is being processed. This may take a moment.'}
            </p>

            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-purple-700 transition-colors"
              >
                Check Again
              </button>
              <button
                onClick={() => router.push('/native/me')}
                className="w-full border-2 border-gray-700 text-gray-300 font-semibold py-3 px-6 rounded-xl hover:border-gray-600 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        )}

        {/* 失败状态 */}
        {status === 'failed' && (
          <div className="text-center animate-fadeIn">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-500/20 mb-6">
              <FailedIcon />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Payment Failed
            </h2>
            <p className="text-gray-400 mb-4">
              {error || 'Something went wrong with your payment.'}
            </p>

            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
              <p className="text-sm text-red-400">
                If you were charged, please contact support.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => router.push('/native/subscribe')}
                className="w-full bg-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-purple-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/native/me')}
                className="w-full border-2 border-gray-700 text-gray-300 font-semibold py-3 px-6 rounded-xl hover:border-gray-600 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}

export default function NativePaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-purple-500/20 mb-6">
              <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-white">Loading...</h2>
          </div>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
