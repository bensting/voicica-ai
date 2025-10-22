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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="space-y-4">
        {/* Status Filter */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">{statusLabel}</h3>
          <StatusFilter selectedStatus={selectedStatus} onStatusChange={onStatusChange} />
        </div>

        {/* Date Range Filter */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">{dateRangeLabel}</h3>
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onDateRangeChange={onDateRangeChange}
          />
        </div>
      </div>
    </div>
  );
}