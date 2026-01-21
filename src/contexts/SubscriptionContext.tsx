'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useFirebaseAuth } from './FirebaseAuthContext';
import { getMyActiveSubscription } from '@/actions/subscription';
import type { UserSubscription } from '@/types/subscription';

interface SubscriptionContextType {
  /** 当前活跃订阅 */
  activeSubscription: UserSubscription | null;
  /** 是否有活跃订阅 */
  isSubscribed: boolean;
  /** 是否正在加载 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 刷新订阅状态 */
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

/**
 * SubscriptionProvider
 *
 * 职责：
 * - 管理用户订阅状态
 * - 在用户登录后自动获取订阅信息
 * - 提供订阅状态刷新方法
 */
export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [activeSubscription, setActiveSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useFirebaseAuth();

  // 获取订阅状态
  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setActiveSubscription(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('📡 SubscriptionContext: 获取订阅状态');
      const subscription = await getMyActiveSubscription();

      console.log('✅ SubscriptionContext: 订阅状态获取成功', subscription ? '有订阅' : '无订阅');
      setActiveSubscription(subscription);
    } catch (err) {
      const error = err as Error;
      console.error('❌ SubscriptionContext: 获取订阅状态失败', error);

      // 如果是未登录错误，清空订阅状态
      if (error.message === '未登录') {
        setActiveSubscription(null);
        setError(null);
      } else {
        setError(error.message || '获取订阅状态失败');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 用户登录状态变化时获取订阅
  useEffect(() => {
    if (authLoading) return;

    if (user) {
      // 延迟一小段时间确保 cookie 已设置
      const timer = setTimeout(() => {
        fetchSubscription();
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setActiveSubscription(null);
      setError(null);
    }
  }, [user, authLoading, fetchSubscription]);

  return (
    <SubscriptionContext.Provider
      value={{
        activeSubscription,
        isSubscribed: !!activeSubscription,
        loading,
        error,
        refreshSubscription: fetchSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
