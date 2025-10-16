'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { userAPI } from '@/services/api';

/**
 * 后端用户数据接口
 */
interface UserProfile {
  id: string;
  email: string | null;
  name: string | null;
  photo_url: string | null;
  credits: number;
  total_credits_used: number;
  subscription_status: string;
  product_id: string | null;
  base_plan_id: string | null;
  purchase_token: string | null;
  expiry_time: string | null;
  next_billing_date: string | null;
}

interface UserContextType {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
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
  const { user } = useAuth();

  // 获取用户资料
  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('📡 UserContext: 调用后端 API /api/v1/users/me');

      const userData = await userAPI.getCurrentUser();

      console.log('✅ UserContext: 后端用户数据获取成功', userData);
      setProfile(userData as UserProfile);
    } catch (err) {
      const error = err as Error;
      console.error('❌ UserContext: 后端 API 调用失败', error);
      setError(error.message || '获取用户信息失败');
    } finally {
      setLoading(false);
    }
  };

  // 当 Firebase 用户状态变化时，自动获取后端用户数据
  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <UserContext.Provider
      value={{
        profile,
        loading,
        error,
        refreshProfile: fetchProfile,
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