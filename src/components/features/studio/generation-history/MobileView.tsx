'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import FiltersSection from './components/FiltersSection';
import GenerationsList from './components/GenerationsList';
import Pagination from './Pagination';
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
 * Mobile View for Generation History
 */
export default function MobileView({
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
}: MobileViewProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col h-full pb-20">
      {/* Fixed Filters Section at Top */}
      <div className="flex-none py-4">
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
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4 pb-4">
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
      </div>
    </div>
  );
}