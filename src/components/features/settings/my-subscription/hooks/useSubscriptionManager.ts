import { useState, useCallback } from 'react';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { getMySubscriptions, cancelSubscription } from '@/actions/subscription';
import { getEnabledProductTypeTabs } from '@/config/subscription';
import type { UserSubscriptionListResponse } from '@/types/subscription';
import type { ProductType } from '@/config/subscription';

export type TabType = ProductType;

// 获取默认 tab（第一个启用的 tab）
function getDefaultTab(): TabType {
  const enabledTabs = getEnabledProductTypeTabs();
  return enabledTabs[0]?.type || 'text_to_speech';
}

export function useSubscriptionManager() {
  const { user, loading: authLoading } = useFirebaseAuth();
  const [activeTab, setActiveTab] = useState<TabType>(getDefaultTab);
  const [data, setData] = useState<UserSubscriptionListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  // 获取订阅数据
  const fetchSubscriptions = useCallback(async (productType?: ProductType) => {
    // 如果正在检查认证状态，不执行查询
    if (authLoading) {
      console.log('⏳ 等待认证状态确认...');
      return;
    }

    // 如果用户未登录，不执行查询
    if (!user) {
      console.log('👤 用户未登录，跳过订阅查询');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const responseData: UserSubscriptionListResponse = await getMySubscriptions(
        productType ? { product_type: productType } : undefined
      );
      setData(responseData);
    } catch (err) {
      console.error('Failed to fetch subscriptions:', err);
      setError('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  // 取消订阅
  const handleCancelSubscription = useCallback(async (subscriptionId: string, reason?: string) => {
    try {
      setCancelingId(subscriptionId);
      await cancelSubscription(subscriptionId, reason ? { cancellation_reason: reason } : undefined);

      // 重新获取订阅列表
      await fetchSubscriptions(activeTab);

      return { success: true };
    } catch (err: unknown) {
      console.error('Failed to cancel subscription:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to cancel subscription'
      };
    } finally {
      setCancelingId(null);
    }
  }, [fetchSubscriptions, activeTab]);

  return {
    activeTab,
    setActiveTab,
    data,
    loading,
    error,
    cancelingId,
    fetchSubscriptions,
    handleCancelSubscription,
  };
}