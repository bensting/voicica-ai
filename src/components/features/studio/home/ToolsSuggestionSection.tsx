'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import ToolCard from './ToolCard';

/**
 * 工具推荐区域 - "You might want to try"
 */
export default function ToolsSuggestionSection() {
  const { t } = useLanguage();

  return (
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
  );
}