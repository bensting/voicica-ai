'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface DateRangeFilterProps {
  startDate: string | null;
  endDate: string | null;
  onDateRangeChange: (startDate: string | null, endDate: string | null) => void;
}

export default function DateRangeFilter({ startDate, endDate, onDateRangeChange }: DateRangeFilterProps) {
  const { t } = useLanguage();
  const [localStartDate, setLocalStartDate] = useState(startDate || '');
  const [localEndDate, setLocalEndDate] = useState(endDate || '');

  const handleApply = () => {
    onDateRangeChange(
      localStartDate || null,
      localEndDate || null
    );
  };

  const handleClear = () => {
    setLocalStartDate('');
    setLocalEndDate('');
    onDateRangeChange(null, null);
  };

  const formatDateForInput = (date: string | null): string => {
    if (!date) return '';
    return date.split('T')[0];
  };

  const formatDateForApi = (date: string): string => {
    if (!date) return '';
    return new Date(date).toISOString();
  };

  return (
    <div className="space-y-2 max-w-full">
      {/* Date Inputs Row */}
      <div className="flex items-center gap-2 max-w-full">
        <input
          type="date"
          value={formatDateForInput(localStartDate)}
          onChange={(e) => setLocalStartDate(e.target.value ? formatDateForApi(e.target.value) : '')}
          className="w-0 flex-1 min-w-0 px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <span className="text-gray-500 flex-shrink-0">-</span>
        <input
          type="date"
          value={formatDateForInput(localEndDate)}
          onChange={(e) => setLocalEndDate(e.target.value ? formatDateForApi(e.target.value) : '')}
          className="w-0 flex-1 min-w-0 px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Action Buttons Row */}
      <div className="flex items-center gap-2 max-w-full">
        <button
          onClick={handleApply}
          className="w-0 flex-1 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          {t('generationHistory.filters.apply') || 'Apply'}
        </button>
        {(localStartDate || localEndDate) && (
          <button
            onClick={handleClear}
            className="w-0 flex-1 px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            {t('generationHistory.filters.clear') || 'Clear'}
          </button>
        )}
      </div>
    </div>
  );
}