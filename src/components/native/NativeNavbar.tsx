'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import LoginModal from './LoginModal';

/**
 * Native App 顶部导航栏
 * 包含 Logo 和 Login & Rewards 按钮
 */
export default function NativeNavbar() {
  const { user } = useFirebaseAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const isLoggedIn = !!user;

  return (
    <>
      <header
        className="sticky top-0 z-50 bg-[#0a0a1a]"
        style={{ paddingTop: 'var(--safe-area-inset-top, 0px)' }}
      >
        <div className="flex items-center justify-between px-4 h-14">
          {/* Logo */}
          <Link href="/native" className="flex items-center gap-1">
            <span className="text-xl font-bold text-white">
              Voicica
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                AI
              </span>
            </span>
            <span className="text-[10px] text-gray-400 align-super">®</span>
          </Link>

          {/* Login & Rewards 按钮 */}
          {!isLoggedIn && (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="px-4 py-2 text-sm font-medium text-white rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              Login & Rewards
            </button>
          )}
        </div>
      </header>

      {/* 登录弹窗 */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  );
}
