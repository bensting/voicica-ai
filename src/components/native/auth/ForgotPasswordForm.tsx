'use client';

import { useState } from 'react';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';

interface ForgotPasswordFormProps {
  onBack: () => void;
}

const BackIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

/**
 * 忘记密码表单
 */
export default function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const { resetPassword } = useFirebaseAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      await resetPassword(email);
      setSuccessMessage('Password reset email sent! Please check your inbox.');
    } catch (err) {
      const error = err as { code?: string };
      switch (error.code) {
        case 'auth/user-not-found':
          setError('No account found with this email');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address');
          break;
        default:
          setError('Failed to send reset email. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a1a]">
      {/* 背景渐变 */}
      <div className="absolute inset-x-0 top-0 h-[30%] bg-gradient-to-b from-purple-900/40 via-pink-900/20 to-transparent" />

      {/* 关闭按钮 */}
      <button
        onClick={onBack}
        className="absolute left-4 z-20 p-2 rounded-lg bg-gray-800/80 text-gray-300 hover:text-white hover:bg-gray-700/80 transition-colors"
        style={{ top: 'calc(16px + var(--safe-area-inset-top, 0px))' }}
      >
        <BackIcon />
      </button>

      {/* 内容 */}
      <div
        className="relative z-10 flex flex-col items-center px-6"
        style={{ paddingTop: 'calc(80px + var(--safe-area-inset-top, 0px))' }}
      >
        {/* 标题 */}
        <h1 className="text-2xl font-bold text-white mb-4">Reset Password</h1>
        <p className="text-gray-400 text-sm text-center mb-8">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          {/* Email 输入框 */}
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-4 bg-transparent border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
              required
              disabled={!!successMessage}
            />
          </div>

          {/* 错误信息 */}
          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          {/* 成功信息 */}
          {successMessage && (
            <p className="text-green-400 text-sm text-center">{successMessage}</p>
          )}

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={isLoading || !!successMessage}
            className="w-full py-4 bg-gray-700 rounded-full text-white font-medium hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>

          {/* 返回登录 */}
          <button
            type="button"
            onClick={onBack}
            className="w-full py-3 text-gray-400 hover:text-white transition-colors"
          >
            Back to Login
          </button>
        </form>
      </div>
    </div>
  );
}
