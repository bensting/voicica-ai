import { useLanguage } from '@/contexts/LanguageContext';
import type { UserSubscriptionListResponse } from '@/types/subscription';
import SubscriptionCard from './SubscriptionCard';

interface SubscriptionListProps {
  data: UserSubscriptionListResponse;
  onCancel?: (subscriptionId: string, reason?: string) => Promise<{ success: boolean; error?: string }>;
  cancelingId?: string | null;
}

export default function SubscriptionList({ data, onCancel, cancelingId }: SubscriptionListProps) {
  const { t } = useLanguage();

  // 按状态分组订阅
  const activeSubscriptions = data.subscriptions.filter(
    (sub) => sub.status.toUpperCase() === 'ACTIVE'
  );
  const inactiveSubscriptions = data.subscriptions.filter(
    (sub) => sub.status.toUpperCase() !== 'ACTIVE'
  );

  return (
    <div className="space-y-6">
      {/* Active */}
      {activeSubscriptions.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('subscription.mySubscription.activeSection')}</h3>
          <div className="space-y-4">
            {activeSubscriptions.map((subscription) => (
              <SubscriptionCard
                key={subscription.id}
                subscription={subscription}
                isActive
                onCancel={onCancel}
                isCanceling={cancelingId === subscription.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* 已取消/已过期 */}
      {inactiveSubscriptions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('subscription.mySubscription.inactiveSection')}</h3>
          <div className="space-y-4">
            {inactiveSubscriptions.map((subscription) => (
              <SubscriptionCard
                key={subscription.id}
                subscription={subscription}
                isActive={false}
                onCancel={onCancel}
                isCanceling={cancelingId === subscription.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}