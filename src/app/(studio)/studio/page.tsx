'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';

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

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        <Link
          href="/studio/tts"
          className="group p-6 bg-gradient-to-br from-purple-50 to-white rounded-xl border-2 border-gray-200 hover:border-purple-300 hover:shadow-md transition-all"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
                {t('studio.menu.textToSpeech') || 'Text to Speech'}
              </h4>
              <p className="text-sm text-gray-600">
                {t('studio.ttsDescription')}
              </p>
            </div>
          </div>
        </Link>

        {/* Placeholder for future features */}
        <div className="p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-center min-h-[120px]">
          <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <p className="text-sm text-gray-500 font-medium">{t('studio.moreToolsComing')}</p>
        </div>
      </div>
    </div>
  );
}