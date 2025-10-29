'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

// 检测是否为移动设备
const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth < 768;
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithTwitter: () => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 处理重定向登录结果
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        // 检查是否有重定向登录标记
        const pendingLogin = localStorage.getItem('pendingRedirectLogin');
        const loginTime = localStorage.getItem('redirectLoginTime');

        console.log('🔄 检查重定向登录结果...');
        console.log('🔄 重定向登录标记:', {
          hasPending: !!pendingLogin,
          loginTime: loginTime ? new Date(parseInt(loginTime)).toISOString() : null,
          timeSince: loginTime ? Date.now() - parseInt(loginTime) : null,
        });
        console.log('🔄 当前 URL:', window.location.href);
        console.log('🔄 URL 参数:', window.location.search);
        console.log('🔄 Auth 对象:', auth);

        const result = await getRedirectResult(auth);

        console.log('🔄 getRedirectResult 返回:', result);

        if (result) {
          console.log('✅ 重定向登录成功', {
            email: result.user.email,
            uid: result.user.uid,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL,
          });

          // 清除标记
          localStorage.removeItem('pendingRedirectLogin');
          localStorage.removeItem('redirectLoginTime');
          console.log('🧹 已清除重定向登录标记');

          // 获取 credential 信息
          const credential = GoogleAuthProvider.credentialFromResult(result);
          console.log('🔑 Credential:', {
            hasCredential: !!credential,
            providerId: credential?.providerId,
          });
        } else {
          if (pendingLogin) {
            console.warn('⚠️ 有重定向登录标记，但 getRedirectResult 返回 null');
            console.warn('⚠️ 可能的原因：');
            console.warn('   1. Firebase 授权域名未配置');
            console.warn('   2. 重定向 URL 不匹配');
            console.warn('   3. 用户取消了授权');

            // 如果超过 5 分钟还没有结果，清除标记
            if (loginTime && Date.now() - parseInt(loginTime) > 5 * 60 * 1000) {
              localStorage.removeItem('pendingRedirectLogin');
              localStorage.removeItem('redirectLoginTime');
              console.log('🧹 已清除过期的重定向登录标记');
            }
          } else {
            console.log('ℹ️ 没有重定向登录结果（正常访问页面）');
          }
        }
      } catch (error) {
        const firebaseError = error as { code?: string; message?: string };
        console.error('❌ 重定向登录失败:', {
          code: firebaseError.code,
          message: firebaseError.message,
          error,
        });

        // 清除标记
        localStorage.removeItem('pendingRedirectLogin');
        localStorage.removeItem('redirectLoginTime');
      }
    };

    handleRedirectResult();
  }, []);

  useEffect(() => {
    console.log('👤 AuthContext: 开始监听认证状态');

    // 监听认证状态变化
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('👤 AuthContext: 认证状态变化', {
        isLoggedIn: !!user,
        email: user?.email,
        uid: user?.uid,
      });

      setUser(user);
      setLoading(false);
    });

    return () => {
      console.log('👤 AuthContext: 停止监听认证状态');
      unsubscribe();
    };
  }, []);

  // Google 登录
  const signInWithGoogle = async () => {
    try {
      console.log('🔐 开始 Google 登录...');
      const provider = new GoogleAuthProvider();

      // 统一使用 popup 模式（因为 redirect 在移动端有问题）
      console.log('🌐 使用 signInWithPopup');
      const result = await signInWithPopup(auth, provider);
      console.log('✅ Google 登录成功', {
        email: result.user.email,
        uid: result.user.uid,
      });
    } catch (error) {
      const firebaseError = error as { code?: string; message?: string };
      console.error('❌ Google 登录失败:', {
        code: firebaseError.code,
        message: firebaseError.message,
        error,
      });
      throw error;
    }
  };

  // Apple 登录
  const signInWithApple = async () => {
    // TODO: 实现 Apple 登录
    console.log('Apple sign in not implemented yet');
  };

  // Twitter 登录
  const signInWithTwitter = async () => {
    // TODO: 实现 Twitter 登录
    console.log('Twitter sign in not implemented yet');
  };

  // 登出
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  // 获取 ID Token（用于后端API认证）
  const getIdToken = async (): Promise<string | null> => {
    if (!user) return null;
    try {
      return await user.getIdToken();
    } catch (error) {
      console.error('Get ID token error:', error);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInWithApple,
        signInWithTwitter,
        signOut,
        getIdToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}