'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { getUnifiedCredits } from '@/actions/user';

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
 * - 从 UserContext 获取已登录用户的积分（避免重复请求）
 * - 匿名用户单独获取积分
 * - 手动刷新
 * - 本地乐观更新（生成后立即扣减）
 */
export function CreditsProvider({ children }: CreditsProviderProps) {
  const { user, loading: authLoading } = useFirebaseAuth();
  const { profile, loading: profileLoading, refreshProfile } = useUser();
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 标记是否使用本地覆盖值（用于乐观更新）
  const [localOverride, setLocalOverride] = useState<number | null>(null);

  // 获取匿名用户积分
  const fetchAnonymousCredits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getUnifiedCredits();
      setCredits(response.credits);
    } catch (err) {
      const error = err as Error;
      if (error.message !== '未提供认证信息' && error.message !== '未登录') {
        console.error('[CreditsContext] Failed to fetch anonymous credits:', err);
        setError('Failed to fetch credits');
      }
      setCredits(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // 已登录用户：直接从 UserContext 的 profile 获取积分
  // 这样避免了重复的 API 请求
  useEffect(() => {
    if (authLoading || profileLoading) {
      setLoading(true);
      return;
    }

    // 已登录用户：从 profile 获取积分
    if (user && profile) {
      // 如果没有本地覆盖值，使用 profile 中的积分
      if (localOverride === null) {
        setCredits(profile.credits);
      }
      setLoading(false);
      setError(null);
      return;
    }

    // 已登录但 profile 还没加载完：等待 profile
    if (user && !profile) {
      setLoading(true);
      return;
    }

    // 未登录用户：需要单独获取匿名用户积分
    // 延迟一小段时间确保 cookie 已设置
    if (!user && !authLoading) {
      const timer = setTimeout(() => {
        fetchAnonymousCredits();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, profile, authLoading, profileLoading, localOverride, fetchAnonymousCredits]);

  // 刷新积分（供外部调用）
  const refreshCredits = useCallback(async () => {
    // 清除本地覆盖值
    setLocalOverride(null);

    if (user) {
      // 已登录用户：刷新 UserContext 的 profile
      await refreshProfile();
    } else {
      // 匿名用户：重新获取
      await fetchAnonymousCredits();
    }
  }, [user, refreshProfile, fetchAnonymousCredits]);

  // 本地扣减积分（乐观更新）
  const deductCredits = useCallback((amount: number) => {
    setCredits((prev) => {
      const newValue = Math.max(0, prev - amount);
      setLocalOverride(newValue);
      return newValue;
    });
  }, []);

  // 直接更新积分
  const updateCredits = useCallback((newCredits: number) => {
    setCredits(newCredits);
    setLocalOverride(newCredits);
  }, []);

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
