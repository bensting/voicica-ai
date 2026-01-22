'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';

interface RegisterFormProps {
  onBack: () => void;
  onSuccess: () => void;
}

// 眼睛图标
const EyeIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const BackIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

// 复选框图标
const CheckIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

/**
 * 注册表单
 */
export default function RegisterForm({ onBack, onSuccess }: RegisterFormProps) {
  const { signUpWithEmail } = useFirebaseAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!acceptTerms) {
      setError('Please accept the Privacy Policy and Terms of Service');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const result = await signUpWithEmail(email, password);
      if (result.success) {
        setSuccessMessage('Registration successful! Please check your email to verify your account.');
        // 3秒后返回登录页
        setTimeout(() => {
          onSuccess();
        }, 3000);
      }
    } catch (err) {
      const error = err as { code?: string };
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('This email is already registered');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address');
          break;
        case 'auth/weak-password':
          setError('Password is too weak');
          break;
        default:
          setError('Registration failed. Please try again.');
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
        <h1 className="text-2xl font-bold text-white mb-10">Register</h1>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          {/* Email 输入框 */}
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter registered email account"
              className="w-full px-4 py-4 bg-transparent border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
              required
              disabled={!!successMessage}
            />
          </div>

          {/* 密码输入框 */}
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (at least 6 characters)"
              className="w-full px-4 py-4 pr-12 bg-transparent border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
              required
              disabled={!!successMessage}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          {/* 错误信息 */}
          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          {/* 成功信息 */}
          {successMessage && (
            <p className="text-green-400 text-sm text-center">{successMessage}</p>
          )}

          {/* 注册按钮 */}
          <button
            type="submit"
            disabled={isLoading || !!successMessage}
            className="w-full py-4 mt-2 bg-gray-700 rounded-full text-white font-medium hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Registering...' : 'Register'}
          </button>

          {/* 同意条款 */}
          <div className="flex items-start gap-3 mt-4">
            <button
              type="button"
              onClick={() => setAcceptTerms(!acceptTerms)}
              className={`w-5 h-5 flex-shrink-0 mt-0.5 border rounded flex items-center justify-center transition-colors ${
                acceptTerms
                  ? 'bg-purple-600 border-purple-600'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              {acceptTerms && <CheckIcon />}
            </button>
            <p className="text-sm text-gray-400">
              I accept the{' '}
              <Link href="/privacy" className="text-cyan-400 hover:underline">
                [Privacy Policy]
              </Link>{' '}
              and{' '}
              <Link href="/terms" className="text-cyan-400 hover:underline">
                [Terms of Service]
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
