'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import PageHeader from './components/PageHeader';
import FiltersSection from './components/FiltersSection';
import GenerationsList from './components/GenerationsList';
import Pagination from './Pagination';
import { TaskStatus } from '@/types/tts';
import type { Generation } from '@/types/tts';

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

/**
 * Generation History component
 *
 * Main component for displaying and managing TTS generation history
 * Composed of:
 * - PageHeader: Title and subtitle
 * - FiltersSection: Status and date range filters
 * - GenerationsList: List of generations with actions
 * - Pagination: Page navigation
 */
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
