import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import type { LoginProvider } from '@/config/loginProviders';

/**
 * 登录业务逻辑 Hook
 *
 * 职责：
 * - 管理登录状态（loading, error）
 * - 处理登录逻辑
 * - 处理已登录用户重定向
 * - 检测是否为回访用户
 * - 支持 returnUrl 参数，登录成功后返回原页面
 *
 * 注意：此 hook 使用了 useSearchParams，使用它的组件需要条件渲染
 * 避免在静态生成时调用（如 Modal 组件应在打开时才渲染）
 */
export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReturningUser, setIsReturningUser] = useState(false);

  const { user, signInWithGoogle, signInWithApple, signInWithTwitter, signInWithFacebook } = useFirebaseAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // 获取登录成功后的重定向地址
  const returnUrl = searchParams.get('returnUrl') || '/studio/tts';

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
      console.log('🔄 useLogin: 用户已登录，重定向到', returnUrl);
      router.push(returnUrl);
    }
  }, [user, router, returnUrl]);

  // 统一的登录处理函数
  const handleLogin = async (provider: LoginProvider) => {
    try {
      console.log(`🚀 useLogin: 开始 ${provider} 登录流程`);
      setLoading(true);
      setError(null);

      // 记录访问历史
      localStorage.setItem('hasVisited', 'true');

      // Firebase Auth 登录（弹窗方式）
      // 登录成功后 onAuthStateChanged 会触发，更新 user 状态
      // useEffect 监听到 user 变化后会自动重定向
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
        case 'facebook':
          await signInWithFacebook();
          break;
      }

      // 登录成功，等待 onAuthStateChanged 触发后 useEffect 会处理重定向
      console.log('✅ useLogin: 登录成功，等待状态更新后重定向');
      setLoading(false);
    } catch (err) {
      const error = err as { code?: string; message?: string };

      // 用户主动关闭登录弹窗，不显示错误
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        console.log('ℹ️ useLogin: 用户取消登录');
        setLoading(false);
        return;
      }

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
