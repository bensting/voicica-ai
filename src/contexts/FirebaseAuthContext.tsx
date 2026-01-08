'use client';

/**
 * Firebase Auth Context
 *
 * 提供 Firebase 认证状态和方法给整个应用
 * - 监听登录状态变化
 * - 自动获取和刷新 ID Token
 * - 提供登录/登出方法
 * - 支持多种登录方式（Google, Apple, Twitter等）
 * - 在 Capacitor 原生应用中使用原生登录（避免 WebView 限制）
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  signInWithPopup,
  signInWithRedirect,
  signInWithCredential,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  TwitterAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  type User,
  type AuthProvider,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { isInAppBrowser, isCapacitorNative } from '@/config/inAppBrowser';
import { useLanguage } from '@/contexts/LanguageContext';

// Capacitor Firebase Auth 插件（仅在原生环境中使用）
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

interface SignUpResult {
  success: boolean;
  verificationEmailSent?: boolean;
}

interface FirebaseAuthContextType {
  user: User | null;
  loading: boolean;
  token: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithTwitter: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<SignUpResult>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const { locale } = useLanguage();

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
   * 检查是否为用户取消登录的错误
   */
  const isUserCancelledError = (error: unknown): boolean => {
    const err = error as { code?: string; message?: string };
    const cancelCodes = [
      'auth/popup-closed-by-user',
      'auth/cancelled-popup-request',
      'auth/user-cancelled',
      '12501', // Google Sign-In cancelled on Android
      'SIGN_IN_CANCELLED',
    ];
    return cancelCodes.some(code =>
      err?.code === code ||
      err?.message?.includes(code) ||
      err?.message?.includes('cancelled') ||
      err?.message?.includes('canceled')
    );
  };

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
      // 用户取消登录，静默处理，不抛出错误
      if (isUserCancelledError(error)) {
        console.log(`[FirebaseAuth] 用户取消了 ${providerName} 登录`);
        return;
      }
      console.error(`[FirebaseAuth] ${providerName} 登录失败:`, error);
      throw error;
    }
  }, []);

  // Google 登录
  const signInWithGoogle = useCallback(async () => {
    // 检测是否在原生环境
    const isNative = isCapacitorNative();
    console.log('[FirebaseAuth] isCapacitorNative():', isNative);
    console.log('[FirebaseAuth] User-Agent:', typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A');

    // 在 Capacitor 原生环境中使用原生登录
    if (isNative) {
      try {
        console.log('[FirebaseAuth] 使用原生 Google 登录...');
        const result = await FirebaseAuthentication.signInWithGoogle();
        console.log('[FirebaseAuth] 原生登录返回结果:', JSON.stringify(result, null, 2));

        // 使用返回的 credential 在 Firebase Web SDK 中认证
        if (result.credential?.idToken) {
          console.log('[FirebaseAuth] 获取到 idToken，正在认证...');
          const credential = GoogleAuthProvider.credential(result.credential.idToken);
          await signInWithCredential(auth, credential);
          console.log('[FirebaseAuth] 原生 Google 登录成功');
        } else {
          console.error('[FirebaseAuth] 未获取到 idToken');
          throw new Error('No idToken returned from native sign-in');
        }
      } catch (error: unknown) {
        // 用户取消登录，静默处理
        if (isUserCancelledError(error)) {
          console.log('[FirebaseAuth] 用户取消了原生 Google 登录');
          return;
        }
        const err = error as { code?: string; message?: string };
        console.error('[FirebaseAuth] 原生 Google 登录失败:');
        console.error('  - Error:', error);
        console.error('  - Code:', err?.code);
        console.error('  - Message:', err?.message);
        throw error;
      }
      return;
    }

    // Web 环境使用 popup/redirect 方式
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

  // Facebook 登录
  const signInWithFacebook = useCallback(async () => {
    const provider = new FacebookAuthProvider();
    provider.addScope('email');
    await signInWithProvider(provider, 'Facebook');
  }, [signInWithProvider]);

  // 邮箱密码登录
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('[FirebaseAuth] 邮箱登录成功');
    } catch (error) {
      console.error('[FirebaseAuth] 邮箱登录失败:', error);
      throw error;
    }
  }, []);

  // 邮箱密码注册（注册后发送验证邮件，用户需要验证后才能登录）
  const signUpWithEmail = useCallback(async (email: string, password: string): Promise<SignUpResult> => {
    // 创建用户
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // 设置邮件语言
    const languageCodeMap: Record<string, string> = {
      'en-US': 'en',
      'zh-CN': 'zh-CN',
      'zh-TW': 'zh-TW',
      'th-TH': 'th',
    };
    auth.languageCode = languageCodeMap[locale] || 'en';

    // 尝试发送验证邮件（失败也继续，用户可以在登录时重新发送）
    let emailSent = false;
    try {
      await sendEmailVerification(userCredential.user);
      emailSent = true;
      console.log('[FirebaseAuth] 邮箱注册成功，验证邮件已发送');
    } catch (err) {
      console.warn('[FirebaseAuth] 验证邮件发送失败，用户可在登录时重试:', err);
    }

    // 注册后立即登出，要求用户验证邮箱后才能登录
    await firebaseSignOut(auth);

    // 返回成功结果
    return { success: true, verificationEmailSent: emailSent };
  }, [locale]);

  // 发送密码重置邮件
  const resetPassword = useCallback(async (email: string) => {
    try {
      // 将 locale 转换为 Firebase 支持的语言代码
      // 'en-US' -> 'en', 'zh-CN' -> 'zh-CN', 'zh-TW' -> 'zh-TW', 'th-TH' -> 'th'
      const languageCodeMap: Record<string, string> = {
        'en-US': 'en',
        'zh-CN': 'zh-CN',
        'zh-TW': 'zh-TW',
        'th-TH': 'th',
      };

      const firebaseLanguageCode = languageCodeMap[locale] || 'en';

      // 设置邮件语言
      auth.languageCode = firebaseLanguageCode;

      // 发送密码重置邮件
      // 邮件链接会使用 Firebase Console 中配置的"操作网址"
      await sendPasswordResetEmail(auth, email);
      console.log(`[FirebaseAuth] 密码重置邮件已发送 (语言: ${firebaseLanguageCode})`);
    } catch (error) {
      console.error('[FirebaseAuth] 发送密码重置邮件失败:', error);
      throw error;
    }
  }, [locale]);

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
    signInWithFacebook,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
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