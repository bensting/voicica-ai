'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import CreateSheet from './CreateSheet';

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
  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const isExploreActive = pathname === '/native' || pathname.startsWith('/native/explore');
  const isMeActive = pathname.startsWith('/native/me');

  return (
    <>
      {/* 底部导航 */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-t border-white/5"
        style={{ paddingBottom: 'var(--safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-around h-16">
          {/* Explore */}
          <Link
            href="/native"
            className="flex flex-col items-center justify-center flex-1 h-full active:scale-95 transition-transform"
          >
            <HomeIcon active={isExploreActive} />
            <span
              className={`text-xs mt-1 ${isExploreActive ? 'text-white font-medium' : 'text-slate-500'
                }`}
            >
              Explore
            </span>
          </Link>

          {/* 中间创建按钮 */}
          <div className="flex items-center justify-center flex-1">
            <button
              onClick={() => setIsCreateOpen(!isCreateOpen)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 ${isCreateOpen
                  ? 'bg-slate-800 text-white'
                  : 'bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/40 hover:shadow-purple-500/60 hover:-translate-y-0.5'
                }`}
            >
              {isCreateOpen ? <CloseIcon /> : <PlusIcon />}
            </button>
          </div>

          {/* Me */}
          <Link
            href="/native/me"
            className="flex flex-col items-center justify-center flex-1 h-full"
          >
            <UserIcon active={isMeActive} />
            <span
              className={`text-xs mt-1 ${isMeActive ? 'text-white' : 'text-gray-500'
                }`}
            >
              Me
            </span>
          </Link>
        </div>
      </nav>

      {/* 创建菜单 Sheet */}
      <CreateSheet isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </>
  );
}
