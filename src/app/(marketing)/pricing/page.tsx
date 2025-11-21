'use client';

import { useState } from 'react';
import { PricingPlans, usePricingByType } from '@/components/features/pricing';
import { useLanguage } from '@/contexts/LanguageContext';
import ProductTypeTabs, { type ProductType } from '@/components/features/pricing/components/ProductTypeTabs';
import { getEnabledProductTypeTabs } from '@/config/subscription';

/**
 * Pricing Page
 *
 * Displays subscription plans and pricing options
 * Supports product type switching (text_to_speech / voice_cloning)
 */
export default function PricingPage() {
  const { t } = useLanguage();

  // 获取启用的产品类型，默认选择第一个
  const enabledTabs = getEnabledProductTypeTabs();
  const defaultProductType = enabledTabs.length > 0 ? enabledTabs[0].type : 'text_to_speech';

  const [productType, setProductType] = useState<ProductType>(defaultProductType);

  // Use custom hook for all business logic
  // includeFreePlan: true 因为 pricing 页面需要显示 Free 计划
  const { cycle, plans, loading, error, onCycleChange } = usePricingByType({
    productType,
    includeFreePlan: true,
  });

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
        {/* Product Type Tabs */}
        <ProductTypeTabs
          activeType={productType}
          onChange={setProductType}
        />

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