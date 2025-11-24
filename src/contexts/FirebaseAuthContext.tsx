'use client';

/**
 * Firebase Auth Context
 *
 * 提供 Firebase 认证状态和方法给整个应用
 * - 监听登录状态变化
 * - 自动获取和刷新 ID Token
 * - 提供登录/登出方法
 * - 支持多种登录方式（Google, Apple, Twitter等）
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  TwitterAuthProvider,
  OAuthProvider,
  type User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface FirebaseAuthContextType {
  user: User | null;
  loading: boolean;
  token: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithTwitter: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // 监听认证状态变化
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // 强制刷新 token，确保获取最新的有效 token
        const idToken = await firebaseUser.getIdToken(true);

        // 先设置 cookie，确保服务端能验证 token
        try {
          await fetch('/api/auth/set-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: idToken }),
          });
        } catch (err) {
          console.error('[FirebaseAuth] 设置 cookie 失败:', err);
        }

        // cookie 设置完成后，再更新状态（这样 UserContext 获取数据时 cookie 已就绪）
        setUser(firebaseUser);
        setToken(idToken);
      } else {
        setUser(null);
        setToken(null);

        // 清除 token cookie
        fetch('/api/auth/set-token', { method: 'DELETE' }).catch(() => {});
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 自动刷新 token（每 55 分钟刷新一次，token 默认 1 小时过期）
  useEffect(() => {
    if (!user) return;

    const refreshToken = async () => {
      try {
        const idToken = await user.getIdToken(true); // force refresh
        setToken(idToken);

        // 通过 API 更新 cookie
        await fetch('/api/auth/set-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: idToken }),
        });
        console.log('🔐 [FirebaseAuth] Token 定时刷新成功');
      } catch (error) {
        console.error('[FirebaseAuth] Token 刷新失败:', error);
      }
    };

    // 每 55 分钟刷新一次
    const interval = setInterval(refreshToken, 55 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  // Google 登录
  const signInWithGoogle = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account',
      });
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('[FirebaseAuth] Google 登录失败:', error);
      throw error;
    }
  }, []);

  // Twitter 登录
  const signInWithTwitter = useCallback(async () => {
    try {
      const provider = new TwitterAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('[FirebaseAuth] Twitter 登录失败:', error);
      throw error;
    }
  }, []);

  // Apple 登录
  const signInWithApple = useCallback(async () => {
    try {
      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('[FirebaseAuth] Apple 登录失败:', error);
      throw error;
    }
  }, []);

  // 登出
  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('[FirebaseAuth] 登出失败:', error);
      throw error;
    }
  }, []);

  const value: FirebaseAuthContextType = {
    user,
    loading,
    token,
    signInWithGoogle,
    signInWithTwitter,
    signInWithApple,
    signOut,
  };

  return <FirebaseAuthContext.Provider value={value}>{children}</FirebaseAuthContext.Provider>;
}

export function useFirebaseAuth() {
  const context = useContext(FirebaseAuthContext);
  if (context === undefined) {
    throw new Error('useFirebaseAuth must be used within FirebaseAuthProvider');
  }
  return context;
}