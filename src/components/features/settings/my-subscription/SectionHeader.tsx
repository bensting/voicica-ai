import { useLanguage } from '@/contexts/LanguageContext';

export default function SectionHeader() {
  const { t } = useLanguage();

  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-900">
        {t('settings.menu.mySubscription')}
      </h2>
    </div>
  );
}