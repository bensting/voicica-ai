'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import UserMenu from './UserMenu';
import LoginModal from '@/components/features/auth/LoginModal';

/**
 * 登录按钮组件
 *
 * 根据登录状态显示：
 * - 未登录：显示 Login 按钮
 *   - 移动端：点击弹出 Modal
 *   - 桌面端：跳转到 /login 页面
 * - 已登录：显示用户菜单
 */
export default function LoginButton() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 检测是否为移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 加载中显示占位符
  if (loading) {
    return (
      <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
    );
  }

  // 已登录显示用户菜单
  if (user) {
    return <UserMenu />;
  }

  // 未登录显示 Login 按钮
  // 移动端：点击弹出 Modal
  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setIsLoginModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-white text-black rounded-full hover:bg-gray-200 transition-colors font-medium text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </button>

        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
        />
      </>
    );
  }

  // 桌面端：跳转到登录页面
  return (
    <Link
      href="/login"
      className="flex items-center gap-1.5 px-6 py-2 bg-white text-black rounded-full hover:bg-gray-200 transition-colors font-medium text-base"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
      <span className="hidden sm:inline">{t('navbar.login')}</span>
    </Link>
  );
}