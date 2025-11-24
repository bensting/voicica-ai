'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSubscriptionPlans } from '@/actions/subscription';
import { PricingPlan } from '@/types/subscription';
import { useLanguage } from '@/contexts/LanguageContext';

export type BillingCycle = 'weekly' | 'monthly' | 'yearly';

/**
 * Custom hook for managing pricing plans data and state
 * 统一订阅方案，不区分产品类型
 */
export function usePricing() {
  const { locale, isReady } = useLanguage();
  const [cycle, setCycle] = useState<BillingCycle>('weekly');
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch subscription plans from config
  useEffect(() => {
    // 等待 LanguageContext 初始化完成
    if (!isReady) {
      return;
    }
    const fetchPlans = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Fetching subscription plans...');

        // 获取所有活跃计划
        const data = await getSubscriptionPlans({
          platform: 'stripe',
          active_only: true
        }) as unknown as PricingPlan[];

        console.log('Fetched plans:', data);

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

  // Return all plans sorted by sort_order
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