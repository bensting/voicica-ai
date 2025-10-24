'use client';

import { useEffect, useMemo, useState } from 'react';
import { subscriptionAPI } from '@/lib/api';
import { SubscriptionPlanWithPrice } from '@/types/subscription';

export type BillingCycle = 'monthly' | 'yearly';

/**
 * Custom hook for managing pricing plans data and state
 */
export function usePricing() {
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [plans, setPlans] = useState<SubscriptionPlanWithPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch subscription plans from API
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        setError(null);

        // 获取配置的支付平台
        const paymentProvider = (process.env.NEXT_PUBLIC_PAYMENT_PROVIDER || 'creem') as 'creem' | 'stripe';
        console.log(`Fetching plans for payment provider: ${paymentProvider}`);

        const data = await subscriptionAPI.getPlans({
          platform: paymentProvider,
          active_only: true
        }) as SubscriptionPlanWithPrice[];
        console.log('Fetched plans:', data);

        // 如果是 Stripe，需要额外查询价格信息
        if (paymentProvider === 'stripe') {
          // 检测用户所在地区的货币偏好
          const getUserCurrency = (): string => {
            try {
              // 尝试从浏览器获取用户的地区和货币偏好
              const userLocale = navigator.language || 'en-US';
              const regionCurrencyMap: Record<string, string> = {
                'zh-CN': 'CNY',
                'zh-TW': 'CNY',
                'zh-HK': 'CNY',
                'en-US': 'USD',
                'en-GB': 'GBP',
                'de': 'EUR',
                'fr': 'EUR',
                'es': 'EUR',
                'it': 'EUR',
              };

              // 检查完整匹配
              if (regionCurrencyMap[userLocale]) {
                return regionCurrencyMap[userLocale];
              }

              // 检查语言前缀匹配
              const languagePrefix = userLocale.split('-')[0];
              for (const [locale, currency] of Object.entries(regionCurrencyMap)) {
                if (locale.startsWith(languagePrefix)) {
                  return currency;
                }
              }

              // 默认使用 USD
              return 'USD';
            } catch (err) {
              console.warn('Failed to detect user currency, defaulting to USD:', err);
              return 'USD';
            }
          };

          const preferredCurrency = getUserCurrency();
          console.log('Preferred currency:', preferredCurrency);

          const plansWithPrices = await Promise.all(
            data.map(async (plan: SubscriptionPlanWithPrice) => {
              try {
                const prices = await subscriptionAPI.getStripePrices(plan.product_id);
                console.log(`Prices for ${plan.product_id}:`, prices);

                // 先尝试找到匹配用户偏好货币的激活价格（后端返回的是大写）
                let selectedPrice = prices.find(
                  p => p.active && p.currency === preferredCurrency
                );

                // 如果没有找到匹配的货币，使用第一个激活的价格
                if (!selectedPrice) {
                  selectedPrice = prices.find(p => p.active);
                }

                if (selectedPrice) {
                  return {
                    ...plan,
                    price: selectedPrice.unit_amount,
                    currency: selectedPrice.currency,
                    billing_type: selectedPrice.billing_type,
                    billing_period: selectedPrice.billing_period === 'month' ? 'every-month' : 'every-year',
                  } as SubscriptionPlanWithPrice;
                }
                return plan as SubscriptionPlanWithPrice;
              } catch (err) {
                console.error(`Failed to fetch prices for ${plan.product_id}:`, err);
                return plan as SubscriptionPlanWithPrice;
              }
            })
          );
          setPlans(plansWithPrices);
        } else {
          setPlans(data as SubscriptionPlanWithPrice[]);
        }
      } catch (err) {
        console.error('Failed to fetch subscription plans:', err);
        setError('Failed to load pricing plans. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  // Return all plans sorted by sort_order (不按周期过滤)
  const currentPlans = useMemo(() => {
    if (!plans || plans.length === 0) return [];

    console.log('All plans:', plans);

    // Sort by sort_order
    return [...plans].sort((a, b) => a.sort_order - b.sort_order);
  }, [plans]);

  const handleCycleChange = (newCycle: BillingCycle) => {
    setCycle(newCycle);
  };

  return {
    cycle,
    plans: currentPlans,
    loading,
    error,
    onCycleChange: handleCycleChange,
  };
}