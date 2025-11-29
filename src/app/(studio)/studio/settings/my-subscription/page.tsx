'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useSubscriptionManager } from '@/components/features/settings/my-subscription/hooks/useSubscriptionManager';
import SectionHeader from '@/components/features/settings/my-subscription/SectionHeader';
import LoadingState from '@/components/features/settings/my-subscription/LoadingState';
import ErrorState from '@/components/features/settings/my-subscription/ErrorState';
import EmptyState from '@/components/features/settings/my-subscription/EmptyState';
import SubscriptionList from '@/components/features/settings/my-subscription/SubscriptionList';
import LoginModal from '@/components/features/auth/LoginModal';

export default function MySubscriptionPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useFirebaseAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const {
    data,
    loading,
    error,
    cancelingId,
    fetchSubscriptions,
    handleCancelSubscription,
  } = useSubscriptionManager();

  // 检查登录状态，未登录则显示登录 Modal
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('🚫 未登录，显示登录 Modal');
      setShowLoginModal(true);
    } else if (user) {
      setShowLoginModal(false);
    }
  }, [user, authLoading]);

  // 处理关闭登录 Modal - 跳转到首页
  const handleCloseLoginModal = () => {
    setShowLoginModal(false);
    router.push('/');
  };

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