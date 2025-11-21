'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { getUnifiedCredits, getUserCredits } from '@/actions/user';

/**
 * Credits Context 状态
 */
interface CreditsContextState {
  credits: number;
  loading: boolean;
  error: string | null;
  refreshCredits: () => Promise<void>;
  deductCredits: (amount: number) => void;
  updateCredits: (newCredits: number) => void;
}

const CreditsContext = createContext<CreditsContextState | undefined>(undefined);

interface CreditsProviderProps {
  children: React.ReactNode;
}

/**
 * Credits Provider
 *
 * 统一管理用户积分状态，支持：
 * - 自动获取积分
 * - 手动刷新
 * - 本地乐观更新（生成后立即扣减）
 */
export function CreditsProvider({ children }: CreditsProviderProps) {
  const { user, loading: authLoading } = useFirebaseAuth();
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取积分
  const fetchCredits = useCallback(async () => {
    // 确保认证已完成
    if (authLoading) {
      console.log('⏳ 认证尚未完成，跳过积分获取');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 根据用户登录状态选择不同的 API
      // 已登录: 使用 getUserCredits (严格要求 Firebase 认证,不降级)
      // 未登录: 使用 getUnifiedCredits (允许降级到匿名用户)
      if (user) {
        console.log('💳 [CreditsContext] Firebase 用户已登录,获取正式用户积分');
        const response = await getUserCredits();
        setCredits(response.credits);

        console.log('✅ 积分获取成功 (正式用户):', {
          credits: response.credits,
          total_used: response.total_used,
        });
      } else {
        console.log('💳 [CreditsContext] 未登录,尝试获取匿名用户积分');
        const response = await getUnifiedCredits();
        setCredits(response.credits);

        console.log('✅ 积分获取成功 (匿名用户):', {
          credits: response.credits,
          total_used: response.total_used,
          is_anonymous: response.is_anonymous,
          expires_at: response.expires_at,
        });
      }
    } catch (err) {
      const error = err as Error;
      console.error('❌ 获取积分失败:', err);

      // 如果是"未提供认证信息"或"未登录"错误，静默处理
      if (error.message === '未提供认证信息' || error.message === '未登录') {
        console.log('⚠️ CreditsContext: 认证信息未就绪，将在下次重试');
        setCredits(0);
        setError(null);
      } else {
        setError('Failed to fetch credits');
        setCredits(0);
      }
    } finally {
      setLoading(false);
    }
  }, [authLoading, user]);

  // 刷新积分（供外部调用）
  const refreshCredits = useCallback(async () => {
    await fetchCredits();
  }, [fetchCredits]);

  // 本地扣减积分（乐观更新）
  const deductCredits = useCallback((amount: number) => {
    setCredits((prev) => Math.max(0, prev - amount));
    console.log(`💰 本地扣减积分: -${amount}`);
  }, []);

  // 直接更新积分
  const updateCredits = useCallback((newCredits: number) => {
    setCredits(newCredits);
    console.log(`💰 积分更新: ${newCredits}`);
  }, []);

  // 等待认证完成后再获取积分
  // 使用 useRef 追踪上一次的 user.uid，避免重复请求
  // 使用特殊标记 'NOT_INITIALIZED' 区分"未初始化"和"匿名用户(null)"
  const lastUserIdRef = useRef<string | null | 'NOT_INITIALIZED'>('NOT_INITIALIZED');

  useEffect(() => {
    // 只在认证状态确定后（authLoading = false）才获取积分
    if (authLoading) return;

    const currentUserId = user?.uid ?? null;

    // 如果用户没变化，不重复请求（但首次必须请求）
    if (lastUserIdRef.current !== 'NOT_INITIALIZED' && currentUserId === lastUserIdRef.current) {
      return;
    }

    lastUserIdRef.current = currentUserId;
    console.log('💳 认证完成，获取积分...', { isLoggedIn: !!user, userId: currentUserId });
    void fetchCredits();
  }, [fetchCredits, user, authLoading]);

  const value: CreditsContextState = {
    credits,
    loading,
    error,
    refreshCredits,
    deductCredits,
    updateCredits,
  };

  return <CreditsContext.Provider value={value}>{children}</CreditsContext.Provider>;
}

/**
 * Use Credits Hook
 */
export function useCredits() {
  const context = useContext(CreditsContext);
  if (context === undefined) {
    throw new Error('useCredits must be used within a CreditsProvider');
  }
  return context;
}
