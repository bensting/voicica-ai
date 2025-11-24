'use client';

import { Lightbulb } from 'lucide-react';
import PlansGrid from './components/PlansGrid';
import PlanCardSkeleton from './components/PlanCardSkeleton';
import { PricingPlan } from '@/types/subscription';
import { BillingCycle } from './hooks/usePricing';
import { useLanguage } from '@/contexts/LanguageContext';

interface PricingPlansProps {
  plans: PricingPlan[];
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
  const { t } = useLanguage();

  // Loading state - 显示骨架屏
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <PlanCardSkeleton />
        <PlanCardSkeleton />
        <PlanCardSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-20">
        <div className="text-red-600 mb-4">{t('pricing.error')}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
        >
          {t('pricing.retry')}
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Plans Grid */}
      <PlansGrid plans={plans} cycle={cycle} onCycleChange={onCycleChange} />

      {/* Notes */}
      <div className="mt-8 py-4 bg-gray-100 rounded-lg">
        <p className="text-center text-gray-600 text-sm flex items-center justify-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span>
            <strong>{t('pricing.notes')}</strong> {t('pricing.creditsNote')}
          </span>
        </p>
      </div>
    </div>
  );
}