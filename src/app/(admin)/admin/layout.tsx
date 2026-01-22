'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { ADMIN_EMAILS } from '@/config/admin';

// 菜单分组配置
const MENU_GROUPS = [
  {
    title: '用户',
    items: [
      { href: '/admin/stats', label: '数据统计', icon: '📊' },
      { href: '/admin/users', label: '用户管理', icon: '👥' },
    ],
  },
  {
    title: '内容',
    items: [
      { href: '/admin/tts-records', label: 'TTS 记录', icon: '🎙️' },
      { href: '/admin/music-records', label: 'Music 记录', icon: '🎵' },
      { href: '/admin/voices', label: '语音管理', icon: '🔊' },
      { href: '/admin/rvc-models', label: 'RVC 模型', icon: '🎤' },
    ],
  },
  {
    title: '同步',
    items: [
      { href: '/admin/voices/sync', label: 'Azure 同步', icon: '☁️' },
      { href: '/admin/voices/sync-google', label: 'Google 同步', icon: '🔍' },
      { href: '/admin/voices/sync-fish', label: 'Fish 同步', icon: '🐟' },
    ],
  },
  {
    title: '系统',
    items: [
      { href: '/admin/app-releases', label: 'App 版本', icon: '📱' },
      { href: '/admin/database', label: '数据库', icon: '🗄️' },
    ],
  },
];

// 扁平化菜单用于移动端
const NAV_ITEMS = MENU_GROUPS.flatMap(group => group.items);

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useFirebaseAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // 路由变化时关闭移动端菜单
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

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
      {/* 顶部导航栏 */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 lg:px-6">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center gap-4">
              {/* 移动端汉堡菜单按钮 */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                aria-label="打开菜单"
              >
                {isMobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>

              <Link href="/admin" className="text-lg font-bold text-gray-900">
                管理后台
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <span className="hidden sm:inline text-sm text-gray-500">{user?.email}</span>
              <Link href="/" className="text-sm text-purple-600 hover:text-purple-700">
                返回前台
              </Link>
            </div>
          </div>
        </div>

        {/* 移动端下拉菜单 */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <nav className="px-4 py-3 space-y-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    pathname === item.href
                      ? 'bg-purple-50 text-purple-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
              <div className="border-t border-gray-200 mt-2 pt-2">
                <div className="px-3 py-2 text-sm text-gray-500">{user?.email}</div>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* 点击遮罩关闭菜单 */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className="flex">
        {/* 桌面端左侧边栏 */}
        <aside className="hidden lg:block w-56 flex-shrink-0 bg-white border-r border-gray-200 min-h-[calc(100vh-56px)] sticky top-14 self-start">
          <nav className="p-4 space-y-6">
            {MENU_GROUPS.map((group) => (
              <div key={group.title}>
                <h3 className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {group.title}
                </h3>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                        pathname === item.href
                          ? 'bg-purple-50 text-purple-600 font-medium'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <span className="text-base">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 p-6 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
