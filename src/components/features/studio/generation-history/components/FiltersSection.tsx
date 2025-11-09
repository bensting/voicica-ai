import StatusFilter from '../StatusFilter';
import DateRangeFilter from '../DateRangeFilter';
import { TaskStatus } from '@/types/tts';

interface FiltersSectionProps {
  selectedStatus: TaskStatus | null;
  startDate: string | null;
  endDate: string | null;
  onStatusChange: (status: TaskStatus | null) => void;
  onDateRangeChange: (start: string | null, end: string | null) => void;
  statusLabel: string;
  dateRangeLabel: string;
}

/**
 * Filters section component
 * Contains status and date range filters
 * Desktop: Shows labels for filters
 * Mobile: Compact layout without labels
 */
export default function FiltersSection({
  selectedStatus,
  startDate,
  endDate,
  onStatusChange,
  onDateRangeChange,
  statusLabel,
  dateRangeLabel,
}: FiltersSectionProps) {
  return (
    <>
      {/* ========== 桌面端布局 (lg+) ========== */}
      <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-4">
          {/* Status Filter */}
          <div className="grid grid-cols-[auto_minmax(0,400px)] gap-3 items-center">
            <h3 className="text-sm font-medium text-gray-700 whitespace-nowrap">{statusLabel}</h3>
            <StatusFilter selectedStatus={selectedStatus} onStatusChange={onStatusChange} />
          </div>

          {/* Date Range Filter */}
          <div className="grid grid-cols-[auto_minmax(0,400px)] gap-3 items-start">
            <h3 className="text-sm font-medium text-gray-700 whitespace-nowrap pt-2">{dateRangeLabel}</h3>
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onDateRangeChange={onDateRangeChange}
            />
          </div>
        </div>
      </div>

      {/* ========== 移动端布局 (<lg) ========== */}
      <div className="lg:hidden bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="space-y-3">
          {/* Status Filter */}
          <div className="grid grid-cols-[auto_1fr] gap-2 items-center">
            <h3 className="text-sm font-medium text-gray-700 whitespace-nowrap">{statusLabel}</h3>
            <StatusFilter selectedStatus={selectedStatus} onStatusChange={onStatusChange} />
          </div>

          {/* Date Range Filter */}
          <div className="grid grid-cols-[auto_1fr] gap-2 items-start">
            <h3 className="text-sm font-medium text-gray-700 whitespace-nowrap pt-2">{dateRangeLabel}</h3>
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onDateRangeChange={onDateRangeChange}
            />
          </div>
        </div>
      </div>
    </>
  );
}