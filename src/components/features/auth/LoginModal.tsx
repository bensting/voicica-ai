'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { getEnabledLoginProviders } from '@/config/loginProviders';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Mode = 'login' | 'signup';

/**
 * 登录/注册模态框组件
 *
 * 新设计：
 * - 登录视图：社交登录图标 + OR + 邮箱密码登录
 * - 注册视图：邮箱密码注册表单
 */
export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { t } = useLanguage();
  const {
    user,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithApple,
    signInWithTwitter,
    signInWithFacebook,
  } = useFirebaseAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取启用的社交登录方式
  const socialProviders = getEnabledLoginProviders();

  // 登录成功后自动关闭模态框
  useEffect(() => {
    if (user && isOpen) {
      console.log('✅ 登录成功，关闭模态框');
      onClose();
      // 重置表单
      setEmail('');
      setPassword('');
      setError(null);
      setMode('login');
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

  // 切换模式时重置表单
  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setEmail('');
    setPassword('');
    setError(null);
  };

  // 验证邮箱格式
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 邮箱密码登录
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 验证
    if (!validateEmail(email)) {
      setError(t('login.invalidEmail'));
      return;
    }
    if (password.length < 6) {
      setError(t('login.passwordTooShort'));
      return;
    }

    setLoading(true);
    try {
      await signInWithEmail(email, password);
    } catch (err: any) {
      console.error('邮箱登录失败:', err);
      setError(t('login.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  // 邮箱密码注册
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 验证
    if (!validateEmail(email)) {
      setError(t('login.invalidEmail'));
      return;
    }
    if (password.length < 6) {
      setError(t('login.passwordTooShort'));
      return;
    }

    setLoading(true);
    try {
      await signUpWithEmail(email, password);
    } catch (err: any) {
      console.error('邮箱注册失败:', err);
      setError(t('login.signupFailed'));
    } finally {
      setLoading(false);
    }
  };

  // 社交登录
  const handleSocialLogin = async (providerId: string) => {
    setLoading(true);
    setError(null);

    try {
      switch (providerId) {
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
        default:
          console.error('Unknown provider:', providerId);
      }
    } catch (err: any) {
      console.error(`${providerId} 登录失败:`, err);
      // 只有在不是用户取消的情况下才显示错误
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setError(t('login.loginFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-[9999]"
      onClick={onClose}
    >
      {/* 模态框内容 */}
      <div
        className="relative w-full max-w-[440px] mx-4 bg-white rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 内容区域 */}
        <div className="p-10">
          {mode === 'login' ? (
            <>
              {/* 登录视图 */}
              <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
                {t('login.title')}
              </h2>

              {/* 社交登录图标 - 横向排列 */}
              <div className="flex justify-center gap-4 mb-6">
                {socialProviders.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => handleSocialLogin(provider.id)}
                    className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-white border-2 border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all"
                    aria-label={`Sign in with ${provider.id}`}
                  >
                    {provider.icon}
                  </button>
                ))}
              </div>

              {/* OR 分隔符 */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">
                    {t('login.or')}
                  </span>
                </div>
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* 邮箱密码登录表单 */}
              <form onSubmit={handleEmailLogin} className="space-y-4">
                {/* 邮箱输入框 */}
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('login.emailPlaceholder')}
                      className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* 密码输入框 */}
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('login.passwordPlaceholder')}
                      className="w-full pl-12 pr-12 py-3.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 忘记密码链接 */}
                <div className="text-right">
                  <button
                    type="button"
                    className="text-sm text-gray-500 hover:text-purple-600 transition-colors"
                  >
                    {t('login.forgotPassword')}
                  </button>
                </div>

                {/* 登录按钮 */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base"
                >
                  {loading ? t('common.loading') : t('login.loginButton')}
                </button>
              </form>

              {/* 创建账号链接 */}
              <div className="mt-6 text-center text-sm">
                <span className="text-gray-600">{t('login.noAccount')} </span>
                <button
                  onClick={() => switchMode('signup')}
                  className="text-purple-600 hover:text-purple-700 font-medium hover:underline"
                >
                  {t('login.createAccount')}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* 注册视图 */}
              <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
                {t('login.createAccountTitle')}
              </h2>

              {/* 错误提示 */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* 邮箱密码注册表单 */}
              <form onSubmit={handleEmailSignup} className="space-y-4">
                {/* 邮箱输入框 */}
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('login.emailPlaceholder')}
                      className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* 密码输入框 */}
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('login.passwordPlaceholder')}
                      className="w-full pl-12 pr-12 py-3.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 创建账号按钮 */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base"
                >
                  {loading ? t('common.loading') : t('login.createAccountButton')}
                </button>
              </form>

              {/* 返回登录链接 */}
              <div className="mt-6 text-center">
                <button
                  onClick={() => switchMode('login')}
                  className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium hover:underline"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('login.backToLogin')}
                </button>
              </div>

              {/* 协议说明 */}
              <div className="mt-6 text-center text-xs text-gray-500 px-4">
                {t('login.agreementText')}{' '}
                <a href="/license" className="text-purple-600 hover:underline">
                  {t('login.licensePolicy')}
                </a>{' '}
                {t('login.and')}{' '}
                <a href="/privacy" className="text-purple-600 hover:underline">
                  {t('login.privacyPolicy')}
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // 使用 Portal 渲染到 body，确保最高层级
  return typeof window !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
}
