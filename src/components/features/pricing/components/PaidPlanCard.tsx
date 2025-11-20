'use client';

import { useState } from 'react';
import { PricingPlan } from '@/types/subscription';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { createStripeCheckout } from '@/actions/payment';
import { BillingCycle } from '../hooks/usePricing';
import { getCurrencySymbol, getCurrencyFromLocale } from '@/config/currency';
import { useLanguage } from '@/contexts/LanguageContext';
import LoginPrompt from './LoginPrompt';

interface PaidPlanCardProps {
  plan: PricingPlan;
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

export default function PaidPlanCard({ plan, isRecommended = false }: PaidPlanCardProps) {
  const { user } = useFirebaseAuth();
  const { locale, t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // 格式化价格显示
  const formatPrice = () => {
    // 如果没有价格信息，返回 null
    if (!plan.price && !plan.discounted_price) return null;

    // 获取用户偏好的货币
    const preferredCurrency = getCurrencyFromLocale(locale);

    // 确定要使用的货币
    const availableCurrencies = Object.keys(plan.discounted_price || plan.price || {});
    let selectedCurrency = preferredCurrency;

    // 如果用户偏好货币不可用，尝试 USD
    if (!availableCurrencies.includes(selectedCurrency)) {
      selectedCurrency = 'USD';
    }

    // 如果 USD 也不可用，使用第一个可用货币
    if (!availableCurrencies.includes(selectedCurrency) && availableCurrencies.length > 0) {
      selectedCurrency = availableCurrencies[0];
    }

    // 获取原价和折扣价
    const originalPrice = plan.price?.[selectedCurrency];
    const discountedPrice = plan.discounted_price?.[selectedCurrency];

    // 优先显示折扣价，如果没有折扣价则显示原价
    const displayPrice = discountedPrice ?? originalPrice;

    // 如果最终还是没有价格，返回 null
    if (displayPrice === undefined) return null;

    return {
      display: displayPrice.toFixed(2),
      currency: selectedCurrency,
      originalPrice: originalPrice,
      discountedPrice: discountedPrice,
    };
  };

  const priceInfo = formatPrice();

  // 获取计划名称（根据当前语言）
  const getPlanName = () => {
    // 优先使用当前语言，然后回退到英文，最后使用任何可用的语言
    return plan.display_name?.[locale] ||
           plan.display_name?.en ||
           plan.display_name?.['zh-CN'] ||
           Object.values(plan.display_name || {})[0] ||
           'Plan';
  };

  // 获取功能列表（根据当前语言）
  const getFeatures = () => {
    // 优先使用当前语言，然后回退到英文
    return plan.features?.[locale] ||
           plan.features?.en ||
           plan.features?.['zh-CN'] ||
           Object.values(plan.features || {})[0] ||
           [];
  };

  // 处理升级按钮点击
  const handleUpgrade = async () => {
    console.log('🔵 [handleUpgrade] Start - Plan:', plan.plan_name);
    console.log('🔵 [handleUpgrade] Product ID:', plan.product_id);
    console.log('🔵 [handleUpgrade] User:', user?.id || 'Not logged in');

    // 检查是否有 product_id
    if (!plan.product_id) {
      console.error('❌ Product ID not found');
      alert('Product information is not available. Please try again later.');
      return;
    }

    // 如果用户未登录，显示登录提示
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    setIsLoading(true);

    try {
      // 获取回调 URL
      const successUrl = process.env.NEXT_PUBLIC_PAYMENT_SUCCESS_URL || `${window.location.origin}/payment/success`;
      const cancelUrl = process.env.NEXT_PUBLIC_PAYMENT_CANCEL_URL || `${window.location.origin}/pricing`;
      console.log('📡 [handleUpgrade] Success URL:', successUrl);
      console.log('📡 [handleUpgrade] Cancel URL:', cancelUrl);

      // 获取当前计划的货币
      const currency = priceInfo?.currency?.toLowerCase() || 'usd';
      console.log('📡 [handleUpgrade] Currency:', currency);

      const requestData = {
        product_id: plan.product_id,
        currency: currency,
        success_url: successUrl,
        cancel_url: cancelUrl,
      };
      console.log('📡 [handleUpgrade] Request data:', JSON.stringify(requestData, null, 2));

      const data = await createStripeCheckout(requestData);
      console.log('✅ [handleUpgrade] Stripe API response:', JSON.stringify(data, null, 2));

      // 检查响应数据
      if (!data || typeof data !== 'object') {
        console.error('❌ [handleUpgrade] Invalid response data:', data);
        throw new Error('Invalid response from payment provider');
      }

      console.log('✅ [handleUpgrade] Checkout session created successfully');
      console.log('✅ [handleUpgrade] Checkout URL:', data.checkout_url);

      // 跳转到支付页面
      if (data.checkout_url) {
        // 检测设备类型
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        console.log('📱 [handleUpgrade] Device type:', isMobile ? 'Mobile' : 'Desktop');

        if (isMobile) {
          // 移动端：同窗口跳转
          console.log('🔄 [handleUpgrade] Redirecting in same window (mobile)');
          window.location.href = data.checkout_url;
        } else {
          // 桌面端：新标签页打开
          console.log('🔄 [handleUpgrade] Opening in new tab (desktop)');
          const newWindow = window.open(data.checkout_url, '_blank');

          // 检查是否被浏览器拦截
          if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            console.warn('⚠️ [handleUpgrade] Popup blocked, falling back to same window');
            window.location.href = data.checkout_url;
          } else {
            console.log('✅ [handleUpgrade] New tab opened successfully');
            setIsLoading(false);
          }
        }
      } else {
        console.error('❌ [handleUpgrade] Checkout URL missing in response');
        throw new Error('Checkout URL not returned');
      }
    } catch (error) {
      console.error('❌ [handleUpgrade] Error:', error);
      if (error instanceof Error) {
        console.error('❌ [handleUpgrade] Error message:', error.message);
        console.error('❌ [handleUpgrade] Error stack:', error.stack);
      }
      alert(error instanceof Error ? error.message : 'Failed to start checkout process. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* 登录提示模态框 */}
      <LoginPrompt
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
      />

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
          {t('pricing.mostPopular')}
        </div>
      )}

      {/* Plan Name */}
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-gray-900">{getPlanName()}</h3>
      </div>

      {/* Price */}
      <div className="text-center mb-6">
        {priceInfo ? (
          <>
            {/* 主价格行：划掉的原价（如果有折扣）+ 当前价格 */}
            <div className="flex items-center justify-center gap-2 mb-1 flex-wrap">
              {priceInfo.originalPrice && priceInfo.discountedPrice && priceInfo.originalPrice !== priceInfo.discountedPrice && (
                <span className="text-lg text-gray-400 line-through whitespace-nowrap">
                  {getCurrencySymbol(priceInfo.currency)}
                  {priceInfo.originalPrice.toFixed(2)}
                </span>
              )}
              <div className="text-3xl font-bold text-gray-900 whitespace-nowrap">
                {getCurrencySymbol(priceInfo.currency)}
                {priceInfo.display}
                <span className="text-lg font-normal text-gray-600">
                  /{plan.billing_period === 'year' ? t('pricing.year') : t('pricing.month')}
                </span>
              </div>
            </div>
            {/* Renewal 提示 */}
            {priceInfo.originalPrice && (
              <div className="text-sm text-gray-500">
                {t('pricing.renewalAt')} {getCurrencySymbol(priceInfo.currency)}
                {priceInfo.originalPrice.toFixed(2)}
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
        disabled={!plan.product_id || isLoading}
        className={`w-full rounded-xl font-semibold py-3 mb-6 transition-colors ${
          isRecommended || plan.product_id
            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 disabled:opacity-50'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {t('pricing.processing')}
          </span>
        ) : (
          t('pricing.buyNow')
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
      <div className="text-xs text-gray-500 text-center mt-6 pt-4 border-t border-gray-200">
        {t('pricing.autoRenew')}
      </div>
      </div>
    </>
  );
}