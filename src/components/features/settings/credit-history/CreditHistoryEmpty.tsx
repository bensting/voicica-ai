'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import CreditsIcon from '@/components/icons/CreditsIcon';

export function CreditHistoryEmpty() {
  const { t } = useLanguage();

  return (
    <div className="p-12 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CreditsIcon className="w-8 h-8 text-gray-400" />
      </div>
      <p className="text-gray-500">{t('creditHistory.empty')}</p>
    </div>
  );
}