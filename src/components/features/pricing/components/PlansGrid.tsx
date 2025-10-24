'use client';

import { SubscriptionPlanWithPrice } from '@/types/subscription';
import PricingCard from './PricingCard';
import { BillingCycle } from '../hooks/usePricing';

interface PlansGridProps {
  plans: SubscriptionPlanWithPrice[];
  cycle: BillingCycle;
  onCycleChange: (cycle: BillingCycle) => void;
}

/**
 * Plans grid component
 * Displays subscription plans in a grid layout
 */
export default function PlansGrid({ plans, cycle, onCycleChange }: PlansGridProps) {
  if (plans.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-gray-500 mb-4">
          No plans available for {cycle} billing
        </div>
        <button
          onClick={() => onCycleChange(cycle === 'monthly' ? 'yearly' : 'monthly')}
          className="text-purple-600 hover:text-purple-700 font-medium"
        >
          Try {cycle === 'monthly' ? 'yearly' : 'monthly'} plans
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {plans.map((plan, index) => (
        <PricingCard
          key={plan.id || index}
          plan={plan}
          cycle={cycle}
          isRecommended={plan.plan_name === 'Premium'}
        />
      ))}
    </div>
  );
}