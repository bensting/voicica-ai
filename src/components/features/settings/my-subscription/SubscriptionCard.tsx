import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
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
  const { locale } = useLanguage();

  // 状态标签样式
  const getStatusBadge = (status: UserSubscription['status']) => {
    const styles: Record<string, string> = {
      TRIAL: 'bg-blue-100 text-blue-700',
      ACTIVE: 'bg-green-100 text-green-700',
      EXPIRED: 'bg-gray-100 text-gray-700',
      CANCELLED: 'bg-red-100 text-red-700',
      SUSPENDED: 'bg-yellow-100 text-yellow-700',
    };
    // 不区分大小写匹配
    const statusKey = (status as string).toUpperCase();
    return styles[statusKey] || 'bg-gray-100 text-gray-700';
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

  // 获取显示名称（支持多语言）
  const getDisplayName = () => {
    // 如果有 display_name，尝试获取当前语言的名称
    type SubscriptionWithDisplayName = UserSubscription & { display_name?: Record<string, string> };
    const displayNameMap = (subscription as SubscriptionWithDisplayName).display_name;

    if (displayNameMap && typeof displayNameMap === 'object') {
      // 尝试多种键格式：locale 完整格式 (en-US)、简短格式 (en)、中文特殊格式 (zh-CN, zh-TW)
      const localeKey = locale; // 如 'en-US'
      const shortLang = locale.split('-')[0]; // 如 'en'

      const displayName =
        displayNameMap[localeKey] || // 尝试 'en-US'
        displayNameMap[shortLang] || // 尝试 'en'
        displayNameMap['en'] ||       // 回退到英文
        Object.values(displayNameMap)[0]; // 任意第一个值

      if (displayName) {
        return displayName as string;
      }
    }
    // 回退到 product_type
    return subscription.product_type === 'text_to_speech' ? 'Text to Speech' : 'Voice Cloning';
  };

  // 是否显示取消按钮：仅对 ACTIVE 状态且平台为 stripe 的订阅显示
  // 注意：后端可能返回小写 'active'，所以需要不区分大小写比较
  const statusUpper = (subscription.status as string).toUpperCase();
  const showCancelButton =
    statusUpper === 'ACTIVE' &&
    subscription.platform === 'stripe' &&
    onCancel;

  // 处理取消订阅
  const handleCancelConfirm = async (reason?: string) => {
    if (!onCancel) return;

    // 调试：打印完整的订阅对象
    console.log('取消订阅 - 完整对象:', subscription);
    console.log('取消订阅 - 使用的 ID:', subscription.id);

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
        {/* 桌面端：单行布局 */}
        <div className="hidden lg:flex items-center justify-between">
          {/* 左侧：图标 + 计划信息 */}
          <div className="flex items-center gap-4">
            <span className="text-3xl">{getPlatformIcon(subscription.platform || 'stripe')}</span>
            <div>
              {/* 计划名称 */}
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-lg font-semibold text-gray-900">
                  {getDisplayName()}
                </h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(subscription.status)}`}>
                  {subscription.status}
                </span>
              </div>
              {/* 有效期 */}
              {subscription.end_date && (
                <p className="text-sm text-gray-600">
                  Valid until: {formatDate(subscription.end_date)}
                  {subscription.days_remaining !== undefined && subscription.days_remaining !== null && (
                    <span className="ml-2 text-gray-500">({subscription.days_remaining} days left)</span>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* 右侧：价格 + 取消按钮 */}
          <div className="flex items-center gap-4">
            {/* 价格 */}
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-900">
                {formatPrice(subscription.amount, subscription.currency)}
              </div>
              <p className="text-xs text-gray-500">
                {subscription.credits_allocated.toLocaleString()} credits
              </p>
            </div>

            {/* 取消按钮 */}
            {showCancelButton && (
              <button
                onClick={() => setShowCancelDialog(true)}
                disabled={isCanceling}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isCanceling ? 'Canceling...' : 'Cancel Subscription'}
              </button>
            )}
          </div>
        </div>

        {/* 移动端：多行布局 */}
        <div className="lg:hidden">
          {/* 第一行：图标 + 计划信息 + 价格 */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start gap-3">
              <span className="text-3xl">{getPlatformIcon(subscription.platform || 'stripe')}</span>
              <div>
                {/* 计划名称 */}
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h4 className="text-base font-semibold text-gray-900">
                    {getDisplayName()}
                  </h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(subscription.status)}`}>
                    {subscription.status}
                  </span>
                </div>
                {/* 有效期 */}
                {subscription.end_date && (
                  <p className="text-xs text-gray-600">
                    Valid until: {formatDate(subscription.end_date)}
                    {subscription.days_remaining !== undefined && subscription.days_remaining !== null && (
                      <span className="block text-gray-500">({subscription.days_remaining} days left)</span>
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* 价格 */}
            <div className="text-right">
              <div className="text-base font-semibold text-gray-900">
                {formatPrice(subscription.amount, subscription.currency)}
              </div>
              <p className="text-xs text-gray-500">
                {subscription.credits_allocated.toLocaleString()} credits
              </p>
            </div>
          </div>

          {/* 第二行：取消按钮 */}
          {showCancelButton && (
            <button
              onClick={() => setShowCancelDialog(true)}
              disabled={isCanceling}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCanceling ? 'Canceling...' : 'Cancel Subscription'}
            </button>
          )}
        </div>
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