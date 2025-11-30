'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import ProductCard from './ProductCard';

/**
 * 明星产品区域
 */
export default function FeaturedProductsSection() {
  const { t } = useLanguage();

  return (
    <div>
      {/* Section Title */}
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        {t('studio.featuredProducts')}
      </h2>

      {/* Product Cards - 横向布局，桌面端3列 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Text to Speech */}
        <ProductCard
          title={t('studio.menu.textToSpeech')}
          description={t('studio.ttsDescription')}
          href="/studio/tts"
          image="/images/products/tts-preview.webp"
        />

        {/* Placeholder cards for future features */}
        <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center text-center min-h-[140px] px-6">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <p className="text-sm text-gray-500 font-medium">{t('studio.moreToolsComing')}</p>
          </div>
        </div>

        <div className="hidden lg:flex bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 items-center justify-center text-center min-h-[140px] px-6">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <p className="text-sm text-gray-500 font-medium">{t('studio.moreToolsComing')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}