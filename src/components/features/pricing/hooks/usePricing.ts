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
          const plansWithPrices = await Promise.all(
            data.map(async (plan: SubscriptionPlanWithPrice) => {
              try {
                const prices = await subscriptionAPI.getStripePrices(plan.product_id);
                console.log(`Prices for ${plan.product_id}:`, prices);

                // 找到匹配当前周期的价格
                const activePrice = prices.find(p => p.active);
                if (activePrice) {
                  return {
                    ...plan,
                    price: activePrice.unit_amount,
                    currency: activePrice.currency,
                    billing_type: activePrice.billing_type,
                    billing_period: activePrice.billing_period === 'month' ? 'every-month' : 'every-year',
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