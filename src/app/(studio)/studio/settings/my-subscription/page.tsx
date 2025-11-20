'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useSubscriptionManager } from '@/components/features/settings/my-subscription/hooks/useSubscriptionManager';
import SectionHeader from '@/components/features/settings/my-subscription/SectionHeader';
import SubscriptionTabs from '@/components/features/settings/my-subscription/SubscriptionTabs';
import LoadingState from '@/components/features/settings/my-subscription/LoadingState';
import ErrorState from '@/components/features/settings/my-subscription/ErrorState';
import EmptyState from '@/components/features/settings/my-subscription/EmptyState';
import SubscriptionList from '@/components/features/settings/my-subscription/SubscriptionList';

export default function MySubscriptionPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useFirebaseAuth();
  const {
    activeTab,
    setActiveTab,
    data,
    loading,
    error,
    cancelingId,
    fetchSubscriptions,
    handleCancelSubscription,
  } = useSubscriptionManager();

  // 检查登录状态，未登录则重定向到登录页
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('🚫 未登录，重定向到登录页');
      // 保存当前路径，登录成功后返回
      const currentPath = window.location.pathname;
      router.push(`/studio/login?returnUrl=${encodeURIComponent(currentPath)}`);
    }
  }, [user, authLoading, router]);

  // Tab 切换时重新获取数据
  useEffect(() => {
    if (activeTab === 'all') {
      void fetchSubscriptions();
    } else {
      void fetchSubscriptions(activeTab);
    }
  }, [activeTab, fetchSubscriptions]);

  // 认证加载中，显示加载状态
  if (authLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
        <LoadingState />
      </div>
    );
  }

  // 未登录，不渲染内容（等待重定向）
  if (!user) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6 flex flex-col max-h-[calc(100vh-120px)] lg:max-h-[calc(100vh-180px)]">
      {/* Section Header */}
      <SectionHeader />

      {/* Tabs */}
      <SubscriptionTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState
            error={error}
            onRetry={() => fetchSubscriptions(activeTab === 'all' ? undefined : activeTab)}
          />
        ) : data?.subscriptions.length === 0 ? (
          <EmptyState />
        ) : data ? (
          <SubscriptionList
            data={data}
            onCancel={handleCancelSubscription}
            cancelingId={cancelingId}
          />
        ) : null}
      </div>
    </div>
  );
}