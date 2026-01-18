'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import CreateSheet from './CreateSheet';
import LoginModal from './LoginModal';

// 首页图标
const HomeIcon = ({ active }: { active: boolean }) => (
  <svg
    className={`w-6 h-6 ${active ? 'text-white' : 'text-gray-500'}`}
    viewBox="0 0 24 24"
    fill={active ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    {!active && <path d="M9 22V12h6v10" />}
  </svg>
);

// 我的图标
const UserIcon = ({ active }: { active: boolean }) => (
  <svg
    className={`w-6 h-6 ${active ? 'text-white' : 'text-gray-500'}`}
    viewBox="0 0 24 24"
    fill={active ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M20 21a8 8 0 10-16 0" />
  </svg>
);

// 加号图标
const PlusIcon = () => (
  <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

// 关闭图标
const CloseIcon = () => (
  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

/**
 * 底部导航栏
 * Explore / + / Me
 */
export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useFirebaseAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const isLoggedIn = !!user;

  const isExploreActive = pathname === '/native' || pathname.startsWith('/native/explore');
  const isMeActive = pathname.startsWith('/native/me');

  // 点击 Me 按钮
  const handleMeClick = () => {
    if (isLoggedIn) {
      router.push('/native/me');
    } else {
      setIsLoginModalOpen(true);
    }
  };

  return (
    <>
      {/* 底部导航 */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a1a] border-t border-gray-800/50"
        style={{ paddingBottom: 'var(--safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-around h-16">
          {/* Explore */}
          <Link
            href="/native"
            className="flex flex-col items-center justify-center flex-1 h-full"
          >
            <HomeIcon active={isExploreActive} />
            <span
              className={`text-xs mt-1 ${
                isExploreActive ? 'text-white' : 'text-gray-500'
              }`}
            >
              Explore
            </span>
          </Link>

          {/* 中间创建按钮 */}
          <div className="flex items-center justify-center flex-1">
            <button
              onClick={() => setIsCreateOpen(!isCreateOpen)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                isCreateOpen
                  ? 'bg-gray-700'
                  : 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30'
              }`}
            >
              {isCreateOpen ? <CloseIcon /> : <PlusIcon />}
            </button>
          </div>

          {/* Me */}
          <button
            onClick={handleMeClick}
            className="flex flex-col items-center justify-center flex-1 h-full"
          >
            <UserIcon active={isMeActive} />
            <span
              className={`text-xs mt-1 ${
                isMeActive ? 'text-white' : 'text-gray-500'
              }`}
            >
              Me
            </span>
          </button>
        </div>
      </nav>

      {/* 创建菜单 Sheet */}
      <CreateSheet isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />

      {/* 登录弹窗 */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={() => {
          setIsLoginModalOpen(false);
          router.push('/native/me');
        }}
      />
    </>
  );
}
