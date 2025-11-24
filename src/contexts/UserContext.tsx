'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useFirebaseAuth } from './FirebaseAuthContext';
import { getCurrentUserProfile } from '@/actions/user';
import type { UserProfile } from '@/types/user';

interface UserContextType {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  refreshProfileSilent: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

/**
 * UserProvider
 *
 * 职责：
 * - 管理后端用户数据
 * - 自动同步 Firebase 用户和后端用户
 * - 提供刷新用户数据的方法
 */
export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useFirebaseAuth();

  // 获取用户资料（带重试机制）
  const fetchProfile = async (retryCount = 0) => {
    if (!user) {
      setProfile(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('📡 UserContext: 调用 Server Action getCurrentUserProfile');

      const userData = await getCurrentUserProfile();

      console.log('✅ UserContext: 用户数据获取成功', userData);
      setProfile(userData);
    } catch (err) {
      const error = err as Error;
      console.error('❌ UserContext: 后端 API 调用失败', error);

      // 如果是"未登录"错误，可能是 cookie 还未就绪，自动重试一次
      if (error.message === '未登录' && retryCount < 2) {
        console.log(`⚠️ UserContext: Token 可能尚未就绪，${retryCount + 1} 秒后重试...`);
        setTimeout(() => {
          fetchProfile(retryCount + 1);
        }, (retryCount + 1) * 500);
        return;
      }

      if (error.message === '未登录') {
        setProfile(null);
        setError(null);
      } else {
        setError(error.message || '获取用户信息失败');
      }
    } finally {
      setLoading(false);
    }
  };

  // 静默刷新用户资料（不显示 loading 状态）
  const fetchProfileSilent = async () => {
    if (!user) {
      return;
    }

    try {
      console.log('📡 UserContext: 静默刷新用户数据');
      const userData = await getCurrentUserProfile();
      console.log('✅ UserContext: 静默刷新成功', userData);
      setProfile(userData);
    } catch (err) {
      console.error('❌ UserContext: 静默刷新失败', err);
      // 静默刷新失败时不改变状态，保持现有数据
    }
  };

  // 等待认证完成后再获取用户数据
  useEffect(() => {
    // 只在认证状态确定后才执行
    if (!authLoading) {
      if (user) {
        console.log('👤 认证完成，获取用户数据...');
        // 延迟一小段时间确保 cookie 已设置
        const timer = setTimeout(() => {
          fetchProfile();
        }, 100);
        return () => clearTimeout(timer);
      } else {
        console.log('👤 认证完成，用户未登录');
        setProfile(null);
        setError(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  return (
    <UserContext.Provider
      value={{
        profile,
        loading,
        error,
        refreshProfile: fetchProfile,
        refreshProfileSilent: fetchProfileSilent,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}