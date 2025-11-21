'use client';

import { PricingPlan } from '@/types/subscription';
import PricingCard from './PricingCard';
import { BillingCycle } from '../hooks/usePricing';

interface PlansGridProps {
  plans: PricingPlan[];
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

  // 根据套餐数量动态设置列数
  const getGridCols = () => {
    const count = plans.length;
    if (count === 1) return 'lg:grid-cols-1';
    if (count === 2) return 'lg:grid-cols-2';
    if (count === 3) return 'lg:grid-cols-3';
    return 'lg:grid-cols-4';
  };

  // Debug: 打印计划数据，检查 is_popular 字段
  console.log('Plans data:', plans.map(p => ({ name: p.plan_name, is_popular: p.is_popular })));

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 ${getGridCols()} gap-6 max-w-7xl mx-auto`}>
      {plans.map((plan, index) => (
        <PricingCard
          key={plan.id || index}
          plan={plan}
          cycle={cycle}
          isRecommended={plan.is_popular === true}
        />
      ))}
    </div>
  );
}