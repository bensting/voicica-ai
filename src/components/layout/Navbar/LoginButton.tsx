'use client';

import { useState } from 'react';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import UserMenu from './UserMenu';
import LoginModal from '@/components/features/auth/LoginModal';

/**
 * 登录按钮组件
 *
 * 根据登录状态显示：
 * - 未登录：显示 Login 按钮（点击弹出 Modal）
 * - 已登录：显示用户菜单
 */
export default function LoginButton() {
  const { user, loading } = useFirebaseAuth();
  const { t } = useLanguage();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // 加载中显示占位符
  if (loading) {
    return (
      <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
    );
  }

  // 已登录显示用户菜单
  if (user) {
    return <UserMenu size="sm" />;
  }

  // 未登录显示 Login 按钮（移动端和桌面端都使用 Modal）
  return (
    <>
      <button
        onClick={() => setIsLoginModalOpen(true)}
        className="flex items-center gap-1.5 px-4 py-1.5 sm:px-6 sm:py-2 bg-white text-black rounded-full hover:bg-gray-200 transition-colors font-medium text-sm sm:text-base"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        <span className="hidden sm:inline">{t('navbar.login')}</span>
      </button>

      {/* 只在打开时渲染 Modal，避免 useSearchParams 在静态生成时报错 */}
      {isLoginModalOpen && (
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
        />
      )}
    </>
  );
}