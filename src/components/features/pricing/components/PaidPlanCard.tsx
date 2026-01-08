'use client';

import { useState, useMemo, useEffect } from 'react';
import { PricingPlan } from '@/types/subscription';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { createStripeCheckout } from '@/actions/payment';
import { trackUserEvent } from '@/actions/user';
import { verifyGooglePlayPurchase } from '@/actions/google-play';
import { BillingCycle } from '../hooks/usePricing';
import { getCurrencySymbol, getCurrencyFromLocale } from '@/config/currency';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGooglePlayBilling } from '@/hooks/useGooglePlayBilling';
import LoginPrompt from './LoginPrompt';
import CreditsSlider from './CreditsSlider';

interface PaidPlanCardProps {
  plan: PricingPlan;
  isRecommended?: boolean;
  cycle: BillingCycle;
}

export default function PaidPlanCard({ plan }: PaidPlanCardProps) {
  const { user } = useFirebaseAuth();
  const { locale, t } = useLanguage();
  const { purchase: googlePlayPurchase, shouldUseGooglePlay, isLoading: gpLoading } = useGooglePlayBilling();
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // 合并 loading 状态
  const isProcessing = isLoading || gpLoading;

  // 积分档位状态（优先使用配置中的 default，否则选中中间档位）
  const hasCreditTiers = plan.credit_tiers && plan.credit_tiers.length > 0;
  const hasMultipleTiers = plan.credit_tiers && plan.credit_tiers.length > 1;
  const defaultTierIndex = useMemo(() => {
    if (!hasCreditTiers) return 0;
    // 查找配置中标记为 default 的档位
    const defaultIndex = plan.credit_tiers!.findIndex(tier => tier.default);
    if (defaultIndex !== -1) return defaultIndex;
    // 回退到中间档位
    return Math.floor((plan.credit_tiers!.length - 1) / 2);
  }, [hasCreditTiers, plan.credit_tiers]);
  const [selectedTierIndex, setSelectedTierIndex] = useState(defaultTierIndex);

  // 监听页面可见性变化，用户从 Stripe 返回时重置 loading 状态
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setIsLoading(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // 获取当前选中的档位
  const currentTier = useMemo(() => {
    if (hasCreditTiers) {
      return plan.credit_tiers![selectedTierIndex];
    }
    return null;
  }, [hasCreditTiers, plan.credit_tiers, selectedTierIndex]);

  // 获取用户偏好的货币
  const preferredCurrency = getCurrencyFromLocale(locale);

  // 格式化价格显示
  const priceInfo = useMemo(() => {
    // 使用当前选中的档位价格
    if (!currentTier) return null;

    const price = currentTier.price;
    const discountedPrice = currentTier.discounted_price;

    if (!price && !discountedPrice) return null;

    // 确定要使用的货币
    const availableCurrencies = Object.keys(discountedPrice || price || {});
    let selectedCurrency = preferredCurrency;

    if (!availableCurrencies.includes(selectedCurrency)) {
      selectedCurrency = 'USD';
    }
    if (!availableCurrencies.includes(selectedCurrency) && availableCurrencies.length > 0) {
      selectedCurrency = availableCurrencies[0];
    }

    const originalPrice = price?.[selectedCurrency as keyof typeof price];
    const discountPrice = discountedPrice?.[selectedCurrency as keyof typeof discountedPrice];
    const displayPrice = discountPrice ?? originalPrice;

    if (displayPrice === undefined) return null;

    return {
      display: displayPrice.toFixed(2),
      currency: selectedCurrency,
      originalPrice: originalPrice,
      discountedPrice: discountPrice,
    };
  }, [currentTier, preferredCurrency]);


  // 获取当前积分数
  const currentCredits = useMemo(() => {
    if (currentTier) {
      return currentTier.credits;
    }
    // 如果没有选中档位，使用第一个档位的积分数
    if (hasCreditTiers && plan.credit_tiers!.length > 0) {
      return plan.credit_tiers![0].credits;
    }
    return 0;
  }, [currentTier, hasCreditTiers, plan.credit_tiers]);

  // 获取当前 product_id（从选中的档位获取）
  const currentProductId = useMemo(() => {
    if (currentTier?.product_id) {
      return currentTier.product_id;
    }
    // 如果没有选中档位，使用第一个档位的 product_id
    if (hasCreditTiers && plan.credit_tiers[0]?.product_id) {
      return plan.credit_tiers[0].product_id;
    }
    return null;
  }, [currentTier, hasCreditTiers, plan.credit_tiers]);

  // 获取计划名称（根据当前语言）
  const getPlanName = () => {
    return plan.display_name?.[locale] ||
           plan.display_name?.en ||
           plan.display_name?.['zh-CN'] ||
           Object.values(plan.display_name || {})[0] ||
           'Plan';
  };

  // 获取首月优惠标签（根据当前语言）
  const getCouponLabel = () => {
    if (!plan.enable_first_month_coupon || !plan.first_month_coupon_label) return null;
    return plan.first_month_coupon_label[locale] ||
           plan.first_month_coupon_label.en ||
           plan.first_month_coupon_label['zh-CN'] ||
           null;
  };

  // 获取计费周期文本
  const getBillingPeriodText = () => {
    switch (plan.billing_period) {
      case 'week':
        return t('pricing.week');
      case 'year':
        return t('pricing.year');
      default:
        return t('pricing.month');
    }
  };

  // 处理升级按钮点击
  const handleUpgrade = async () => {
    console.log('🔵 [handleUpgrade] Start - Plan:', plan.plan_name);
    console.log('🔵 [handleUpgrade] Product ID:', currentProductId);
    console.log('🔵 [handleUpgrade] User:', user?.uid || 'Not logged in');
    console.log('🔵 [handleUpgrade] Use Google Play:', shouldUseGooglePlay);

    if (!currentProductId) {
      console.error('❌ Product ID not found');
      alert('Product information is not available. Please try again later.');
      return;
    }

    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    // 记录 Buy Now 点击事件
    trackUserEvent('buy_now_clicked', {
      plan: plan.plan_name,
      product_id: currentProductId,
      credits: currentCredits,
      price: priceInfo?.display,
      currency: priceInfo?.currency,
      source: 'upgrade_modal',
      payment_method: shouldUseGooglePlay ? 'google_play' : 'stripe',
    });

    // Android 原生平台使用 Google Play Billing
    if (shouldUseGooglePlay) {
      setIsLoading(true);
      try {
        const result = await googlePlayPurchase(currentProductId);
        if (result.success && result.purchaseToken) {
          console.log('✅ [handleUpgrade] Google Play purchase successful:', result);

          // 调用后端验证购买并发放积分
          const verifyResult = await verifyGooglePlayPurchase({
            purchaseToken: result.purchaseToken,
            productId: result.productId || currentProductId,
            orderId: result.orderId,
          });

          if (verifyResult.success) {
            console.log('✅ [handleUpgrade] Purchase verified, subscription:', verifyResult.subscriptionId);
            // 购买成功，跳转到成功页面（带 Google Play 标识）
            window.location.href = `/studio/payment/success?source=google_play&subscription_id=${verifyResult.subscriptionId}`;
          } else {
            console.error('❌ [handleUpgrade] Verification failed:', verifyResult.error);
            alert(verifyResult.error || 'Failed to verify purchase');
          }
        } else if (result.cancelled) {
          // 用户取消，不显示错误
          console.log('🔵 [handleUpgrade] Purchase cancelled by user');
        } else if (result.error) {
          alert(result.error);
        }
      } catch (error) {
        console.error('❌ [handleUpgrade] Google Play error:', error);
        alert(error instanceof Error ? error.message : 'Purchase failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Web 平台使用 Stripe
    setIsLoading(true);

    try {
      const successUrl = process.env.NEXT_PUBLIC_PAYMENT_SUCCESS_URL || `${window.location.origin}/studio/payment/success`;
      const cancelUrl = process.env.NEXT_PUBLIC_PAYMENT_CANCEL_URL || `${window.location.origin}/studio/payment/cancel`;
      const currency = priceInfo?.currency?.toLowerCase() || 'usd';

      const requestData = {
        product_id: currentProductId,
        currency: currency,
        success_url: successUrl,
        cancel_url: cancelUrl,
      };

      const data = await createStripeCheckout(requestData);

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response from payment provider');
      }

      if (data.checkout_url) {
        // 移动端或 App：直接跳转（系统浏览器打开）
        // 桌面 Web：新窗口打开
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobile) {
          window.location.href = data.checkout_url;
        } else {
          const newWindow = window.open(data.checkout_url, '_blank');
          if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            window.location.href = data.checkout_url;
          } else {
            setIsLoading(false);
          }
        }
      } else {
        throw new Error('Checkout URL not returned');
      }
    } catch (error) {
      console.error('❌ [handleUpgrade] Error:', error);
      alert(error instanceof Error ? error.message : 'Failed to start checkout process. Please try again.');
      setIsLoading(false);
    }
  };

  const couponLabel = getCouponLabel();

  return (
    <>
      <LoginPrompt
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
      />

      <div className={`relative rounded-2xl p-6 flex flex-col transition-colors ${
        plan.is_popular
          ? 'border-2 border-transparent bg-gradient-to-b from-purple-100 to-white shadow-lg'
          : 'border-2 border-gray-200 bg-white hover:border-purple-200'
      }`}
        style={plan.is_popular ? {
          background: 'linear-gradient(white, white) padding-box, linear-gradient(to bottom, #a855f7, #e9d5ff) border-box',
        } : undefined}
      >
        {/* Most Popular 标签 - 斜角效果 */}
        {plan.is_popular && (
          <div className="absolute -top-2 -right-2 rotate-12">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md">
              {t('pricing.mostPopular')}
            </div>
          </div>
        )}

        {/* 折扣标签 */}
        {couponLabel && (
          <div className="absolute -top-3 left-4">
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm2.5 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6.207.293a1 1 0 00-1.414 0l-6 6a1 1 0 101.414 1.414l6-6a1 1 0 000-1.414zM12.5 10a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" clipRule="evenodd" />
              </svg>
              {couponLabel}
            </div>
          </div>
        )}

        {/* Plan Name */}
        <div className="mb-3 mt-2">
          <h3 className="text-xl font-bold text-gray-900">{getPlanName()}</h3>
        </div>

        {/* Price Section - 新布局 */}
        <div className="mb-6">
          {priceInfo ? (
            <>
              {/* 主价格行：大价格在左，划线价在右 */}
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  {getCurrencySymbol(priceInfo.currency)}{priceInfo.display}
                </span>
                <span className="text-lg text-gray-600">
                  /{getBillingPeriodText()}
                </span>
                {priceInfo.originalPrice && priceInfo.discountedPrice && priceInfo.originalPrice !== priceInfo.discountedPrice && (
                  <span className="text-base text-gray-400 line-through ml-1">
                    {getCurrencySymbol(priceInfo.currency)}{priceInfo.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="text-gray-500">Price not available</div>
          )}
        </div>

        {/* 积分滑块 - 仅多档位时显示 */}
        {hasMultipleTiers && (
          <div className="mb-6">
            <CreditsSlider
              tiers={plan.credit_tiers!}
              selectedIndex={selectedTierIndex}
              onChange={setSelectedTierIndex}
            />
          </div>
        )}

        {/* 功能列表 - 从当前档位获取 */}
        {currentTier?.features && currentTier.features.length > 0 && (
          <div className="mb-4 space-y-2">
            {currentTier.features.map((feature, index) => {
              const text = feature[locale as keyof typeof feature] || feature.en || feature['zh-CN'] || '';
              // 使用正则匹配数字（包括逗号分隔的数字）
              const parts = text.split(/(\d[\d,]*)/g);

              return (
                <div key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-purple-600 mt-0.5">•</span>
                  <span>
                    {parts.map((part: string, i: number) =>
                      /\d/.test(part) ? (
                        <span key={i} className="text-blue-600 font-semibold">{part}</span>
                      ) : (
                        <span key={i}>{part}</span>
                      )
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA Button */}
        <button
          onClick={handleUpgrade}
          disabled={!currentProductId || isProcessing}
          className="w-full rounded-xl font-semibold py-3 mb-4 transition-colors bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
        >
          {isProcessing ? (
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

      </div>
    </>
  );
}