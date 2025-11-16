'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api/client';
import { useCreditsSSE } from '@/hooks/useCreditsSSE';

/**
 * 用户积分响应接口
 */
interface CreditsResponse {
  credits: number;
  total_used: number;
  is_anonymous: boolean;
  expires_at: string | null;
}

/**
 * Credits Context 状态
 */
interface CreditsContextState {
  credits: number;
  loading: boolean;
  error: string | null;
  refreshCredits: () => Promise<void>;
  deductCredits: (amount: number) => void;
}

const CreditsContext = createContext<CreditsContextState | undefined>(undefined);

/**
 * Credits Provider
 *
 * 统一管理用户积分状态，支持：
 * - 自动获取积分
 * - 手动刷新
 * - 本地乐观更新（生成后立即扣减）
 */
export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取积分
  const fetchCredits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get<CreditsResponse>('/api/v1/users/credits');
      setCredits(response.credits);

      console.log('✅ 积分获取成功:', {
        credits: response.credits,
        total_used: response.total_used,
        is_anonymous: response.is_anonymous,
        expires_at: response.expires_at,
      });
    } catch (err) {
      console.error('❌ 获取积分失败:', err);
      setError('Failed to fetch credits');
      setCredits(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // 刷新积分（供外部调用）
  const refreshCredits = useCallback(async () => {
    await fetchCredits();
  }, [fetchCredits]);

  // 本地扣减积分（乐观更新）
  const deductCredits = useCallback((amount: number) => {
    setCredits((prev) => Math.max(0, prev - amount));
    console.log(`💰 本地扣减积分: -${amount}`);
  }, []);

  // 等待认证完成后再获取积分
  useEffect(() => {
    // 只在认证状态确定后（authLoading = false）才获取积分
    if (!authLoading) {
      console.log('💳 认证完成，获取积分...', { isLoggedIn: !!user });
      void fetchCredits();
    }
  }, [fetchCredits, user, authLoading]);

  // SSE 实时推送积分更新
  const handleCreditsUpdate = useCallback((newCredits: number) => {
    console.log('💰 [SSE] 积分实时更新:', newCredits);
    setCredits(newCredits);
  }, []);

  useCreditsSSE({
    onCreditsUpdate: handleCreditsUpdate,
    enabled: !authLoading, // 认证完成后才启用SSE
  });

  const value: CreditsContextState = {
    credits,
    loading,
    error,
    refreshCredits,
    deductCredits,
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