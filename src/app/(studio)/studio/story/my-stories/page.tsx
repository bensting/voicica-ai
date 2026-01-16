'use client';

import { useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudio } from '@/contexts/StudioContext';

/**
 * My Stories Page
 *
 * 显示用户生成的故事列表
 */
export default function MyStoriesPage() {
  const { t } = useLanguage();
  const { setTitle } = useStudio();

  // 设置页面标题
  useEffect(() => {
    setTitle(t('story.myStoriesTitle') || 'My Stories');
  }, [t, setTitle]);

  return (
    <>
      {/* Mobile Layout */}
      <div className="lg:hidden fixed inset-0 flex flex-col bg-gradient-to-b from-gray-50 to-white" style={{ top: 'calc(60px + var(--safe-area-inset-top, 0px))' }}>
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-20">
          {/* Empty State */}
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-purple-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {t('story.noStories') || 'No stories yet'}
            </h2>
            <p className="text-gray-500 text-sm">
              {t('story.noStoriesDesc') || 'Your generated stories will appear here'}
            </p>
          </div>
        </div>

        {/* 底部导航栏占位空间 */}
        <div className="h-[64px] flex-shrink-0" style={{ height: 'calc(64px + var(--safe-area-inset-bottom, 0px))' }} />
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex flex-col bg-gradient-to-b from-white to-purple-50 lg:h-[calc(100vh-60px)] overflow-hidden">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('story.myStoriesTitle') || 'My Stories'}
            </h1>
            <p className="text-gray-500">
              {t('story.myStoriesSubtitle') || 'View and manage your generated stories'}
            </p>
          </div>

          {/* Stories List / Empty State */}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-purple-100 rounded-full flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-purple-500" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                {t('story.noStories') || 'No stories yet'}
              </h2>
              <p className="text-gray-500">
                {t('story.noStoriesDesc') || 'Your generated stories will appear here'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
