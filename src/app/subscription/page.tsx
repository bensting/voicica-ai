'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function SubscriptionPage() {
  const { t } = useLanguage();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('subscription.title')}
          </h1>
          <div className="mt-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              {t('subscription.changePlan')}
            </h2>
            <p className="text-gray-600">
              {t('subscription.selectPlan')}
            </p>
          </div>
        </div>

        {/* Billing Period Toggle */}
        <div className="flex justify-end items-center mb-8">
          <div className="relative inline-flex items-center bg-gray-200 rounded-full p-1">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'bg-transparent text-gray-700'
              }`}
            >
              {t('subscription.monthly')}
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-full font-medium transition-all relative ${
                billingPeriod === 'yearly'
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'bg-transparent text-gray-700'
              }`}
            >
              {t('subscription.yearly')}
              {billingPeriod !== 'yearly' && (
                <span className="absolute -top-8 -right-2 bg-gradient-to-r from-purple-400 to-pink-400 text-white text-xs px-3 py-1 rounded-full font-semibold">
                  ✨ {t('subscription.yearlyDiscount')}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl">
          {/* Free Plan */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-gray-900 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-gray-900"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {t('subscription.free.name')}
                </h3>
              </div>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                {t('subscription.free.badge')}
              </span>
            </div>

            <div className="space-y-4 mb-6">
              {[
                t('subscription.free.feature1'),
                t('subscription.free.feature2'),
                t('subscription.free.feature3'),
              ].map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pro Plan */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-gray-300 p-8 relative shadow-lg">
            <div className="absolute -top-4 right-8">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 shadow-lg">
                <span>{t('subscription.pro.badge')}</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {t('subscription.pro.name')}
              </h3>
              <p className="text-gray-600 text-sm">
                {t('subscription.pro.tagline')}
              </p>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold text-gray-900">
                  {billingPeriod === 'monthly'
                    ? t('subscription.pro.priceMonthly')
                    : t('subscription.pro.priceYearly')}
                </span>
                <span className="text-gray-600">
                  {t('subscription.pro.perMonth')}
                </span>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              {[
                t('subscription.pro.feature1'),
                t('subscription.pro.feature2'),
                t('subscription.pro.feature3'),
                t('subscription.pro.feature4'),
                t('subscription.pro.feature5'),
              ].map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            <button className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 group">
              <span>{t('subscription.pro.upgradeNow')}</span>
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
