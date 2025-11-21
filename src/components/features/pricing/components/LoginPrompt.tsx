'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import LoginModal from '@/components/features/auth/LoginModal';

interface LoginPromptProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 登录提示模态框
 * 当用户未登录时点击购买按钮，显示此提示
 * 点击登录后弹出登录模态框，登录成功后留在当前页面
 */
export default function LoginPrompt({ isOpen, onClose }: LoginPromptProps) {
  const { t } = useLanguage();
  const [showLoginModal, setShowLoginModal] = useState(false);

  if (!isOpen && !showLoginModal) return null;

  const handleLogin = () => {
    // 关闭当前提示，显示登录模态框
    onClose();
    setShowLoginModal(true);
  };

  const handleLoginModalClose = () => {
    setShowLoginModal(false);
  };

  // 如果登录模态框打开，只显示登录模态框
  if (showLoginModal) {
    return (
      <LoginModal
        isOpen={showLoginModal}
        onClose={handleLoginModalClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* 模态框内容 */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
        <div className="text-center">
          {/* 图标 */}
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          {/* 标题和描述 */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('pricing.loginRequired')}</h2>
          <p className="text-gray-600 mb-6">{t('pricing.loginRequiredDesc')}</p>

          {/* 按钮 */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-gray-400 transition-colors"
            >
              {t('pricing.cancel')}
            </button>
            <button
              onClick={handleLogin}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-colors"
            >
              {t('pricing.signIn')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}