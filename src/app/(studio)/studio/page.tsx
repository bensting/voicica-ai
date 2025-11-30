'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import ProductCard from '@/components/features/studio/ProductCard';

export default function StudioPage() {
  const { t } = useLanguage();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Welcome Banner */}
      <div className="mb-8 bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 rounded-xl p-8 text-white relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>

        <div className="relative z-10 text-center">
          <h3 className="text-3xl font-bold mb-3 flex items-center justify-center gap-2">
            <span>👋</span>
            <span>{t('studio.welcomeTitle')}</span>
          </h3>
          <p className="text-purple-100 text-lg max-w-2xl mx-auto">
            {t('studio.welcomeSubtitle')}
          </p>
        </div>
      </div>

      {/* Featured Products Section */}
      <div>
        {/* Section Title */}
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          {t('studio.featuredProducts')}
        </h2>

        {/* Product Cards - 3 columns on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Text to Speech */}
          <ProductCard
            title={t('studio.menu.textToSpeech')}
            description={t('studio.ttsDescription')}
            href="/studio/tts"
            image="/images/products/tts-preview.png"
          />

          {/* Placeholder cards for future features */}
          <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-center min-h-[280px]">
            <svg className="w-10 h-10 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <p className="text-sm text-gray-500 font-medium">{t('studio.moreToolsComing')}</p>
          </div>

          <div className="hidden lg:flex bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 flex-col items-center justify-center text-center min-h-[280px]">
            <svg className="w-10 h-10 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <p className="text-sm text-gray-500 font-medium">{t('studio.moreToolsComing')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}