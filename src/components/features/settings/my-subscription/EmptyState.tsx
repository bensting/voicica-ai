import { useLanguage } from '@/contexts/LanguageContext';

export default function EmptyState() {
  const { t } = useLanguage();

  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('subscription.mySubscription.emptyTitle')}</h3>
      <p className="text-gray-600">
        {t('subscription.mySubscription.emptyDesc')}
      </p>
    </div>
  );
}