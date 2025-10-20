'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { subscriptionAPI } from '@/services/api';
import { SubscriptionStatus, type CreemVerifyRequest, type CreemVerifyResponse } from '@/types/subscription';

type PaymentStatus = 'verifying' | 'success' | 'pending' | 'failed';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<PaymentStatus>('verifying');
  const [paymentDetails, setPaymentDetails] = useState<CreemVerifyResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [countdown, setCountdown] = useState(5);

  // 获取货币符号
  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      case 'CNY':
        return '¥';
      default:
        return '';
    }
  };

  // 格式化金额
  const formatAmount = (amount: number, currency: string) => {
    const value = (amount / 100).toFixed(2);
    return `${getCurrencySymbol(currency)}${value} ${currency}`;
  };

  // 构建验证请求参数
  const buildVerifyRequest = (params: URLSearchParams): CreemVerifyRequest => {
    const signature = params.get('signature');

    if (!signature) {
      throw new Error('缺少签名信息');
    }

    const request: CreemVerifyRequest = { signature };

    // 添加可选参数（只添加存在的值）
    const requestId = params.get('request_id');
    const checkoutId = params.get('checkout_id');
    const orderId = params.get('order_id');
    const customerId = params.get('customer_id');
    const subscriptionId = params.get('subscription_id');
    const productId = params.get('product_id');

    if (requestId) request.request_id = requestId;
    if (checkoutId) request.checkout_id = checkoutId;
    if (orderId) request.order_id = orderId;
    if (customerId) request.customer_id = customerId;
    if (subscriptionId) request.subscription_id = subscriptionId;
    if (productId) request.product_id = productId;

    return request;
  };

  // 验证支付
  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // 构建验证请求参数
        const verifyRequest = buildVerifyRequest(searchParams);

        console.log('🔍 验证支付 (POST):', {
          ...verifyRequest,
          signature: '***'  // 隐藏签名用于日志
        });

        // 调用后端验证接口 (POST)
        const response = await subscriptionAPI.verifyCreemPayment(verifyRequest);

        console.log('✅ 支付验证结果:', response);

        // 保存支付详情
        setPaymentDetails(response);

        // 根据支付状态设置页面状态
        if (response.status === SubscriptionStatus.ACTIVE) {
          setStatus('success');
        } else if (response.status === SubscriptionStatus.PENDING) {
          setStatus('pending');
        } else {
          setStatus('failed');
          setError(`支付状态异常: ${response.status}`);
        }
      } catch (err) {
        console.error('❌ 支付验证失败:', err);
        setStatus('failed');
        setError(err instanceof Error ? err.message : '验证支付失败，请稍后重试');
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
      router.push('/');
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">正在验证支付...</h2>
              <p className="text-gray-600">请稍候，我们正在确认您的支付信息</p>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">支付成功！</h2>
              <p className="text-gray-600">感谢您的购买，订阅已激活</p>
            </div>

            {/* 订单摘要 */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 mb-6 text-left">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                订单摘要
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">订单号</span>
                  <span className="text-gray-900 font-mono text-sm">
                    {paymentDetails.checkout_id.slice(0, 20)}...
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">支付金额</span>
                  <span className="text-gray-900 font-bold text-lg">
                    {formatAmount(paymentDetails.amount, paymentDetails.currency)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">产品 ID</span>
                  <span className="text-gray-900 font-mono text-sm">
                    {paymentDetails.product_id}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">验证状态</span>
                  <span className="inline-flex items-center gap-1">
                    {paymentDetails.verified ? (
                      <>
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-green-600 font-semibold">已验证</span>
                      </>
                    ) : (
                      <span className="text-yellow-600 font-semibold">待验证</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* 自动跳转提示 */}
            <div className="text-sm text-gray-500 mb-4">
              {countdown} 秒后自动返回首页...
            </div>

            {/* 立即返回按钮 */}
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
            >
              立即返回首页
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">支付处理中</h2>
              <p className="text-gray-600 mb-4">
                您的支付正在处理中，订阅将很快激活
              </p>
            </div>

            {/* 订单信息 */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">订单号:</span>
                <span className="text-gray-900 font-mono">
                  {paymentDetails.checkout_id.slice(0, 20)}...
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">金额:</span>
                <span className="text-gray-900 font-semibold">
                  {formatAmount(paymentDetails.amount, paymentDetails.currency)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-purple-700 transition-colors"
              >
                刷新状态
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full border-2 border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:border-purple-400 hover:text-purple-600 transition-colors"
              >
                返回首页
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">支付验证失败</h2>
              <p className="text-gray-600 mb-4">{error || '抱歉，我们无法验证您的支付'}</p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-red-800">
                如果您已完成支付，请稍后刷新页面查看状态，或联系客服获取帮助。
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-purple-700 transition-colors"
              >
                重新验证
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full border-2 border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:border-purple-400 hover:text-purple-600 transition-colors"
              >
                返回首页
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