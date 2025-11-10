'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import PageHeader from './components/PageHeader';
import FiltersSection from './components/FiltersSection';
import GenerationsList from './components/GenerationsList';
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
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Generations List */}
        <GenerationsList
          generations={generations}
          total={total}
          loading={loading}
          onClearAll={onClearAll}
          onDelete={onDeleteGeneration}
          onDownload={onDownloadGeneration}
          title={t('generationHistory.generatedSpeech')}
          clearAllLabel={t('generationHistory.clearAll')}
          noGenerationsTitle={t('generationHistory.noGenerations')}
          noGenerationsDescription={t('generationHistory.noGenerationsDescription')}
        />

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