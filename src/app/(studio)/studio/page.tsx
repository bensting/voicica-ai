'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import ProductCard from '@/components/features/studio/ProductCard';
import ToolCard from '@/components/features/studio/ToolCard';

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

      {/* You might want to try Section */}
      <div className="mt-10">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          {t('studio.youMightWantToTry')}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* TikTok Downloader */}
          <ToolCard
            title={t('studio.menu.tiktokDownloader')}
            description={t('studio.tiktokDownloaderDesc')}
            href="/tools/tiktok-downloader"
            icon={
              <svg
                className="w-6 h-6 text-pink-600"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
              </svg>
            }
            iconBgColor="bg-pink-100"
          />

          {/* YouTube Downloader */}
          <ToolCard
            title={t('studio.menu.youtubeDownloader')}
            description={t('studio.youtubeDownloaderDesc')}
            href="/tools/youtube-downloader"
            icon={
              <svg
                className="w-6 h-6 text-red-600"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            }
            iconBgColor="bg-red-100"
          />
        </div>
      </div>
    </div>
  );
}