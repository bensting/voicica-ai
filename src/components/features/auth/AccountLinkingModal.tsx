'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Eye, EyeOff, Link2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';

/**
 * 账户关联弹窗
 * 当用户尝试用社交登录（如 Google），但该邮箱已存在邮箱密码账户时显示
 * 用户输入密码后，两个账户将被关联，之后两种方式都可以登录
 */
export default function AccountLinkingModal() {
  const { t } = useLanguage();
  const { accountLinking, linkAccountWithPassword, cancelAccountLinking } = useFirebaseAuth();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 处理关联
  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password) {
      setError(t('accountLinking.passwordRequired'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await linkAccountWithPassword(password);
      // 成功后会自动关闭（accountLinking 变为 null）
    } catch (err: unknown) {
      const errorCode = err && typeof err === 'object' && 'code' in err
        ? (err as { code: string }).code
        : '';

      switch (errorCode) {
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError(t('accountLinking.wrongPassword'));
          break;
        case 'auth/too-many-requests':
          setError(t('login.tooManyRequests'));
          break;
        default:
          setError(t('accountLinking.linkFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  // 处理取消
  const handleCancel = () => {
    setPassword('');
    setError(null);
    cancelAccountLinking();
  };

  // 如果没有需要关联的账户，不显示
  if (!accountLinking) return null;

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-[10000]"
      onClick={handleCancel}
    >
      <div
        className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 内容 */}
        <div className="p-8">
          {/* 图标 */}
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Link2 className="w-8 h-8 text-purple-600" />
          </div>

          {/* 标题 */}
          <h2 className="text-xl font-bold text-center text-gray-900 mb-2">
            {t('accountLinking.title')}
          </h2>

          {/* 说明文字 */}
          <p className="text-center text-gray-600 text-sm mb-6">
            {t('accountLinking.description', {
              email: accountLinking.email,
              provider: accountLinking.providerName
            })}
          </p>

          {/* 错误提示 */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* 密码输入表单 */}
          <form onSubmit={handleLink} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('accountLinking.enterPassword')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('login.passwordPlaceholder')}
                  className="w-full px-4 py-3 pr-12 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  disabled={loading}
                  autoFocus
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

            {/* 按钮组 */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? t('common.loading') : t('accountLinking.linkButton')}
              </button>
            </div>
          </form>

          {/* 提示 */}
          <p className="mt-4 text-center text-xs text-gray-500">
            {t('accountLinking.hint')}
          </p>
        </div>
      </div>
    </div>
  );

  return typeof window !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
}