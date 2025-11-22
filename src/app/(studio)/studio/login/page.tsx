import { Suspense } from 'react';
import LoginForm from '@/components/features/auth/LoginForm';

/**
 * 登录表单加载状态
 */
function LoginFormSkeleton() {
  return (
    <div className="w-full max-w-md animate-pulse">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gray-200 rounded-2xl mx-auto mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-2"></div>
        <div className="h-6 bg-gray-200 rounded w-32 mx-auto"></div>
      </div>
      <div className="space-y-3">
        <div className="h-12 bg-gray-200 rounded-lg"></div>
        <div className="h-12 bg-gray-200 rounded-lg"></div>
        <div className="h-12 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  );
}

/**
 * Studio 登录页面
 *
 * 用于 Studio 区域需要认证的页面
 * 登录成功后会重定向到 returnUrl 参数指定的页面
 *
 * 注意：LoginForm 使用 useSearchParams，需要 Suspense 包裹
 */
export default function StudioLoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Suspense fallback={<LoginFormSkeleton />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}