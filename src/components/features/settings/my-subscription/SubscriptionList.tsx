'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { UserSubscriptionListResponse } from '@/types/subscription';
import SubscriptionCard from './SubscriptionCard';

interface SubscriptionListProps {
  data: UserSubscriptionListResponse;
  onCancel?: (subscriptionId: string, reason?: string) => Promise<{ success: boolean; error?: string }>;
  cancelingId?: string | null;
}

type TabType = 'active' | 'inactive';

export default function SubscriptionList({ data, onCancel, cancelingId }: SubscriptionListProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('active');

  // 按状态分组订阅
  const activeSubscriptions = data.subscriptions.filter(
    (sub) => sub.status.toUpperCase() === 'ACTIVE'
  );
  const inactiveSubscriptions = data.subscriptions.filter(
    (sub) => sub.status.toUpperCase() !== 'ACTIVE'
  );

  // 当前显示的订阅列表
  const currentSubscriptions = activeTab === 'active' ? activeSubscriptions : inactiveSubscriptions;

  return (
    <div className="space-y-6">
      {/* 标签页 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {/* Active Tab */}
          <button
            onClick={() => setActiveTab('active')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'active'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            {t('subscription.mySubscription.activeSection')}
            {activeSubscriptions.length > 0 && (
              <span className={`
                ml-2 py-0.5 px-2 rounded-full text-xs font-medium
                ${activeTab === 'active'
                  ? 'bg-purple-100 text-purple-600'
                  : 'bg-gray-100 text-gray-600'
                }
              `}>
                {activeSubscriptions.length}
              </span>
            )}
          </button>

          {/* Inactive Tab */}
          <button
            onClick={() => setActiveTab('inactive')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'inactive'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            {t('subscription.mySubscription.inactiveSection')}
            {inactiveSubscriptions.length > 0 && (
              <span className={`
                ml-2 py-0.5 px-2 rounded-full text-xs font-medium
                ${activeTab === 'inactive'
                  ? 'bg-purple-100 text-purple-600'
                  : 'bg-gray-100 text-gray-600'
                }
              `}>
                {inactiveSubscriptions.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* 订阅列表内容 */}
      <div className="space-y-4">
        {currentSubscriptions.length > 0 ? (
          currentSubscriptions.map((subscription) => (
            <SubscriptionCard
              key={subscription.id}
              subscription={subscription}
              isActive={activeTab === 'active'}
              onCancel={onCancel}
              isCanceling={cancelingId === subscription.id}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">
              {activeTab === 'active'
                ? t('subscription.mySubscription.noActiveSubscriptions')
                : t('subscription.mySubscription.noInactiveSubscriptions')
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}