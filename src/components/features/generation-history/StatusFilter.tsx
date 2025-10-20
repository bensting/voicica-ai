'use client';

import { TaskStatus } from '@/types/tts';
import { useLanguage } from '@/contexts/LanguageContext';

interface StatusFilterProps {
  selectedStatus: TaskStatus | null;
  onStatusChange: (status: TaskStatus | null) => void;
}

export default function StatusFilter({ selectedStatus, onStatusChange }: StatusFilterProps) {
  const { t } = useLanguage();

  const statuses: Array<{ value: TaskStatus | null; label: string; color: string }> = [
    { value: null, label: t('generationHistory.filters.allStatus') || 'All Status', color: 'bg-gray-100 text-gray-800' },
    { value: TaskStatus.SUCCESS, label: t('generationHistory.filters.success') || 'Success', color: 'bg-green-100 text-green-800' },
    { value: TaskStatus.PROCESSING, label: t('generationHistory.filters.processing') || 'Processing', color: 'bg-blue-100 text-blue-800' },
    { value: TaskStatus.PENDING, label: t('generationHistory.filters.pending') || 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: TaskStatus.FAILURE, label: t('generationHistory.filters.failed') || 'Failed', color: 'bg-red-100 text-red-800' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((status) => (
        <button
          key={status.value || 'all'}
          onClick={() => onStatusChange(status.value)}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            selectedStatus === status.value
              ? `${status.color} ring-2 ring-offset-2 ${
                  status.value === TaskStatus.SUCCESS ? 'ring-green-500' :
                  status.value === TaskStatus.PROCESSING ? 'ring-blue-500' :
                  status.value === TaskStatus.PENDING ? 'ring-yellow-500' :
                  status.value === TaskStatus.FAILURE ? 'ring-red-500' :
                  'ring-gray-500'
                }`
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {status.label}
        </button>
      ))}
    </div>
  );
}