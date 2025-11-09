'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import DatePicker, { registerLocale } from 'react-datepicker';
import { enUS, zhCN, zhTW } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';

// Register locales
registerLocale('en', enUS);
registerLocale('zh-CN', zhCN);
registerLocale('zh-TW', zhTW);

interface DateRangeFilterProps {
  startDate: string | null;
  endDate: string | null;
  onDateRangeChange: (startDate: string | null, endDate: string | null) => void;
}

export default function DateRangeFilter({ startDate, endDate, onDateRangeChange }: DateRangeFilterProps) {
  const { t, locale } = useLanguage();
  const [localStartDate, setLocalStartDate] = useState<Date | null>(
    startDate ? new Date(startDate) : null
  );
  const [localEndDate, setLocalEndDate] = useState<Date | null>(
    endDate ? new Date(endDate) : null
  );

  const handleApply = () => {
    onDateRangeChange(
      localStartDate ? localStartDate.toISOString() : null,
      localEndDate ? localEndDate.toISOString() : null
    );
  };

  const handleClear = () => {
    setLocalStartDate(null);
    setLocalEndDate(null);
    onDateRangeChange(null, null);
  };

  // Map locale to date-fns locale
  const getLocale = () => {
    if (locale === 'zh-CN') return 'zh-CN';
    if (locale === 'zh-TW') return 'zh-TW';
    return 'en';
  };

  return (
    <div className="space-y-2 max-w-full">
      {/* Date Inputs Row */}
      <div className="flex items-center gap-2 max-w-full">
        <div className="flex-1 min-w-0">
          <DatePicker
            selected={localStartDate}
            onChange={(date) => setLocalStartDate(date)}
            selectsStart
            startDate={localStartDate}
            endDate={localEndDate}
            locale={getLocale()}
            dateFormat="yyyy/MM/dd"
            className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholderText={locale === 'zh-CN' || locale === 'zh-TW' ? '年/月/日' : 'MM/DD/YYYY'}
            maxDate={localEndDate || undefined}
          />
        </div>
        <span className="text-gray-500 flex-shrink-0">-</span>
        <div className="flex-1 min-w-0">
          <DatePicker
            selected={localEndDate}
            onChange={(date) => setLocalEndDate(date)}
            selectsEnd
            startDate={localStartDate}
            endDate={localEndDate}
            locale={getLocale()}
            dateFormat="yyyy/MM/dd"
            className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholderText={locale === 'zh-CN' || locale === 'zh-TW' ? '年/月/日' : 'MM/DD/YYYY'}
            minDate={localStartDate || undefined}
          />
        </div>
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