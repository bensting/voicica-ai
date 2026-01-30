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

  // 渲染内容
  const renderContent = () => {
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

    // 未登录显示 Login 按钮
    return (
      <button
        onClick={() => setIsLoginModalOpen(true)}
        className="relative group flex items-center gap-2 px-6 py-2.5 rounded-full shadow-lg shadow-pink-300/40 hover:shadow-xl hover:shadow-pink-400/50 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
      >
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 bg-[length:200%_auto] animate-gradient-x" />

        {/* Shine Effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-gradient-to-b from-white to-transparent transition-opacity duration-300" />

        {/* Top Highlight (Glassy look) */}
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent opacity-50 rounded-t-full" />

        {/* Content */}
        <div className="relative flex items-center gap-2 text-white font-bold tracking-wide text-sm sm:text-base whitespace-nowrap">
          <svg className="w-5 h-5 flex-shrink-0 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span className="hidden sm:inline drop-shadow-sm">{t('navbar.login')}</span>
        </div>
      </button>
    );
  };

  return (
    <>
      {renderContent()}

      {/* LoginModal 始终存在，不受 user 状态影响，避免注册时组件被卸载导致状态丢失 */}
      {isLoginModalOpen && (
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
        />
      )}
    </>
  );
}