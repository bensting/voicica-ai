'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSubscriptionPlans } from '@/actions/subscription';
import { PricingPlan } from '@/types/subscription';
import { useLanguage } from '@/contexts/LanguageContext';

export type BillingCycle = 'monthly' | 'yearly';

/**
 * Custom hook for managing pricing plans data and state
 */
export function usePricing() {
  const { locale, isReady } = useLanguage();
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch subscription plans from API
  useEffect(() => {
    // 等待 LanguageContext 初始化完成
    if (!isReady) {
      return;
    }
    const fetchPlans = async () => {
      try {
        setLoading(true);
        setError(null);

        // 使用 Stripe 作为支付平台
        const paymentProvider = 'stripe';
        console.log(`Fetching plans for payment provider: ${paymentProvider}`);

        // 使用 product_type 参数直接获取 text_to_speech 类型的计划
        // Server Action 会返回包含所有必要信息（包括价格）的完整计划数据
        const data = await getSubscriptionPlans({
          platform: paymentProvider,
          product_type: 'text_to_speech',
          active_only: true
        }) as unknown as PricingPlan[];

        console.log('Fetched text_to_speech plans:', data);

        // 直接使用后端返回的完整数据，无需额外查询价格信息
        setPlans(data);
      } catch (err) {
        console.error('Failed to fetch subscription plans:', err);
        setError('Failed to load pricing plans. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [locale, isReady]);

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