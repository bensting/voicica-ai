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
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  TwitterAuthProvider,
  OAuthProvider,
  type User,
  type AuthProvider,
} from 'firebase/auth';

/**
 * 检测是否在应用内浏览器（LINE、微信、Facebook 等）
 * 这些浏览器通常会阻止弹出窗口
 */
function isInAppBrowser(): boolean {
  if (typeof window === 'undefined') return false;

  const ua = navigator.userAgent.toLowerCase();
  return (
    ua.includes('line') ||
    ua.includes('wechat') ||
    ua.includes('micromessenger') ||
    ua.includes('fban') || // Facebook App
    ua.includes('fbav') || // Facebook App
    ua.includes('instagram') ||
    ua.includes('twitter') ||
    // 通用检测：standalone webview
    (ua.includes('mobile') && !ua.includes('safari') && ua.includes('applewebkit'))
  );
}

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

  // 处理 redirect 登录结果（应用内浏览器使用 redirect 方式）
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          console.log('[FirebaseAuth] Redirect 登录成功');
        }
      })
      .catch((error) => {
        console.error('[FirebaseAuth] Redirect 登录失败:', error);
      });
  }, []);

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
        // 先清除 token cookie，确保后续请求不会携带旧 token
        try {
          await fetch('/api/auth/set-token', { method: 'DELETE' });
        } catch (err) {
          console.error('[FirebaseAuth] 清除 cookie 失败:', err);
        }

        // cookie 清除完成后再更新状态
        setUser(null);
        setToken(null);
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

  /**
   * 通用登录方法：自动选择 popup 或 redirect 方式
   * - 普通浏览器使用 popup（体验更好）
   * - 应用内浏览器使用 redirect（避免被阻止）
   */
  const signInWithProvider = useCallback(async (provider: AuthProvider, providerName: string) => {
    try {
      if (isInAppBrowser()) {
        console.log(`[FirebaseAuth] 检测到应用内浏览器，使用 redirect 方式登录 ${providerName}`);
        await signInWithRedirect(auth, provider);
      } else {
        await signInWithPopup(auth, provider);
      }
    } catch (error) {
      console.error(`[FirebaseAuth] ${providerName} 登录失败:`, error);
      throw error;
    }
  }, []);

  // Google 登录
  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account',
    });
    await signInWithProvider(provider, 'Google');
  }, [signInWithProvider]);

  // Twitter 登录
  const signInWithTwitter = useCallback(async () => {
    const provider = new TwitterAuthProvider();
    await signInWithProvider(provider, 'Twitter');
  }, [signInWithProvider]);

  // Apple 登录
  const signInWithApple = useCallback(async () => {
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');
    await signInWithProvider(provider, 'Apple');
  }, [signInWithProvider]);

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