'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudio } from '@/contexts/StudioContext';
import Link from 'next/link';

export default function StudioHomePage() {
  const { t } = useLanguage();
  const { setTitle } = useStudio();

  // Set page title
  useEffect(() => {
    setTitle(t('studio.menu.home'));
  }, [t, setTitle]);

  return (
    <div className="bg-gradient-to-b from-white to-purple-50 min-h-screen">
      <section className="pb-12">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to Studio
            </h2>
            <p className="text-lg text-gray-600">
              Choose a tool to start creating amazing content
            </p>
          </div>

          {/* Quick Access Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              href="/studio/tts"
              className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t('studio.menu.textToSpeech')}
              </h3>
              <p className="text-gray-600">
                Convert text to natural-sounding speech
              </p>
            </Link>

            {/* Add more cards for other features */}
          </div>
        </div>
      </section>
    </div>
  );
}
