'use client';

import { useRef, useCallback, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import MobileSpeechCard from './MobileSpeechCard';
import MobileSpeechCardSkeleton from './MobileSpeechCardSkeleton';
import type { Generation } from '@/types/tts';

interface MobileViewProps {
  generations: Generation[];
  total: number;
  currentPage: number;
  totalPages: number;
  loading?: boolean;
  onDeleteGeneration: (id: string) => void;
  onDownloadGeneration: (id: string) => void;
  onPageChange: (page: number) => void;
}

/**
 * Mobile View for Generation History with Infinite Scroll
 */
export default function MobileView({
  generations,
  total,
  currentPage,
  totalPages,
  loading = false,
  onDeleteGeneration,
  onDownloadGeneration,
  onPageChange,
}: MobileViewProps) {
  const { t } = useLanguage();
  const observerTarget = useRef<HTMLDivElement>(null);

  // Infinite scroll observer
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [target] = entries;
    if (target.isIntersecting && !loading && currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  }, [loading, currentPage, totalPages, onPageChange]);

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const option = {
      root: null,
      rootMargin: '100px',
      threshold: 0
    };

    const observer = new IntersectionObserver(handleObserver, option);
    observer.observe(element);

    return () => observer.disconnect();
  }, [handleObserver]);

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header Area */}
      <div className="flex-none bg-gray-50">
        {/* Title Bar */}
        <div className="mx-4 mt-3 mb-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3">
            <div className="flex items-center gap-2.5">
              {/* Microphone Icon */}
              <div className="w-5 h-5 flex items-center justify-center text-purple-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              {/* Title */}
              <h2 className="text-sm font-medium text-gray-700 whitespace-nowrap">
                {t('generationHistory.generatedSpeech')}
              </h2>
              {/* Count */}
              <span className="text-sm font-semibold text-gray-500">
                ({total})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-4 space-y-3" style={{ paddingBottom: 'calc(80px + var(--safe-area-inset-bottom, 0px))' }}>
          {/* Initial Loading State - Show Skeletons */}
          {loading && generations.length === 0 && (
            <>
              {[1, 2, 3, 4, 5].map((i) => (
                <MobileSpeechCardSkeleton key={i} />
              ))}
            </>
          )}

          {/* Empty State */}
          {generations.length === 0 && !loading && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('generationHistory.noGenerations')}
              </h3>
              <p className="text-gray-500">{t('generationHistory.noGenerationsDescription')}</p>
            </div>
          )}

          {/* Speech Cards */}
          {generations.map((generation) => (
            <MobileSpeechCard
              key={generation.id}
              generation={generation}
              onDelete={() => onDeleteGeneration(generation.id)}
              onDownload={() => onDownloadGeneration(generation.id)}
            />
          ))}

          {/* Loading More Indicator (for infinite scroll) */}
          {loading && generations.length > 0 && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          )}

          {/* All Records Loaded Message */}
          {!loading && generations.length > 0 && currentPage >= totalPages && (
            <div className="flex justify-center py-6">
              <div className="text-sm text-gray-500">
                {t('generationHistory.allRecordsLoaded')} ({total} {t('generationHistory.total')})
              </div>
            </div>
          )}

          {/* Infinite Scroll Trigger */}
          <div ref={observerTarget} className="h-4" />
        </div>
      </div>
    </div>
  );
}