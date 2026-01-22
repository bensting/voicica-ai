'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useCredits } from '@/contexts/CreditsContext';
import LoginModal from './LoginModal';
import CrownIcon from './common/CrownIcon';
import CreditsIcon from './common/CreditsIcon';

/**
 * Native App 顶部导航栏
 * 包含 Logo 和 Login & Rewards 按钮
 */
export default function NativeNavbar() {
  const router = useRouter();
  const { user } = useFirebaseAuth();
  const { credits } = useCredits();
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
          <Link href="/native" className="flex items-center">
            <Image
              src="/logo/voice-labs-logo-dark.svg"
              alt="VoicicaAI"
              width={120}
              height={24}
              priority
            />
          </Link>

          {/* 右侧区域 */}
          {isLoggedIn ? (
            /* 已登录：显示积分 */
            <button
              onClick={() => router.push('/native/subscribe')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1a1a2e] border border-[#2a2a4a]"
            >
              <CrownIcon className="w-4 h-4 text-white" />
              <span className="text-gray-500">|</span>
              <CreditsIcon className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-white text-sm font-medium">{credits}</span>
            </button>
          ) : (
            /* 未登录：显示登录按钮 */
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="px-3 py-1.5 text-xs font-medium text-white rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all"
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
        onLoginSuccess={() => {
          setIsLoginModalOpen(false);
          router.push('/native/me');
        }}
      />
    </>
  );
}
