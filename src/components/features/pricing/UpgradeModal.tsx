'use client';

import { useEffect } from 'react';
import { X, Crown } from 'lucide-react';
import { PricingPlans } from '@/components/features/pricing';
import { usePricingByType } from '@/components/features/pricing/hooks/usePricingByType';
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
 * 统一订阅方案，不区分产品类型
 */
export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const { t } = useLanguage();

  // Use custom hook for all business logic
  const { cycle, plans, loading, error, onCycleChange } = usePricingByType();

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
        {/* Header - 带渐变背景 */}
        <div className="flex-shrink-0 bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 px-4 pt-4 pb-5 lg:px-6 lg:py-8" style={{ paddingTop: 'calc(16px + var(--safe-area-inset-top, 0px))' }}>
          {/* 移动端：标题和关闭按钮在同一行 */}
          <div className="flex items-center justify-between lg:hidden mb-3">
            {/* 占位保持居中 */}
            <div className="w-10" />
            {/* 标题行 */}
            <div className="flex items-center gap-2">
              <Crown className="w-6 h-6 text-yellow-300" />
              <h2 className="text-xl font-bold text-white">
                {t('upgrade.header.title')}
              </h2>
            </div>
            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center hover:bg-white/20 rounded-xl transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* 移动端副标题 */}
          <p className="text-center text-sm text-white/90 lg:hidden">
            {t('upgrade.header.description')}
          </p>

          {/* 桌面端：保持原来的布局 */}
          <div className="hidden lg:block relative">
            {/* 关闭按钮 - 右上角 */}
            <button
              onClick={onClose}
              className="absolute -top-2 -right-2 p-2 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm"
              aria-label="Close modal"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* 居中内容 */}
            <div className="flex flex-col items-center text-center">
              {/* 标题行 - 皇冠在左边 */}
              <div className="flex items-center gap-3 mb-3">
                <Crown className="w-8 h-8 text-yellow-300" />
                <h2 className="text-4xl font-bold text-white">
                  {t('upgrade.header.title')}
                </h2>
              </div>

              <p className="text-lg text-white/90 max-w-2xl">
                {t('upgrade.header.description')}
              </p>
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-6 lg:py-8">
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