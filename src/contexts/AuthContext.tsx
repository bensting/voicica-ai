'use client';

import { createContext, useContext, ReactNode } from 'react';
import { SessionProvider, useSession, signIn, signOut } from 'next-auth/react';
import type { Session } from 'next-auth';

interface AuthUser {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  // 应用用户信息
  appUserId?: string;
  credits?: number;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthContextProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const loading = status === 'loading';

  // 转换 session 到 user 对象
  const user: AuthUser | null = session?.user
    ? {
        id: session.user.id!,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        appUserId: (session.user as any).appUserId,
        credits: (session.user as any).credits,
      }
    : null;

  // Google 登录
  const signInWithGoogle = async () => {
    try {
      console.log('🔐 开始 Google 登录...');
      await signIn('google', { callbackUrl: '/studio/tts' });
    } catch (error) {
      console.error('❌ Google 登录失败:', error);
      throw error;
    }
  };

  // Apple 登录
  const signInWithApple = async () => {
    try {
      console.log('🔐 开始 Apple 登录...');
      await signIn('apple', { callbackUrl: '/studio/tts' });
    } catch (error) {
      console.error('❌ Apple 登录失败:', error);
      throw error;
    }
  };

  // 登出
  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInWithApple,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthContextProvider>{children}</AuthContextProvider>
    </SessionProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// 导出 Session 类型供其他文件使用
export type { Session };
