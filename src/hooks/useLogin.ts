import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/**
 * 登录业务逻辑 Hook
 *
 * 职责：
 * - 管理登录状态（loading, error）
 * - 处理登录逻辑
 * - 处理已登录用户重定向
 * - 检测是否为回访用户
 *
 * Note: Removed useSearchParams to avoid SSR issues.
 * Use window.location.search for client-side params.
 */
export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReturningUser, setIsReturningUser] = useState(false);

  const { user, signInWithGoogle, signInWithApple, signInWithTwitter } = useAuth();
  const router = useRouter();

  // 检测回访用户
  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisited');
    const lastLoginEmail = localStorage.getItem('lastLoginEmail');

    if (hasVisited || lastLoginEmail) {
      setIsReturningUser(true);
    }
  }, []);

  // 已登录用户自动重定向
  useEffect(() => {
    if (user) {
      // 检查是否有 returnUrl 参数（使用 window.location.search）
      let returnUrl = '/';
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        returnUrl = params.get('returnUrl') || '/';
      }

      console.log('🔄 useLogin: 用户已登录，重定向到:', returnUrl);
      router.push(returnUrl);
    }
  }, [user, router]);

  // 统一的登录处理函数
  const handleLogin = async (provider: 'google' | 'apple' | 'twitter') => {
    try {
      console.log(`🚀 useLogin: 开始 ${provider} 登录流程`);
      setLoading(true);
      setError(null);

      // 记录访问历史
      localStorage.setItem('hasVisited', 'true');

      // 根据提供商调用不同的登录方法
      switch (provider) {
        case 'google':
          console.log('📞 useLogin: 调用 signInWithGoogle');
          await signInWithGoogle();
          console.log('✅ useLogin: signInWithGoogle 完成');
          break;
        case 'apple':
          await signInWithApple();
          break;
        case 'twitter':
          await signInWithTwitter();
          break;
      }

      // 登录成功后，记录邮箱（用于 Welcome Back 判断）
      if (user?.email) {
        localStorage.setItem('lastLoginEmail', user.email);
        console.log('💾 useLogin: 保存用户邮箱', user.email);
      }

      console.log('✅ useLogin: 登录流程完成');
      // 登录成功后会通过 useEffect 自动重定向
    } catch (err) {
      const error = err as { code?: string; message?: string };
      console.error('❌ useLogin: 登录失败', {
        provider,
        code: error.code,
        message: error.message,
        error: err,
      });
      setError(error.message || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    isReturningUser,
    handleLogin,
  };
}