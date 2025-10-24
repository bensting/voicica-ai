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

const Feature = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-3">
    <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-700">
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </span>
    <span className="text-gray-700">{children}</span>
  </li>
);

export default function PricingCard({ plan, isRecommended = false, cycle }: PricingCardProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

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
      className={`relative rounded-3xl p-6 md:p-8 shadow-xl ${
        isRecommended
          ? 'bg-white ring-2 ring-purple-200'
          : 'bg-gradient-to-br from-gray-50 to-purple-50 border border-gray-100'
      }`}
    >
      {/* Recommended Badge */}
      {isRecommended && (
        <span className="absolute -top-3 right-4 rounded-full bg-purple-600 text-white text-xs font-semibold px-3 py-1 shadow">
          Recommended
        </span>
      )}

      {/* Plan Name */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900">{getPlanName()}</h3>
        <p className="text-sm text-gray-600 mt-1">{getPlanDescription()}</p>
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="text-4xl font-bold text-gray-900">
          {priceInfo ? (
            <>
              {getCurrencySymbol(plan.currency)}
              {priceInfo.display}
              <span className="text-base font-medium text-gray-500">
                /{cycle === 'monthly' ? 'month' : 'year'}
              </span>
            </>
          ) : (
            <span className="text-gray-500">Price not available</span>
          )}
        </div>
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-6">
        {getFeatures().map((feature, idx) => (
          <Feature key={idx}>{feature}</Feature>
        ))}
      </ul>

      {/* CTA Button */}
      <button
        onClick={handleUpgrade}
        disabled={!plan.product_id || isLoading}
        className={`w-full flex items-center justify-center gap-2 rounded-xl font-semibold py-3 transition-colors ${
          isRecommended
            ? 'bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed'
            : 'border-2 border-gray-300 text-gray-600 hover:border-purple-400 hover:text-purple-600 disabled:opacity-50 disabled:cursor-not-allowed'
        }`}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing...
          </>
        ) : plan.product_id ? (
          <>
            Upgrade Now
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </>
        ) : (
          'Contact Us'
        )}
      </button>
    </div>
  );
}