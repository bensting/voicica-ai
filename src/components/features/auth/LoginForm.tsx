'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLogin } from '@/hooks/useLogin';
import { getEnabledLoginProviders } from '@/config/loginProviders';
import SocialLoginButton from './SocialLoginButton';

/**
 * 登录表单容器组件
 *
 * 职责：
 * - 组合业务逻辑（useLogin Hook）
 * - 组合 UI 组件（SocialLoginButton）
 * - 处理多语言
 */
export default function LoginForm() {
  const { t } = useLanguage();
  const { loading, error, isReturningUser, handleLogin } = useLogin();

  return (
    <div className="w-full max-w-md">
      {/* Logo 和标题 */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('login.title')}</h1>
        <p className="text-xl text-gray-700">
          {isReturningUser ? t('login.welcomeBack') : t('login.welcome')}
        </p>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* 登录按钮组 - 使用配置动态渲染 */}
      <div className="space-y-3">
        {getEnabledLoginProviders().map((provider) => (
          <SocialLoginButton
            key={provider.id}
            provider={provider.id}
            onClick={() => handleLogin(provider.id)}
            disabled={loading}
            icon={provider.icon}
          >
            {t(provider.labelKey)}
          </SocialLoginButton>
        ))}
      </div>

      {/* 服务条款 */}
      <p className="text-center text-sm text-gray-500 mt-8">
        {t('login.termsPrefix')}{' '}
        <Link href="/terms" className="text-purple-600 hover:underline">
          {t('login.terms')}
        </Link>{' '}
        {t('login.termsAnd')}{' '}
        <Link href="/privacy" className="text-purple-600 hover:underline">
          {t('login.privacy')}
        </Link>
      </p>
    </div>
  );
}