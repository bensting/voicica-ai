'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import SpeechEntry from './SpeechEntry';
import Pagination from './Pagination';
import StatusFilter from './StatusFilter';
import DateRangeFilter from './DateRangeFilter';
import { TaskStatus } from '@/types/tts';

interface Generation {
  id: string;
  text: string;
  timestamp: string;
  duration: number;
  characterCount: number;
  audioUrl: string;
  status?: TaskStatus;
  errorMessage?: string;
  voiceName?: string;
}

interface GenerationHistoryProps {
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

export default function GenerationHistory({
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
}: GenerationHistoryProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('generationHistory.title')}
        </h1>
        <p className="text-gray-600">
          {t('generationHistory.subtitle')}
        </p>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-4">
          {/* Status Filter */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              {t('generationHistory.filters.status') || 'Filter by Status'}
            </h3>
            <StatusFilter
              selectedStatus={selectedStatus}
              onStatusChange={onStatusChange}
            />
          </div>

          {/* Date Range Filter */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              {t('generationHistory.filters.dateRange') || 'Filter by Date Range'}
            </h3>
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onDateRangeChange={onDateRangeChange}
            />
          </div>
        </div>
      </div>

      {/* Generated Speech Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Section Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">
              {t('generationHistory.generatedSpeech')}
            </h2>
            <div className="flex items-center justify-center w-8 h-8 bg-gray-900 text-white text-sm font-medium rounded-full">
              {total}
            </div>
          </div>

          {total > 0 && (
            <button
              onClick={onClearAll}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {t('generationHistory.clearAll')}
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="p-12">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Speech Entries */}
            <div className="divide-y divide-gray-200">
              {generations.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t('generationHistory.noGenerations')}
                  </h3>
                  <p className="text-gray-500">
                    {t('generationHistory.noGenerationsDescription')}
                  </p>
                </div>
              ) : (
                generations.map((generation) => (
                  <SpeechEntry
                    key={generation.id}
                    generation={generation}
                    onDelete={() => onDeleteGeneration(generation.id)}
                    onDownload={() => onDownloadGeneration(generation.id)}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={total}
          itemsPerPage={pageSize}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
