'use client';

import { useState } from 'react';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';

interface EmailLoginFormProps {
  onBack: () => void;
  onForgotPassword: () => void;
  onSuccess: () => void;
}

// 眼睛图标（显示密码）
const EyeIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

// 眼睛关闭图标（隐藏密码）
const EyeOffIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

// 返回图标
const BackIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

/**
 * Email 登录表单
 */
export default function EmailLoginForm({ onBack, onForgotPassword, onSuccess }: EmailLoginFormProps) {
  const { signInWithEmail } = useFirebaseAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signInWithEmail(email, password);
      onSuccess();
    } catch (err) {
      const error = err as { code?: string };
      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          setError('Invalid email or password');
          break;
        case 'auth/email-not-verified':
          setError('Please verify your email first. Check your inbox.');
          break;
        case 'auth/too-many-requests':
          setError('Too many attempts. Please try again later.');
          break;
        default:
          setError('Login failed. Please try again.');
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
        <h1 className="text-2xl font-bold text-white mb-10">Log in with Email</h1>

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
            />
          </div>

          {/* 密码输入框 */}
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-4 pr-12 bg-transparent border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
              required
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

          {/* 忘记密码 */}
          <button
            type="button"
            onClick={onForgotPassword}
            className="w-full text-center text-cyan-400 text-sm hover:underline"
          >
            forgot your password?
          </button>

          {/* 登录按钮 */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 mt-4 bg-gray-700 rounded-full text-white font-medium hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
