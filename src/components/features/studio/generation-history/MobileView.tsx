'use client';

import { useRef, useCallback, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import FiltersSection from './components/FiltersSection';
import MobileSpeechCard from './MobileSpeechCard';
import MobileSpeechCardSkeleton from './MobileSpeechCardSkeleton';
import { TaskStatus } from '@/types/tts';
import type { Generation } from '@/types/tts';

interface MobileViewProps {
  generations: Generation[];
  total: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  loading?: boolean;
  selectedStatus: TaskStatus | null;
  startDate: string | null;
  endDate: string | null;
  onClearAll: () => void;
  onDeleteGeneration: (id: string) => void;
  onDownloadGeneration: (id: string) => void;
  onPageChange: (page: number) => void;
  onStatusChange: (status: TaskStatus | null) => void;
  onDateRangeChange: (startDate: string | null, endDate: string | null) => void;
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
  selectedStatus,
  startDate,
  endDate,
  onClearAll,
  onDeleteGeneration,
  onDownloadGeneration,
  onPageChange,
  onStatusChange,
  onDateRangeChange
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
        {/* Filters Section */}
        <div className="px-4 py-3">
          <FiltersSection
            selectedStatus={selectedStatus}
            startDate={startDate}
            endDate={endDate}
            onStatusChange={onStatusChange}
            onDateRangeChange={onDateRangeChange}
            statusLabel={t('generationHistory.filters.status') || 'Status'}
            dateRangeLabel={t('generationHistory.filters.dateRange') || 'Date'}
          />
        </div>

        {/* Title Bar */}
        <div className="mx-4 mb-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-gray-900 whitespace-nowrap">
                {t('generationHistory.generatedSpeech')}
              </h2>
              <div className="flex items-center justify-center w-6 h-6 bg-purple-600 text-white text-xs font-medium rounded-full">
                {total}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-4 space-y-3 pb-20">
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

          {/* Infinite Scroll Trigger */}
          <div ref={observerTarget} className="h-4" />
        </div>
      </div>
    </div>
  );
}