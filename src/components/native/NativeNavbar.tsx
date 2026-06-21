'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useBottomNav } from '@/contexts/BottomNavContext';
import LanguageSelectorSheet from './LanguageSelectorSheet';

/**
 * Native App 顶部导航栏
 * 包含 Logo 和 Login & Rewards 按钮
 * 支持通过 Context 控制显示/隐藏
 */
export default function NativeNavbar() {
  const { isTopNavVisible } = useBottomNav();
  const [isLanguageSelectorOpen, setIsLanguageSelectorOpen] = useState(false);

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

          </div>

          {/* 右侧区域 */}
          <div className="flex items-center gap-2">

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

      {/* 语言选择器弹窗 */}
      <LanguageSelectorSheet
        isOpen={isLanguageSelectorOpen}
        onClose={() => setIsLanguageSelectorOpen(false)}
      />

    </>
  );
}
