import type { UserSubscriptionListResponse } from '@/types/subscription';
import SubscriptionCard from './SubscriptionCard';

interface SubscriptionListProps {
  data: UserSubscriptionListResponse;
  onCancel?: (subscriptionId: string, reason?: string) => Promise<{ success: boolean; error?: string }>;
  cancelingId?: string | null;
}

export default function SubscriptionList({ data, onCancel, cancelingId }: SubscriptionListProps) {
  return (
    <div className="space-y-6">
      {/* Active */}
      {data.active_subscription && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Active</h3>
          <SubscriptionCard
            subscription={data.active_subscription}
            isActive
            onCancel={onCancel}
            isCanceling={cancelingId === data.active_subscription.id}
          />
        </div>
      )}

      {/* 已取消/已过期 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">已取消/已过期</h3>
        <div className="space-y-4">
          {data.subscriptions.map((subscription) => (
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
    </div>
  );
}