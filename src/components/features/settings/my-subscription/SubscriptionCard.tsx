import { useState } from 'react';
import type { UserSubscription } from '@/types/subscription';
import CancelSubscriptionDialog from './CancelSubscriptionDialog';

interface SubscriptionCardProps {
  subscription: UserSubscription;
  isActive: boolean;
  onCancel?: (subscriptionId: string, reason?: string) => Promise<{ success: boolean; error?: string }>;
  isCanceling?: boolean;
}

export default function SubscriptionCard({
  subscription,
  isActive,
  onCancel,
  isCanceling,
}: SubscriptionCardProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // 状态标签样式
  const getStatusBadge = (status: UserSubscription['status']) => {
    const styles = {
      TRIAL: 'bg-blue-100 text-blue-700',
      ACTIVE: 'bg-green-100 text-green-700',
      EXPIRED: 'bg-gray-100 text-gray-700',
      CANCELLED: 'bg-red-100 text-red-700',
      SUSPENDED: 'bg-yellow-100 text-yellow-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // 格式化价格
  const formatPrice = (amount?: number, currency?: string) => {
    if (!amount || !currency) return '-';
    const price = (amount / 100).toFixed(2);
    return `${currency.toUpperCase()} ${price}`;
  };

  // 平台图标
  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      stripe: '💳',
      creem: '💰',
      google_play: '🤖',
      apple: '🍎',
    };
    return icons[platform] || '💳';
  };

  // 是否显示取消按钮：仅对 ACTIVE 状态且平台为 stripe 的订阅显示
  const showCancelButton = subscription.status === 'ACTIVE' && subscription.platform === 'stripe' && onCancel;

  // 处理取消订阅
  const handleCancelConfirm = async (reason?: string) => {
    if (!onCancel) return;

    const result = await onCancel(subscription.id, reason);

    if (result.success) {
      setShowCancelDialog(false);
    } else {
      // 显示错误信息（这里可以添加 toast 通知）
      alert(result.error || 'Failed to cancel subscription');
    }
  };

  return (
    <>
      <div
        className={`
          border rounded-lg p-4
          ${isActive ? 'border-purple-200 bg-purple-50' : 'border-gray-200 bg-white'}
        `}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getPlatformIcon(subscription.platform)}</span>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-900">
                  {subscription.product_type === 'text_to_speech' ? 'Text to Speech' : 'Voice Cloning'}
                </h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(subscription.status)}`}>
                  {subscription.status}
                </span>
                {subscription.auto_renew && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    Auto-renew
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Platform: {subscription.platform.charAt(0).toUpperCase() + subscription.platform.slice(1)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-gray-900">
              {formatPrice(subscription.amount, subscription.currency)}
            </div>
            {subscription.days_remaining !== undefined && subscription.days_remaining !== null && (
              <p className="text-sm text-gray-500 mt-1">
                {subscription.days_remaining} days left
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Start Date:</span>
            <span className="ml-2 text-gray-900 font-medium">{formatDate(subscription.start_date)}</span>
          </div>
          {subscription.end_date && (
            <div>
              <span className="text-gray-500">End Date:</span>
              <span className="ml-2 text-gray-900 font-medium">{formatDate(subscription.end_date)}</span>
            </div>
          )}
          <div>
            <span className="text-gray-500">Credits:</span>
            <span className="ml-2 text-gray-900 font-medium">{subscription.credits_allocated.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-500">Created:</span>
            <span className="ml-2 text-gray-900 font-medium">{formatDate(subscription.created_at)}</span>
          </div>
        </div>

        {/* Cancel Button */}
        {showCancelButton && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowCancelDialog(true)}
              disabled={isCanceling}
              className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCanceling ? 'Canceling...' : 'Cancel Subscription'}
            </button>
          </div>
        )}
      </div>

      {/* Cancel Dialog */}
      <CancelSubscriptionDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleCancelConfirm}
        loading={!!isCanceling}
        productName={subscription.product_type === 'text_to_speech' ? 'Text to Speech' : 'Voice Cloning'}
      />
    </>
  );
}