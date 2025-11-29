'use client';

import { useEffect } from 'react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useSubscriptionManager } from '@/components/features/settings/my-subscription/hooks/useSubscriptionManager';
import SectionHeader from '@/components/features/settings/my-subscription/SectionHeader';
import LoadingState from '@/components/features/settings/my-subscription/LoadingState';
import ErrorState from '@/components/features/settings/my-subscription/ErrorState';
import EmptyState from '@/components/features/settings/my-subscription/EmptyState';
import SubscriptionList from '@/components/features/settings/my-subscription/SubscriptionList';
import LoginModal from '@/components/features/auth/LoginModal';

export default function MySubscriptionPage() {
  // 使用通用的需要登录 Hook
  const { user, authLoading, showLoginModal, handleCloseLoginModal } = useRequireAuth();
  const {
    data,
    loading,
    error,
    cancelingId,
    fetchSubscriptions,
    handleCancelSubscription,
  } = useSubscriptionManager();

  // 获取订阅数据
  useEffect(() => {
    void fetchSubscriptions();
  }, [fetchSubscriptions]);

  // 认证加载中，显示加载状态
  if (authLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
        <LoadingState />
      </div>
    );
  }

  return (
    <>
      {/* 已登录时显示页面内容 */}
      {user && (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6 flex flex-col max-h-[calc(100vh-120px)] lg:max-h-[calc(100vh-180px)]">
        {/* Section Header */}
        <SectionHeader />

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState
              error={error}
              onRetry={() => fetchSubscriptions()}
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
      )}

      {/* Login Modal - 未登录时显示 */}
      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={handleCloseLoginModal}
        />
      )}
    </>
  );
}