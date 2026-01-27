'use client';

import { Menu, X, Crown, Gift } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import LanguageSwitcher from '@/components/layout/Navbar/LanguageSwitcher';
import UserMenu from '@/components/layout/Navbar/UserMenu';
import LoginButton from '@/components/layout/Navbar/LoginButton';
import Link from 'next/link';

interface StudioTopNavProps {
  /** 升级按钮回调（移动端和桌面端都显示） */
  onUpgradeClick?: () => void;
  /** 每日任务按钮回调 */
  onDailyTasksClick?: () => void;
  /** 菜单是否打开（移动端） */
  isMenuOpen?: boolean;
  /** 菜单切换回调（移动端） */
  onMenuToggle?: (isOpen: boolean) => void;
}

/**
 * Studio Top Navigation (响应式)
 *
 * 移动端样式：
 * - Hamburger menu button + Logo
 * - Upgrade button (皇冠图标)
 * - Language switcher
 * - User menu
 *
 * 桌面端样式：
 * - Logo (左侧)
 * - Upgrade + Language + User/Login (右侧)
 */
export default function StudioTopNav({
  onUpgradeClick,
  onDailyTasksClick,
  isMenuOpen = false,
  onMenuToggle
}: StudioTopNavProps) {
  const { t } = useLanguage();
  const { user } = useFirebaseAuth();

  const toggleMenu = () => {
    onMenuToggle?.(!isMenuOpen);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-b border-white/20 safe-area-top">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16 md:h-20">
        {/* ========== 左侧：Hamburger Menu (移动端) + Logo ========== */}
        <div className="flex items-center gap-2 lg:ml-6">
          {/* Hamburger Menu - 仅移动端显示 */}
          <button
            onClick={toggleMenu}
            className="p-2 text-gray-700 hover:text-pink-500 rounded-lg hover:bg-pink-50 transition-colors flex-shrink-0 lg:hidden -ml-2"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>

          {/* Logo */}
          <Link href="/studio" className="flex items-center">
            <picture>
              <source srcSet="/logo/logo-full-transparent-light-256.webp" type="image/webp" />
              <Image
                src="/logo/logo-full-transparent-light.png"
                alt="Voicica.AI"
                width={180}
                height={48}
                priority
                className="h-10 md:h-12 w-auto object-contain"
              />
            </picture>
          </Link>
        </div>

        {/* ========== 右侧按钮区域 ========== */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Daily Tasks Button */}
          <button
            onClick={onDailyTasksClick}
            className="flex items-center gap-1.5 px-2.5 py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-medium hover:from-pink-600 hover:to-purple-600 hover:shadow-lg transition-all"
            aria-label="Daily Tasks"
          >
            <Gift className="w-4 h-4" />
            <span className="text-xs md:text-sm hidden sm:inline">{t('studio.dailyTasks') || '福利'}</span>
          </button>

          {/* Upgrade Button */}
          <button
            onClick={onUpgradeClick}
            className="flex items-center gap-1.5 px-2.5 py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-slate-800 to-slate-900 text-yellow-400 border-2 border-yellow-400/30 rounded-lg font-medium hover:border-yellow-400/50 hover:shadow-lg hover:shadow-yellow-400/20 transition-all"
            aria-label="Upgrade"
          >
            <Crown className="w-4 h-4" />
            <span className="text-xs md:text-sm hidden sm:inline">{t('studio.upgrade') || '升级'}</span>
          </button>

          {/* Language Switcher */}
          <LanguageSwitcher theme="dark" variant="compact" />

          {/* User Menu or Login Button */}
          {user ? (
            <UserMenu size="sm" />
          ) : (
            <LoginButton />
          )}
        </div>
      </div>
    </div>
  );
}