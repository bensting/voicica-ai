'use client';

import BillingCycleToggle from './components/BillingCycleToggle';
import PlansGrid from './components/PlansGrid';
import { SubscriptionPlanWithPrice } from '@/types/subscription';
import { BillingCycle } from './hooks/usePricing';

interface PricingPlansProps {
  plans: SubscriptionPlanWithPrice[];
  cycle: BillingCycle;
  loading?: boolean;
  error?: string | null;
  onCycleChange: (cycle: BillingCycle) => void;
}

/**
 * Pricing Plans component
 *
 * Main component for displaying subscription pricing plans
 * Composed of:
 * - BillingCycleToggle: Monthly/Yearly toggle
 * - PlansGrid: Grid of pricing cards
 */
export default function PricingPlans({
  plans,
  cycle,
  loading = false,
  error = null,
  onCycleChange,
}: PricingPlansProps) {
  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-pulse text-gray-500">Loading pricing plans...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-20">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="text-purple-600 hover:text-purple-700 font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Plans Grid */}
      <PlansGrid plans={plans} cycle={cycle} onCycleChange={onCycleChange} />
    </div>
  );
}