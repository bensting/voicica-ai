'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useLogin } from '@/hooks/useLogin';
import SocialLoginButton, {
  GoogleIcon,
  AppleIcon,
  TwitterIcon,
} from './SocialLoginButton';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 登录模态框组件
 *
 * 用于在不离开当前页面的情况下弹出登录界面
 * 登录成功后自动关闭并刷新当前页面状态
 */
export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { t } = useLanguage();
  const { loading, error, handleLogin } = useLogin();
  const { user } = useFirebaseAuth();

  // 登录成功后自动关闭模态框
  useEffect(() => {
    if (user && isOpen) {
      console.log('✅ 登录成功，关闭模态框');
      onClose();
    }
  }, [user, isOpen, onClose]);

  // 按 ESC 键关闭
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      {/* 模态框内容 */}
      <div
        className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* 内容区域 */}
        <div className="p-8">
          {/* Logo 和标题 */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {t('login.title')}
            </h2>
            <p className="text-gray-600">{t('login.welcome')}</p>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* 登录按钮组 */}
          <div className="space-y-3 mb-6">
            <SocialLoginButton
              provider="google"
              onClick={() => handleLogin('google')}
              disabled={loading}
              icon={<GoogleIcon />}
            >
              {t('login.signInWithGoogle')}
            </SocialLoginButton>

            <SocialLoginButton
              provider="apple"
              onClick={() => handleLogin('apple')}
              disabled={loading}
              icon={<AppleIcon />}
            >
              {t('login.signInWithApple')}
            </SocialLoginButton>

            <SocialLoginButton
              provider="twitter"
              onClick={() => handleLogin('twitter')}
              disabled={loading}
              icon={<TwitterIcon />}
            >
              {t('login.signInWithX')}
            </SocialLoginButton>
          </div>

          {/* 服务条款 */}
          <p className="text-center text-xs text-gray-500">
            {t('login.termsPrefix')}{' '}
            <a href="/terms" className="text-purple-600 hover:underline">
              {t('login.terms')}
            </a>{' '}
            {t('login.termsAnd')}{' '}
            <a href="/privacy" className="text-purple-600 hover:underline">
              {t('login.privacy')}
            </a>
          </p>
        </div>
      </div>
    </div>
  );

  // 使用 Portal 渲染到 body，确保最高层级
  return typeof window !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
}