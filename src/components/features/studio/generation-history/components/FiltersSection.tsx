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

      {/* ========== 移动端布局 (<lg) ========== */}
      <div className="lg:hidden bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="space-y-3">
          {/* Status Filter Row */}
          <div className="grid grid-cols-[auto_1fr] gap-2 items-center">
            <span className="text-sm font-medium text-gray-700">状态</span>
            <StatusFilter selectedStatus={selectedStatus} onStatusChange={onStatusChange} />
          </div>

          {/* Date Range Filter Row */}
          <div className="grid grid-cols-[auto_1fr] gap-2 items-center">
            <span className="text-sm font-medium text-gray-700">日期</span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate ? startDate.split('T')[0] : ''}
                onChange={(e) => {
                  const newStartDate = e.target.value ? new Date(e.target.value).toISOString() : null;
                  onDateRangeChange(newStartDate, endDate);
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <span className="text-gray-500">-</span>
              <input
                type="date"
                value={endDate ? endDate.split('T')[0] : ''}
                onChange={(e) => {
                  const newEndDate = e.target.value ? new Date(e.target.value).toISOString() : null;
                  onDateRangeChange(startDate, newEndDate);
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                // Dates are applied automatically via onChange
              }}
              className="flex-1 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              应用
            </button>
            {(startDate || endDate) && (
              <button
                onClick={() => onDateRangeChange(null, null)}
                className="flex-1 px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                清除
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}