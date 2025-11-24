import { useLanguage } from '@/contexts/LanguageContext';

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

export default function ErrorState({ error, onRetry }: ErrorStateProps) {
  const { t } = useLanguage();

  return (
    <div className="text-center py-12">
      <div className="text-red-600 mb-2">{error}</div>
      <button
        onClick={onRetry}
        className="text-purple-600 hover:text-purple-700 text-sm"
      >
        {t('subscription.mySubscription.retry')}
      </button>
    </div>
  );
}