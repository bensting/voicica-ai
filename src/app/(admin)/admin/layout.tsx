'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';

// 管理员白名单（可以后续改为从配置读取）
const ADMIN_EMAILS = [
  'admin@ai-voice-labs.com',
  'bensting19@gmail.com',
];

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const { user, loading } = useFirebaseAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }

      // 检查是否为管理员
      const isAdmin = user.email && ADMIN_EMAILS.includes(user.email);
      if (!isAdmin) {
        router.push('/');
        return;
      }

      setIsAuthorized(true);
    }
  }, [user, loading, router]);

  if (loading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">验证权限中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/admin" className="text-xl font-bold text-gray-900">
                管理后台
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                <Link
                  href="/admin/database"
                  className="text-gray-600 hover:text-purple-600 transition-colors"
                >
                  数据库管理
                </Link>
                <Link
                  href="/admin/voices"
                  className="text-gray-600 hover:text-purple-600 transition-colors"
                >
                  语音管理
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">{user?.email}</span>
              <Link
                href="/"
                className="text-sm text-purple-600 hover:text-purple-700"
              >
                返回前台
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
