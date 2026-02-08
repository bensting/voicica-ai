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
        {/* Video Downloader */}
        <ToolCard
          title={t('studio.menu.videoDownloader')}
          description={t('studio.videoDownloaderDesc')}
          href="/native/tools/video-downloader"
          icon={
            <svg
              className="w-6 h-6 text-purple-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <polygon points="10,6 16,10 10,14" fill="currentColor" stroke="none" />
              <path d="M12 17v4m-3 0h6" strokeLinecap="round" />
            </svg>
          }
          iconBgColor="bg-purple-100"
        />
      </div>
    </div>
  );
}