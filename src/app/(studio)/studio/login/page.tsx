'use client';

import LoginForm from '@/components/features/auth/LoginForm';

/**
 * Studio 登录页面
 *
 * 用于 Studio 区域需要认证的页面
 * 登录成功后会重定向到 returnUrl 参数指定的页面
 */
export default function StudioLoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center p-4">
      <LoginForm />
    </div>
  );
}