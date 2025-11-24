'use client';

import { PricingPlans, usePricingByType } from '@/components/features/pricing';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Pricing Page
 *
 * Displays subscription plans and pricing options
 * 统一订阅方案，不区分产品类型
 */
export default function PricingPage() {
  const { t } = useLanguage();

  // Use custom hook for all business logic
  const { cycle, plans, loading, error, onCycleChange } = usePricingByType();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 pt-20">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t('pricing.pageTitle')}
          </h1>
          <p className="text-lg md:text-xl text-gray-600">
            {t('pricing.pageSubtitle')}
          </p>
        </div>
      </div>

      {/* Pricing Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <PricingPlans
          plans={plans}
          cycle={cycle}
          loading={loading}
          error={error}
          onCycleChange={onCycleChange}
        />
      </div>
    </div>
  );
}