'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getMySubscriptions } from '@/lib/api/subscription';
import type { UserSubscriptionListResponse, UserSubscription } from '@/types/subscription';

type TabType = 'all' | 'text_to_speech' | 'voice_cloning';

export default function MySubscriptionPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [data, setData] = useState<UserSubscriptionListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取订阅数据
  const fetchSubscriptions = async (productType?: 'text_to_speech' | 'voice_cloning') => {
    try {
      setLoading(true);
      setError(null);
      const data: UserSubscriptionListResponse = await getMySubscriptions(
        productType ? { product_type: productType } : undefined
      );
      setData(data);
    } catch (err) {
      console.error('Failed to fetch subscriptions:', err);
      setError('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  // Tab 切换时重新获取数据
  useEffect(() => {
    if (activeTab === 'all') {
      fetchSubscriptions();
    } else {
      fetchSubscriptions(activeTab);
    }
  }, [activeTab]);

  // Tab 配置
  const tabs = [
    { id: 'all' as TabType, label: 'All' },
    { id: 'text_to_speech' as TabType, label: 'Text to Voice' },
    { id: 'voice_cloning' as TabType, label: 'Voice Clone' },
  ];

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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">
          {t('settings.menu.mySubscription')}
        </h2>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-4 py-2 text-sm font-medium border-b-2 transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-red-600 mb-2">{error}</div>
          <button
            onClick={() => fetchSubscriptions(activeTab === 'all' ? undefined : activeTab)}
            className="text-purple-600 hover:text-purple-700 text-sm"
          >
            Retry
          </button>
        </div>
      ) : data?.subscriptions.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Subscriptions</h3>
          <p className="text-gray-600">
            You don&apos;t have any subscriptions yet.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Subscription */}
          {data?.active_subscription && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Subscription</h3>
              <SubscriptionCard subscription={data.active_subscription} isActive />
            </div>
          )}

          {/* Subscription History */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription History</h3>
            <div className="space-y-4">
              {data?.subscriptions.map((subscription) => (
                <SubscriptionCard
                  key={subscription.id}
                  subscription={subscription}
                  isActive={false}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // 订阅卡片组件
  function SubscriptionCard({
    subscription,
    isActive,
  }: {
    subscription: UserSubscription;
    isActive: boolean;
  }) {
    return (
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
      </div>
    );
  }
}