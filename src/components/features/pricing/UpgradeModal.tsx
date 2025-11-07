'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { PricingPlans } from '@/components/features/pricing';
import { usePricingByType, ProductType } from '@/components/features/pricing/hooks/usePricingByType';
import ProductTypeTabs from '@/components/features/pricing/components/ProductTypeTabs';
import { useLanguage } from '@/contexts/LanguageContext';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Upgrade Modal Component
 *
 * Desktop: Modal overlay with pricing plans
 * Mobile: Full screen view with pricing plans
 */
export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const { t } = useLanguage();
  const [productType, setProductType] = useState<ProductType>('text_to_speech');

  // Use custom hook for all business logic
  const { cycle, plans, loading, error, onCycleChange } = usePricingByType({ productType });

  const handleProductTypeChange = (type: ProductType) => {
    setProductType(type);
  };

  // Get page title based on product type
  const getPageTitle = () => {
    if (productType === 'text_to_speech') {
      return t('upgrade.title.textToVoice');
    }
    return t('upgrade.title.voiceClone');
  };

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop - 桌面端半透明，移动端全黑 */}
      <div
        className="absolute inset-0 bg-black/50 lg:bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content - 移动端全屏，桌面端弹窗 */}
      <div className="relative w-full h-full lg:h-auto lg:max-h-[90vh] lg:w-[90vw] lg:max-w-7xl bg-white lg:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-4 lg:px-6 lg:py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
                {t('upgrade.header.title')}
              </h2>
              <p className="text-sm lg:text-base text-gray-600 mt-1">
                {t('upgrade.header.description')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-6 lg:py-8">
          {/* Product Type Tabs */}
          <div className="mb-6">
            <ProductTypeTabs activeType={productType} onChange={handleProductTypeChange} />
          </div>

          {/* Section Title */}
          <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-6 text-center">
            {getPageTitle()}
          </h3>

          {/* Pricing Plans */}
          <PricingPlans
            plans={plans}
            cycle={cycle}
            loading={loading}
            error={error}
            onCycleChange={onCycleChange}
          />
        </div>
      </div>
    </div>
  );
}