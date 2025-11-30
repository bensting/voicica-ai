'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyStripePayment as verifyStripePaymentAction } from '@/actions/payment';
import type { StripeVerifyResponse } from '@/types/subscription';
import { useLanguage } from '@/contexts/LanguageContext';

type PaymentStatus = 'verifying' | 'success' | 'pending' | 'failed';

interface PaymentDetails {
  orderId: string;
  subscriptionId?: string;
  message?: string;
}

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [status, setStatus] = useState<PaymentStatus>('verifying');
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [error, setError] = useState<string>('');
  const [countdown, setCountdown] = useState(5);

  // 验证 Stripe 支付
  const verifyStripePayment = async (params: URLSearchParams) => {
    const requestId = params.get('request_id');
    if (!requestId) {
      throw new Error('Missing Stripe Request ID');
    }

    // 检查用户登录状态
    const { auth } = await import('@/lib/firebase');
    const currentUser = auth.currentUser;
    console.log('🔍 [Stripe验证] 当前用户状态:', {
      isLoggedIn: !!currentUser,
      userId: currentUser?.uid || 'N/A',
      email: currentUser?.email || 'N/A',
    });

    console.log('🔍 [Stripe验证] 请求参数:', { request_id: requestId });

    const response: StripeVerifyResponse = await verifyStripePaymentAction({
      request_id: requestId,
    });

    console.log('✅ Stripe 支付验证结果:', response);

    const details: PaymentDetails = {
      orderId: requestId,
      subscriptionId: response.subscription_id,
      message: response.message,
    };

    setPaymentDetails(details);

    if (response.success && response.payment_status === 'paid') {
      setStatus('success');
    } else if (response.payment_status === 'unpaid') {
      setStatus('pending');
      setError(response.message);
    } else {
      setStatus('failed');
      setError(response.message || `Payment status: ${response.payment_status}`);
    }
  };

  // Google Ads 转化跟踪
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'ads_conversion_purchase', {});
    }
  }, []);

  // 验证支付
  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // 等待 Firebase Auth 初始化
        const { auth } = await import('@/lib/firebase');

        console.log('⏳ [支付验证] 等待 Firebase Auth 初始化...');

        // 等待认证状态稳定（最多等待 5 秒）
        await new Promise<void>((resolve) => {
          const unsubscribe = auth.onAuthStateChanged((user) => {
            console.log('🔔 [支付验证] Auth 状态变化:', user ? `已登录 (${user.uid})` : '未登录');

            // 清除超时定时器
            clearTimeout(timeoutHandle);

            // 用户状态已确定（不管是登录还是未登录）
            unsubscribe();
            resolve();
          });

          // 5秒后超时
          const timeoutHandle = setTimeout(() => {
            console.warn('⚠️ [支付验证] Auth 初始化超时');
            unsubscribe();
            resolve();
          }, 5000);
        });

        await verifyStripePayment(searchParams);
      } catch (err) {
        console.error('❌ 支付验证失败:', err);
        setStatus('failed');
        setError(err instanceof Error ? err.message : 'Payment verification failed');
      }
    };

    verifyPayment();
  }, [searchParams]);

  // 自动跳转倒计时
  useEffect(() => {
    if (status === 'success' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (status === 'success' && countdown === 0) {
      router.push('/studio');
    }
  }, [status, countdown, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* 验证中状态 */}
        {status === 'verifying' && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-100 mb-4">
                <svg
                  className="animate-spin h-10 w-10 text-purple-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {t('payment.success.verifying.title')}
              </h2>
              <p className="text-gray-600">
                {t('payment.success.verifying.description')}
              </p>
            </div>
          </div>
        )}

        {/* 成功状态 */}
        {status === 'success' && paymentDetails && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center animate-fadeIn">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4 animate-scaleIn">
                <svg
                  className="w-10 h-10 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {t('payment.success.success.title')}
              </h2>
              <p className="text-gray-600">
                {t('payment.success.success.description')}
              </p>
            </div>

            {/* 订单摘要 */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 mb-6 text-left">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                {t('payment.success.success.orderSummary')}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">
                    {t('payment.success.success.orderId')}
                  </span>
                  <span className="text-gray-900 font-mono text-sm">
                    {paymentDetails.orderId.slice(0, 20)}...
                  </span>
                </div>
                {paymentDetails.subscriptionId && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">
                      {t('payment.success.success.subscriptionId')}
                    </span>
                    <span className="text-gray-900 font-mono text-sm">
                      {paymentDetails.subscriptionId}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 自动跳转提示 */}
            <div className="text-sm text-gray-500 mb-4">
              {t('payment.success.success.countdown', { count: countdown })}
            </div>

            {/* 立即跳转按钮 */}
            <button
              onClick={() => router.push('/studio')}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
            >
              {t('payment.success.success.enterStudio')}
            </button>
          </div>
        )}

        {/* 待处理状态 */}
        {status === 'pending' && paymentDetails && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center animate-fadeIn">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-100 mb-4">
                <svg
                  className="w-10 h-10 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {t('payment.success.pending.title')}
              </h2>
              <p className="text-gray-600 mb-4">
                {error || t('payment.success.pending.description')}
              </p>
            </div>

            {/* 订单信息 */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">
                  {t('payment.success.pending.orderId')}
                </span>
                <span className="text-gray-900 font-mono">
                  {paymentDetails.orderId.slice(0, 20)}...
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-purple-700 transition-colors"
              >
                {t('payment.success.pending.refresh')}
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full border-2 border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:border-purple-400 hover:text-purple-600 transition-colors"
              >
                {t('payment.success.pending.backHome')}
              </button>
            </div>
          </div>
        )}

        {/* 失败状态 */}
        {status === 'failed' && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center animate-fadeIn">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-4">
                <svg
                  className="w-10 h-10 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {t('payment.success.failed.title')}
              </h2>
              <p className="text-gray-600 mb-4">
                {error || t('payment.success.failed.description')}
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-red-800">
                {t('payment.success.failed.notice')}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-purple-700 transition-colors"
              >
                {t('payment.success.failed.retry')}
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full border-2 border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:border-purple-400 hover:text-purple-600 transition-colors"
              >
                {t('payment.success.failed.backHome')}
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

        @keyframes scaleIn {
          from {
            transform: scale(0);
          }
          to {
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
      `}</style>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-100 mb-4">
            <svg className="animate-spin h-10 w-10 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Loading...</h2>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}