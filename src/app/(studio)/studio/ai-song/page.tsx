'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudio } from '@/contexts/StudioContext';
import { Music } from 'lucide-react';

/**
 * AI Song Page (Placeholder)
 *
 * AI音乐创作功能页面（占位）
 */
export default function AiSongPage() {
  const { t } = useLanguage();
  const { setTitle } = useStudio();

  useEffect(() => {
    setTitle(t('studio.menu.aiSong'));
  }, [t, setTitle]);

  return (
    <div className="flex items-center justify-center h-[calc(100vh-60px)] bg-gradient-to-b from-purple-50 to-white">
      <div className="text-center px-4">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full mb-6">
          <Music className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          {t('studio.menu.aiSong')}
        </h1>
        <p className="text-gray-600 text-lg mb-2">Coming Soon</p>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          AI音乐创作功能正在开发中，敬请期待...
        </p>
      </div>
    </div>
  );
}