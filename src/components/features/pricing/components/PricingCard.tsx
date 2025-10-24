'use client';

import { useState } from 'react';
import { SubscriptionPlanWithPrice } from '@/types/subscription';
import { useAuth } from '@/contexts/AuthContext';
import { subscriptionAPI } from '@/lib/api';
import { BillingCycle } from '../hooks/usePricing';

interface PricingCardProps {
  plan: SubscriptionPlanWithPrice;
  isRecommended?: boolean;
  cycle: BillingCycle;
}

const Feature = ({ children, isNegative = false }: { children: React.ReactNode; isNegative?: boolean }) => (
  <li className="flex items-start gap-2 text-sm">
    <span className={`mt-0.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center ${isNegative ? 'text-gray-300' : 'text-purple-600'}`}>
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {isNegative ? (
          <path d="M6 18L18 6M6 6l12 12" />
        ) : (
          <path d="M5 13l4 4L19 7" />
        )}
      </svg>
    </span>
    <span className={isNegative ? 'text-gray-400' : 'text-gray-700'}>{children}</span>
  </li>
);

export default function PricingCard({ plan, isRecommended = false, cycle }: PricingCardProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const isFree = plan.plan_name === 'Free';

  // 格式化价格显示
  const formatPrice = () => {
    if (!plan.price || !plan.currency) return null;

    const price = plan.price / 100; // 从分转换为元
    const formattedPrice = price.toFixed(2);

    return {
      display: formattedPrice,
      currency: plan.currency,
    };
  };

  const priceInfo = formatPrice();

  // 获取货币符号
  const getCurrencySymbol = (currency?: string) => {
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

  // 获取计划名称
  const getPlanName = () => {
    return plan.display_name?.en || plan.display_name?.['zh-Hans'] || 'Plan';
  };

  // 获取计划描述
  const getPlanDescription = () => {
    if (plan.credits_per_cycle > 0) {
      return `${plan.credits_per_cycle} credits per ${cycle === 'monthly' ? 'month' : 'year'}`;
    }
    return 'Limited features';
  };

  // 获取功能列表
  const getFeatures = () => {
    return plan.features?.en || plan.features?.['zh-Hans'] || [];
  };

  // 处理升级按钮点击
  const handleUpgrade = async () => {
    // 检查是否有 product_id
    if (!plan.product_id) {
      console.error('❌ Product ID not found');
      alert('Product information is not available. Please try again later.');
      return;
    }

    // 如果用户未登录，提示登录
    if (!user) {
      alert('Please login to upgrade your plan');
      return;
    }

    setIsLoading(true);

    try {
      // 获取支付平台配置
      const paymentProvider = process.env.NEXT_PUBLIC_PAYMENT_PROVIDER || 'creem';
      console.log(`📡 Creating ${paymentProvider} checkout session for product:`, plan.product_id);

      // 获取回调 URL
      const successUrl = process.env.NEXT_PUBLIC_PAYMENT_SUCCESS_URL || `${window.location.origin}/payment/success`;
      const cancelUrl = process.env.NEXT_PUBLIC_PAYMENT_CANCEL_URL || `${window.location.origin}/pricing`;

      let data: { checkout_url: string };

      // 根据配置的支付平台调用不同的 API
      if (paymentProvider === 'stripe') {
        data = await subscriptionAPI.createStripeCheckout({
          product_id: plan.product_id,
          success_url: successUrl,
          cancel_url: cancelUrl,
        });
      } else {
        // 默认使用 Creem
        data = await subscriptionAPI.createCreemCheckout({
          product_id: plan.product_id,
          success_url: successUrl,
        });
      }

      console.log('✅ Checkout session created:', data);

      // 跳转到支付页面
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        throw new Error('Checkout URL not returned');
      }
    } catch (error) {
      console.error('❌ Error creating checkout:', error);
      alert(error instanceof Error ? error.message : 'Failed to start checkout process. Please try again.');
      setIsLoading(false);
    }
    // 注意：跳转成功后页面会离开，所以不需要 setIsLoading(false)
  };

  return (
    <div
      className={`relative rounded-2xl border-2 p-6 flex flex-col ${
        isRecommended
          ? 'border-purple-400 bg-purple-50 shadow-lg'
          : 'border-gray-200 bg-white hover:border-purple-200 transition-colors'
      }`}
    >
      {/* Most Popular Badge */}
      {isRecommended && (
        <div className="absolute -top-3 -right-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md transform rotate-12">
          Most Popular
        </div>
      )}

      {/* Plan Name */}
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-gray-900">{getPlanName()}</h3>
      </div>

      {/* Price */}
      <div className="text-center mb-6">
        {isFree ? (
          <div className="text-2xl font-bold text-gray-900">Free for everyone</div>
        ) : priceInfo ? (
          <>
            <div className="text-3xl font-bold text-gray-900">
              {getCurrencySymbol(plan.currency)}
              {priceInfo.display}
              <span className="text-lg font-normal text-gray-600">/Month</span>
            </div>
            {plan.price && (
              <div className="text-sm text-gray-500 mt-1">
                Renewal at {getCurrencySymbol(plan.currency)}
                {((plan.price * 1.6) / 100).toFixed(2)}
              </div>
            )}
          </>
        ) : (
          <div className="text-gray-500">Price not available</div>
        )}
      </div>

      {/* CTA Button */}
      <button
        onClick={handleUpgrade}
        disabled={!isFree && (!plan.product_id || isLoading)}
        className={`w-full rounded-xl font-semibold py-3 mb-6 transition-colors ${
          isRecommended || (!isFree && plan.product_id)
            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 disabled:opacity-50'
            : isFree
            ? 'bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing...
          </span>
        ) : isFree ? (
          'Try it Free'
        ) : (
          'Buy Now'
        )}
      </button>

      {/* Features */}
      <ul className="space-y-3 flex-grow">
        {getFeatures().map((feature, idx) => {
          const isNegative = feature.toLowerCase().includes('not supported') ||
                            feature.toLowerCase().includes('no ') ||
                            feature.toLowerCase().includes('limited');
          return <Feature key={idx} isNegative={isNegative}>{feature}</Feature>;
        })}
      </ul>

      {/* Auto-renew notice */}
      {!isFree && (
        <div className="text-xs text-gray-500 text-center mt-6 pt-4 border-t border-gray-200">
          Auto-renew. Cancel at any time.
        </div>
      )}
    </div>
  );
}