'use client';

import { useLanguage } from '@/contexts/LanguageContext';

/**
 * 欢迎横幅组件
 */
export default function WelcomeBanner() {
  const { t } = useLanguage();

  return (
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
  );
}