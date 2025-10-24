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
        const data = await subscriptionAPI.getPlans({
          platform: 'creem',
          active_only: true
        });
        console.log('Fetched plans:', data);
        setPlans(data as SubscriptionPlanWithPrice[]);
      } catch (err) {
        console.error('Failed to fetch subscription plans:', err);
        setError('Failed to load pricing plans. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  // Filter plans by billing cycle
  const currentPlans = useMemo(() => {
    if (!plans || plans.length === 0) return [];

    console.log('All plans:', plans);
    console.log('Current cycle:', cycle);

    const filtered = plans.filter(p => {
      if (cycle === 'monthly') {
        return p.billing_period === 'every-month' || p.cycle_days === 30;
      } else {
        return p.billing_period === 'every-year' || p.cycle_days === 365;
      }
    });

    console.log('Filtered plans:', filtered);

    // Sort by sort_order
    return filtered.sort((a, b) => a.sort_order - b.sort_order);
  }, [plans, cycle]);

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