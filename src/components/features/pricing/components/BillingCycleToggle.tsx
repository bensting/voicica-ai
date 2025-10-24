'use client';

import { BillingCycle } from '../hooks/usePricing';

interface BillingCycleToggleProps {
  cycle: BillingCycle;
  onCycleChange: (cycle: BillingCycle) => void;
}

/**
 * Billing cycle toggle component
 * Allows users to switch between monthly and yearly billing
 */
export default function BillingCycleToggle({ cycle, onCycleChange }: BillingCycleToggleProps) {
  return (
    <div className="flex items-center justify-center mb-10">
      <div className="relative flex items-center rounded-full bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => onCycleChange('monthly')}
          className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${
            cycle === 'monthly' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => onCycleChange('yearly')}
          className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${
            cycle === 'yearly' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Yearly
        </button>

        {/* 33% OFF Badge - Only show for yearly */}
        {cycle === 'yearly' && (
          <span className="absolute -top-3 right-1 select-none">
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-600 text-white text-[10px] font-semibold px-2 py-1 shadow">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 3l3 7h7l-5.5 4.5L18 22l-6-4-6 4 1.5-7.5L2 10h7l3-7z" />
              </svg>
              33% OFF
            </span>
          </span>
        )}
      </div>
    </div>
  );
}