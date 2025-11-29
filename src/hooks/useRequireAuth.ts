/**
 * 需要登录的页面 Hook
 *
 * 自动处理未登录状态，显示登录 Modal
 * 关闭 Modal 时根据当前路径返回对应的首页
 */

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';

export function useRequireAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading } = useFirebaseAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // 检查登录状态，未登录则显示登录 Modal
  useEffect(() => {
    if (!authLoading && !user) {
      setShowLoginModal(true);
    } else if (user) {
      setShowLoginModal(false);
    }
  }, [user, authLoading]);

  // 处理关闭登录 Modal - 根据当前路径返回相应首页
  const handleCloseLoginModal = () => {
    setShowLoginModal(false);

    // 只有在用户手动关闭（未登录）时才跳转
    // 如果已登录（登录成功），则留在当前页面
    if (!user) {
      // 根据当前路径判断返回哪个首页
      if (pathname.startsWith('/studio')) {
        router.push('/studio');
      } else if (pathname.startsWith('/marketing')) {
        router.push('/marketing');
      } else {
        router.push('/');
      }
    }
  };

  return {
    user,
    authLoading,
    showLoginModal,
    handleCloseLoginModal,
  };
}