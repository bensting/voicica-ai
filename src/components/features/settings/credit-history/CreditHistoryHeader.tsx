'use client';

import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import CreditsIcon from '@/components/icons/CreditsIcon';

interface CreditHistoryHeaderProps {
  total: number;
}

export function CreditHistoryHeader({ total }: CreditHistoryHeaderProps) {
  const { t } = useLanguage();
  const router = useRouter();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="w-10 h-10 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl flex items-center justify-center">
          <CreditsIcon className="w-6 h-6 text-yellow-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {t('creditHistory.title')}
          </h1>
          {total > 0 && (
            <p className="text-sm text-gray-500">
              {total} {t('generationHistory.total')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}