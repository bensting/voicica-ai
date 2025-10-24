 'use client';

import { PricingPlans, usePricing } from '@/components/features/pricing';

/**
 * Pricing Page
 *
 * Displays subscription plans and pricing options
 */
export default function PricingPage() {
  // Use custom hook for all business logic
  const { cycle, plans, loading, error, onCycleChange } = usePricing();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gray-100 border-b border-gray-200 pt-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Pick Your Plan of Text to Speech
          </h1>
        </div>
      </div>

      {/* Pricing Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
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