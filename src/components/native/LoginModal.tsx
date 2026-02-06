'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import EmailLoginForm from './auth/EmailLoginForm';
import RegisterForm from './auth/RegisterForm';
import ForgotPasswordForm from './auth/ForgotPasswordForm';

type ViewType = 'main' | 'email-login' | 'register' | 'forgot-password';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

// 关闭图标
const CloseIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

// Google 图标
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

/**
 * 登录弹窗
 * 支持多视图：主页、Email登录、注册、忘记密码
 */
export default function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const { signInWithGoogle } = useFirebaseAuth();
  const { t } = useLanguage();
  const [view, setView] = useState<ViewType>('main');
  const [isLoading, setIsLoading] = useState(false);

  // 重置视图当弹窗关闭时
  useEffect(() => {
    if (!isOpen) {
      setView('main');
    }
  }, [isOpen]);

  // 禁止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Google login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = () => {
    setView('email-login');
  };

  const handleSignUp = () => {
    setView('register');
  };

  const handleLoginSuccess = () => {
    if (onLoginSuccess) {
      onLoginSuccess();
    } else {
      onClose();
    }
  };

  const handleRegisterSuccess = () => {
    // 注册成功后返回主页，让用户登录
    setView('main');
  };

  // Email 登录视图
  if (view === 'email-login') {
    return (
      <div className="fixed inset-0 z-[10010] animate-fade-in">
        <EmailLoginForm
          onBack={() => setView('main')}
          onForgotPassword={() => setView('forgot-password')}
          onSuccess={handleLoginSuccess}
        />
      </div>
    );
  }

  // 注册视图
  if (view === 'register') {
    return (
      <div className="fixed inset-0 z-[10010] animate-fade-in">
        <RegisterForm
          onBack={() => setView('main')}
          onSuccess={handleRegisterSuccess}
        />
      </div>
    );
  }

  // 忘记密码视图
  if (view === 'forgot-password') {
    return (
      <div className="fixed inset-0 z-[10010] animate-fade-in">
        <ForgotPasswordForm onBack={() => setView('email-login')} />
      </div>
    );
  }

  // 主视图
  return (
    <div className="fixed inset-0 z-[10010] bg-[#0a0a1a] animate-fade-in overflow-auto">
      {/* 背景图片 */}
      <div
        className="absolute inset-x-0 top-0 h-[60%] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/images/native/login-bg.webp)' }}
      />

      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="absolute left-4 z-20 p-2 rounded-lg bg-gray-800/80 text-gray-300 hover:text-white hover:bg-gray-700/80 transition-colors"
        style={{ top: 'calc(16px + var(--safe-area-inset-top, 0px))' }}
      >
        <CloseIcon />
      </button>

      {/* 内容 */}
      <div className="relative z-10 flex flex-col items-center min-h-screen px-6">
        {/* 顶部区域 - Logo */}
        <div
          className="flex flex-col items-center"
          style={{ paddingTop: 'calc(28px + var(--safe-area-inset-top, 0px))' }}
        >
          <p className="text-gray-300 text-lg mb-2">{t('native.login.welcomeTo')}</p>
          <h1 className="text-4xl font-bold">
            <span className="text-white">Voicica</span>
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              AI
            </span>
          </h1>
        </div>

        {/* 中间留白区域 - 展示背景图 */}
        <div className="flex-1 min-h-[200px]" />

        {/* 底部登录区域 */}
        <div className="w-full max-w-sm pb-8">
          {/* 提示文字 */}
          <p className="text-white text-lg font-medium mb-6 text-center">
            {t('native.login.loginToReceive')}
          </p>

          {/* 登录按钮 */}
          <div className="space-y-3">
            {/* Google 登录 */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition-all"
            >
              <GoogleIcon />
              {isLoading ? t('native.login.loggingIn') : t('native.login.loginWithGoogle')}
            </button>

            {/* Email 登录 */}
            <button
              onClick={handleEmailLogin}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-full border border-gray-600 text-white font-medium hover:bg-gray-800/50 transition-colors"
            >
              {t('native.login.loginWithEmail')}
            </button>

            {/* Sign up */}
            <button
              onClick={handleSignUp}
              className="w-full py-3 text-white font-medium hover:text-purple-400 transition-colors"
            >
              {t('native.login.signUp')}
            </button>
          </div>

          {/* 法律声明 */}
          <p
            className="mt-6 text-center text-sm text-gray-500"
            style={{ paddingBottom: 'var(--safe-area-inset-bottom, 0px)' }}
          >
            {t('native.login.agreement')}{' '}
            <Link href="/privacy" className="text-purple-400 hover:underline">
              {t('native.login.privacyPolicy')}
            </Link>{' '}
            {t('native.login.and')}{' '}
            <Link href="/terms" className="text-purple-400 hover:underline">
              {t('native.login.termsOfUse')}
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
