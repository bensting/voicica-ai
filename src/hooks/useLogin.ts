import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';

/**
 * 登录业务逻辑 Hook
 *
 * 职责：
 * - 管理登录状态（loading, error）
 * - 处理登录逻辑
 * - 处理已登录用户重定向
 * - 检测是否为回访用户
 */
export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReturningUser, setIsReturningUser] = useState(false);

  const { user, signInWithGoogle, signInWithApple, signInWithTwitter } = useFirebaseAuth();
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
      console.log('🔄 useLogin: 用户已登录，重定向到 studio');
      router.push('/studio/tts');
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

      // Firebase Auth 登录
      switch (provider) {
        case 'google':
          await signInWithGoogle();
          break;
        case 'apple':
          await signInWithApple();
          break;
        case 'twitter':
          await signInWithTwitter();
          break;
      }

      // 登录成功,保存邮箱
      if (user?.email) {
        localStorage.setItem('lastLoginEmail', user.email);
      }

      // 登录成功后自动跳转
      console.log('✅ useLogin: 登录成功，准备跳转');
      setLoading(false);
      router.push('/studio/tts');
    } catch (err) {
      const error = err as { code?: string; message?: string };
      console.error('❌ useLogin: 登录失败', error);
      setError(error.message || '登录失败，请重试');
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
