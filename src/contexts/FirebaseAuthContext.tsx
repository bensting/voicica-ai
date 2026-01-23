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
 * - 支持账户关联（同一邮箱的不同登录方式自动关联）
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
  linkWithCredential,
  GoogleAuthProvider,
  TwitterAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  type User,
  type AuthProvider,
  type AuthCredential,
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

/**
 * 账户关联状态
 * 当用户尝试用社交登录，但该邮箱已存在邮箱密码账户时触发
 */
interface AccountLinkingState {
  email: string;
  credential: AuthCredential;
  providerName: string;
}

interface FirebaseAuthContextType {
  user: User | null;
  loading: boolean;
  token: string | null;
  // 注册中标志（用于防止其他 hooks 在注册过程中响应临时的认证状态变化）
  isRegistering: boolean;
  // 账户关联状态
  accountLinking: AccountLinkingState | null;
  // 登录方法
  signInWithGoogle: () => Promise<void>;
  signInWithTwitter: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<SignUpResult>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  // 账户关联方法
  linkAccountWithPassword: (password: string) => Promise<void>;
  cancelAccountLinking: () => void;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [accountLinking, setAccountLinking] = useState<AccountLinkingState | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  // 使用 ref 来同步检查注册状态，因为 state 更新是异步的
  // onAuthStateChanged 可能在 state 传播到子组件之前就触发
  const isRegisteringRef = React.useRef(false);
  // 用于处理异步竞态条件的版本计数器
  // 当检测到邮箱未验证需要登出时，增加版本号
  // onAuthStateChanged 完成异步操作后检查版本号，如果不匹配则跳过状态更新
  const authStateVersionRef = React.useRef(0);
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
      // 注册过程中跳过状态更新
      // createUserWithEmailAndPassword 会短暂登录用户，然后我们立即登出
      // 在这期间不应该更新 user 状态，避免触发其他 context 的副作用
      if (isRegisteringRef.current) {
        console.log('[FirebaseAuth] 注册中，跳过 onAuthStateChanged 状态更新');
        return;
      }

      // 捕获当前版本号，用于检测异步操作期间是否有新的认证状态变化
      const currentVersion = authStateVersionRef.current;

      if (firebaseUser) {
        // 强制刷新 token，确保获取最新的有效 token
        const idToken = await firebaseUser.getIdToken(true);

        // 检查版本号是否变化（如果变化说明有新的登录/登出操作，跳过本次更新）
        if (authStateVersionRef.current !== currentVersion) {
          console.log('[FirebaseAuth] 检测到版本变化，跳过过期的状态更新');
          return;
        }

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

        // 再次检查版本号
        if (authStateVersionRef.current !== currentVersion) {
          console.log('[FirebaseAuth] 检测到版本变化，跳过过期的状态更新');
          return;
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

        // 检查版本号
        if (authStateVersionRef.current !== currentVersion) {
          console.log('[FirebaseAuth] 检测到版本变化，跳过过期的状态更新');
          return;
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
   * 检查是否为账户已存在的错误（需要关联账户）
   */
  const isAccountExistsError = (error: unknown): boolean => {
    const err = error as { code?: string };
    return err?.code === 'auth/account-exists-with-different-credential';
  };

  /**
   * 从错误中提取凭据信息
   */
  const extractCredentialFromError = (error: unknown, providerName: string): { email: string; credential: AuthCredential } | null => {
    const err = error as {
      customData?: { email?: string };
      credential?: AuthCredential;
    };

    const email = err?.customData?.email;

    // 根据 provider 类型获取 credential
    let credential: AuthCredential | null = null;
    if (providerName === 'Google') {
      credential = GoogleAuthProvider.credentialFromError(error as Parameters<typeof GoogleAuthProvider.credentialFromError>[0]);
    } else if (providerName === 'Facebook') {
      credential = FacebookAuthProvider.credentialFromError(error as Parameters<typeof FacebookAuthProvider.credentialFromError>[0]);
    } else if (providerName === 'Twitter') {
      credential = TwitterAuthProvider.credentialFromError(error as Parameters<typeof TwitterAuthProvider.credentialFromError>[0]);
    } else if (providerName === 'Apple') {
      credential = OAuthProvider.credentialFromError(error as Parameters<typeof OAuthProvider.credentialFromError>[0]);
    }

    if (email && credential) {
      return { email, credential };
    }
    return null;
  };

  /**
   * 通用登录方法：自动选择 popup 或 redirect 方式
   * - 普通浏览器使用 popup（体验更好）
   * - 应用内浏览器使用 redirect（避免被阻止）
   * - 处理账户关联场景
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

      // 检测账户已存在错误（需要关联）
      if (isAccountExistsError(error)) {
        const extracted = extractCredentialFromError(error, providerName);
        if (extracted) {
          console.log(`[FirebaseAuth] 检测到账户冲突，邮箱 ${extracted.email} 已存在，需要关联账户`);
          setAccountLinking({
            email: extracted.email,
            credential: extracted.credential,
            providerName,
          });
          return; // 不抛出错误，让 UI 显示关联弹窗
        }
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
      // 重试逻辑：Capacitor 插件可能在第一次调用时还未完全初始化
      const maxRetries = 2;
      let lastError: unknown = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`[FirebaseAuth] 使用原生 Google 登录... (尝试 ${attempt}/${maxRetries})`);

          // 首次尝试前短暂延迟，确保插件初始化完成
          if (attempt === 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          const result = await FirebaseAuthentication.signInWithGoogle();
          console.log('[FirebaseAuth] 原生登录返回结果:', JSON.stringify(result, null, 2));

          // 使用返回的 credential 在 Firebase Web SDK 中认证
          if (result.credential?.idToken) {
            console.log('[FirebaseAuth] 获取到 idToken，正在认证...');
            const credential = GoogleAuthProvider.credential(result.credential.idToken);
            await signInWithCredential(auth, credential);
            console.log('[FirebaseAuth] 原生 Google 登录成功');
            return; // 成功，退出循环
          } else {
            console.error('[FirebaseAuth] 未获取到 idToken');
            throw new Error('No idToken returned from native sign-in');
          }
        } catch (error: unknown) {
          // 用户取消登录，静默处理，不重试
          if (isUserCancelledError(error)) {
            console.log('[FirebaseAuth] 用户取消了原生 Google 登录');
            return;
          }

          lastError = error;
          const err = error as { code?: string; message?: string };
          console.error(`[FirebaseAuth] 原生 Google 登录失败 (尝试 ${attempt}/${maxRetries}):`);
          console.error('  - Error:', error);
          console.error('  - Code:', err?.code);
          console.error('  - Message:', err?.message);

          // 如果还有重试机会，等待后重试
          if (attempt < maxRetries) {
            console.log('[FirebaseAuth] 等待后重试...');
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }

      // 所有重试都失败了
      throw lastError;
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
  // 检查邮箱是否已验证，未验证则不允许登录
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // 检查邮箱是否已验证
      if (!userCredential.user.emailVerified) {
        console.log('[FirebaseAuth] 邮箱未验证，尝试重新发送验证邮件并登出');

        // 增加版本号，使正在进行的 onAuthStateChanged 异步操作失效
        // 这样即使登录触发的 onAuthStateChanged 还在处理中，也会因为版本号不匹配而跳过状态更新
        authStateVersionRef.current += 1;
        console.log('[FirebaseAuth] 增加版本号:', authStateVersionRef.current);

        // 尝试重新发送验证邮件（忽略错误，可能是请求太频繁）
        try {
          await sendEmailVerification(userCredential.user);
          console.log('[FirebaseAuth] 验证邮件已重新发送');
        } catch (err) {
          console.warn('[FirebaseAuth] 重新发送验证邮件失败（可能请求太频繁）:', err);
        }

        // 登出用户
        await firebaseSignOut(auth);

        // 抛出自定义错误
        const error = new Error('Email not verified') as Error & { code: string };
        error.code = 'auth/email-not-verified';
        throw error;
      }

      console.log('[FirebaseAuth] 邮箱登录成功');
    } catch (error) {
      // 邮箱未验证是预期的业务逻辑错误，不需要 error 级别
      const err = error as { code?: string };
      if (err?.code === 'auth/email-not-verified') {
        console.log('[FirebaseAuth] 邮箱登录被拒绝：邮箱未验证');
      } else {
        console.error('[FirebaseAuth] 邮箱登录失败:', error);
      }
      throw error;
    }
  }, []);

  // 邮箱密码注册（注册后发送验证邮件，用户需要验证后才能登录）
  // 注意：createUserWithEmailAndPassword 会自动登录用户，然后我们立即登出
  // 设置 isRegistering 标志防止其他 hooks 响应这个临时的认证状态变化
  const signUpWithEmail = useCallback(async (email: string, password: string): Promise<SignUpResult> => {
    // 同时设置 ref 和 state，ref 用于同步检查（onAuthStateChanged 中），state 用于通知子组件
    isRegisteringRef.current = true;
    setIsRegistering(true);

    try {
      // 创建用户（Firebase 会自动登录）
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
    } finally {
      // 确保无论成功还是失败都清除注册中标志
      isRegisteringRef.current = false;
      setIsRegistering(false);
    }
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

  /**
   * 使用密码关联账户
   * 当用户尝试用社交登录，但邮箱已存在邮箱密码账户时调用
   * 1. 先用邮箱密码登录
   * 2. 然后关联社交账户凭据
   * 3. 完成后，两种方式都可以登录
   */
  const linkAccountWithPassword = useCallback(async (password: string) => {
    if (!accountLinking) {
      throw new Error('No account linking in progress');
    }

    const { email, credential, providerName } = accountLinking;

    try {
      // 1. 先用邮箱密码登录
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('[FirebaseAuth] 邮箱密码登录成功，准备关联账户');

      // 2. 关联社交账户凭据
      await linkWithCredential(userCredential.user, credential);
      console.log(`[FirebaseAuth] 账户关联成功！${providerName} 已关联到 ${email}`);

      // 3. 清除关联状态
      setAccountLinking(null);
    } catch (error) {
      console.error('[FirebaseAuth] 账户关联失败:', error);
      throw error;
    }
  }, [accountLinking]);

  /**
   * 取消账户关联
   */
  const cancelAccountLinking = useCallback(() => {
    setAccountLinking(null);
  }, []);

  const value: FirebaseAuthContextType = {
    user,
    loading,
    token,
    isRegistering,
    accountLinking,
    signInWithGoogle,
    signInWithTwitter,
    signInWithApple,
    signInWithFacebook,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    signOut,
    linkAccountWithPassword,
    cancelAccountLinking,
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