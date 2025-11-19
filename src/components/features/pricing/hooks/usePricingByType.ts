'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSubscriptionPlans } from '@/actions/subscription';
import { PricingPlan } from '@/types/subscription';
import { useLanguage } from '@/contexts/LanguageContext';

export type BillingCycle = 'monthly' | 'yearly';
export type ProductType = 'text_to_speech' | 'voice_cloning';

interface UsePricingByTypeOptions {
  productType: ProductType;
}

/**
 * Custom hook for managing pricing plans data and state by product type
 * Supports both text_to_speech and voice_clone subscription types
 */
export function usePricingByType({ productType }: UsePricingByTypeOptions) {
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
        console.log(`Fetching plans for payment provider: ${paymentProvider}, product type: ${productType}`);

        // 使用 product_type 参数获取对应类型的计划
        const data = await getSubscriptionPlans({
          platform: paymentProvider,
          product_type: productType,
          active_only: true
        }) as unknown as PricingPlan[];

        console.log(`Fetched ${productType} plans:`, data);

        // 直接使用后端返回的完整数据
        setPlans(data);
      } catch (err) {
        console.error('Failed to fetch subscription plans:', err);
        setError('Failed to load pricing plans. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [locale, isReady, productType]);

  // Return all plans sorted by sort_order, excluding Free plan
  const currentPlans = useMemo(() => {
    if (!plans || plans.length === 0) return [];

    console.log('All plans:', plans);

    // Filter out Free plan and sort by sort_order
    return [...plans]
      .filter((plan) => plan.plan_name !== 'Free')
      .sort((a, b) => a.sort_order - b.sort_order);
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