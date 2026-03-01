'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useCredits } from '@/contexts/CreditsContext';
import { useBottomNav } from '@/contexts/BottomNavContext';
import LoginModal from './LoginModal';
import NativeDailyTasksModal from './NativeDailyTasksModal';
import LanguageSelectorSheet from './LanguageSelectorSheet';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Native App 顶部导航栏
 * 包含 Logo 和 Login & Rewards 按钮
 * 支持通过 Context 控制显示/隐藏
 */
export default function NativeNavbar() {
  const router = useRouter();
  const { user } = useFirebaseAuth();
  const { refreshCredits } = useCredits();
  const { isTopNavVisible } = useBottomNav();
  const { t } = useLanguage();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isDailyTasksOpen, setIsDailyTasksOpen] = useState(false);
  const [isLanguageSelectorOpen, setIsLanguageSelectorOpen] = useState(false);

  const isLoggedIn = !!user;

  // Prefetch high-traffic routes + data on app startup
  useEffect(() => {
    router.prefetch('/native/subscribe');
    router.prefetch('/native/crash-game');
  }, [router]);

  // 通过 Context 控制隐藏
  if (!isTopNavVisible) return null;

  return (
    <>
      <header
        className="sticky top-0 z-50 bg-slate-950/70 backdrop-blur-xl border-b border-white/5 transition-all duration-300"
        style={{ paddingTop: 'var(--safe-area-inset-top, 0px)' }}
      >
        <div className="flex items-center justify-between px-4 h-14">
          {/* Logo + Free 按钮 */}
          <div className="flex items-center gap-3">
            <Link href="/native" className="flex items-center">
              <picture>
                <source srcSet="/logo/logo-transparent-256.webp" type="image/webp" />
                <Image
                  src="/logo/logo-transparent.png"
                  alt="VoicicaAI"
                  width={48}
                  height={48}
                  priority
                  className="h-12 w-12 opacity-90 hover:opacity-100 transition-opacity"
                />
              </picture>
            </Link>

            {/* Mining Center 入口 */}
            <button
              onClick={() => setIsDailyTasksOpen(true)}
              className="relative flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 animate-pulse hover:from-amber-500/30 hover:to-orange-500/30 transition-all active:scale-95"
            >
              <Image src="/logo/voicica-token.png" alt="" width={20} height={20} className="w-5 h-5" />
              <span className="text-xs font-bold text-amber-400">Mine</span>
              {/* 小红点提示 */}
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </button>
          </div>

          {/* 右侧区域 */}
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              /* 已登录：Buy 按钮 */
              <button
                onClick={() => router.push('/native/subscribe')}
                className="flex items-center gap-1 px-4 py-1.5 rounded-full text-white text-sm font-bold tracking-wide transition-all active:scale-95 shadow-lg shadow-amber-500/20"
                style={{ background: 'linear-gradient(90deg, #D97706, #F59E0B, #EAB308)' }}
              >
                {t('native.common.buy')}
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              /* 未登录：显示登录按钮 */
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all active:scale-95"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3-3l3-3m0 0l-3-3m3 3H9" />
                </svg>
                {t('native.navbar.login')}
              </button>
            )}

            {/* 语言选择器按钮 */}
            <button
              onClick={() => setIsLanguageSelectorOpen(true)}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 active:scale-95"
              aria-label="Switch language"
            >
              <svg className="w-4.5 h-4.5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* 登录弹窗 */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={() => {
          setIsLoginModalOpen(false);
          // 设置标记防止 Me 页面再次弹出登录框
          sessionStorage.setItem('me_page_login_modal_shown', 'true');
          router.push('/native/me');
        }}
      />

      {/* 每日任务弹窗 - 延迟渲染，打开时才 mount */}
      {isDailyTasksOpen && (
        <NativeDailyTasksModal
          isOpen
          onClose={() => setIsDailyTasksOpen(false)}
          onCreditsUpdated={refreshCredits}
        />
      )}

      {/* 语言选择器弹窗 */}
      <LanguageSelectorSheet
        isOpen={isLanguageSelectorOpen}
        onClose={() => setIsLanguageSelectorOpen(false)}
      />
    </>
  );
}
