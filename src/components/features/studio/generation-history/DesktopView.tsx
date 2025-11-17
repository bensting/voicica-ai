'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import PageHeader from './components/PageHeader';
import FiltersSection from './components/FiltersSection';
import MobileSpeechCard from './MobileSpeechCard';
import MobileSpeechCardSkeleton from './MobileSpeechCardSkeleton';
import Pagination from './Pagination';
import { TaskStatus } from '@/types/tts';
import type { Generation } from '@/types/tts';

interface DesktopViewProps {
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
 * Desktop View for Generation History
 * Fixed height layout with internal scrolling
 * Reuses MobileSpeechCard component for consistency
 */
export default function DesktopView({
  generations,
  total,
  currentPage,
  pageSize,
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
}: DesktopViewProps) {
  const { t } = useLanguage();

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 space-y-4 mb-4">
        {/* Page Header */}
        <PageHeader
          title={t('generationHistory.title')}
          subtitle={t('generationHistory.subtitle')}
        />

        {/* Filters Section */}
        <FiltersSection
          selectedStatus={selectedStatus}
          startDate={startDate}
          endDate={endDate}
          onStatusChange={onStatusChange}
          onDateRangeChange={onDateRangeChange}
          statusLabel={t('generationHistory.filters.status') || 'Filter by Status'}
          dateRangeLabel={t('generationHistory.filters.dateRange') || 'Filter by Date Range'}
        />

        {/* Title Bar - Fixed */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 p-4">
            {/* List Icon */}
            <div className="w-6 h-6 flex items-center justify-center text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </div>
            {/* Title */}
            <h2 className="text-lg font-medium text-gray-700 whitespace-nowrap">
              {t('generationHistory.generatedSpeech')}
            </h2>
            {/* Count */}
            <span className="text-lg font-semibold text-gray-500">
              ({total})
            </span>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Loading State - Show Skeletons */}
        {loading && generations.length === 0 && (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <MobileSpeechCardSkeleton key={i} />
            ))}
          </div>
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

        {/* Speech Cards - Reuse Mobile Component */}
        {generations.length > 0 && (
          <div className="space-y-3">
            {generations.map((generation) => (
              <MobileSpeechCard
                key={generation.id}
                generation={generation}
                onDelete={() => onDeleteGeneration(generation.id)}
                onDownload={() => onDownloadGeneration(generation.id)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={total}
              itemsPerPage={pageSize}
              onPageChange={onPageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}