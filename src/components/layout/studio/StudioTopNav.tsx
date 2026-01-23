'use client';

import { Menu, X, Crown, Gift } from 'lucide-react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
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
  const pathname = usePathname();

  // Check if on AI Music related pages for pink theme
  const isPinkTheme = pathname?.startsWith('/studio/ai-music') || pathname?.startsWith('/studio/ai-cover') || pathname?.startsWith('/studio/ai-song') || pathname?.startsWith('/studio/music-history');

  const toggleMenu = () => {
    onMenuToggle?.(!isMenuOpen);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-purple-600 to-purple-500 lg:from-purple-50 lg:to-blue-50 lg:border-b lg:border-gray-200 safe-area-top">
      <div className="flex items-center justify-between px-3 py-2.5 lg:px-4 lg:py-3 gap-2">
        {/* ========== 左侧：Hamburger Menu (移动端) + Logo (移动端和桌面端) ========== */}
        <div className="flex items-center gap-1.5 flex-shrink min-w-0 lg:ml-6">
          {/* Hamburger Menu - 仅移动端显示 */}
          <button
            onClick={toggleMenu}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0 lg:hidden"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Menu className="w-6 h-6 text-white" />
            )}
          </button>

          {/* Logo - 移动端用亮色logo，桌面端用深色logo */}
          <Link href="/studio" className="flex items-center min-w-0">
            {/* 移动端 - 亮色 logo (紫色背景) */}
            <Image
              src="/logo/voice-labs-logo-dark.svg"
              alt="Voicica.AI"
              width={200}
              height={28}
              priority
              className="h-7 w-auto lg:hidden"
            />
            {/* 桌面端 - 深色 logo (浅色背景), pink filter for Music AI pages */}
            <Image
              src="/logo/voice-labs-logo-light.svg"
              alt="Voicica.AI"
              width={200}
              height={28}
              priority
              className={`h-7 w-auto hidden lg:block transition-all duration-300 ${isPinkTheme ? '[filter:brightness(0)_saturate(100%)_invert(56%)_sepia(52%)_saturate(4594%)_hue-rotate(314deg)_brightness(98%)_contrast(91%)]' : ''}`}
            />
          </Link>
        </div>

        {/* ========== 移动端右侧 (< lg) ========== */}
        <div className="flex items-center gap-2 flex-shrink-0 mr-1 lg:hidden">
          {/* Daily Tasks Button - 只显示礼物图标 */}
          <button
            onClick={onDailyTasksClick}
            className="p-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 hover:shadow-lg transition-all"
            aria-label="Daily Tasks"
          >
            <Gift className="w-4 h-4" />
          </button>

          {/* Upgrade Button - 只显示皇冠图标 */}
          <button
            onClick={onUpgradeClick}
            className="p-2 bg-gradient-to-r from-slate-800 to-slate-900 text-yellow-400 border-[3px] border-yellow-400/50 rounded-lg hover:border-yellow-400/70 hover:shadow-lg hover:shadow-yellow-400/20 transition-all"
            aria-label="Upgrade"
          >
            <Crown className="w-4 h-4" />
          </button>

          {/* Language Switcher */}
          <LanguageSwitcher theme="light" variant="compact" showArrow={false} />

          {/* User Menu */}
          <UserMenu size="sm" />
        </div>

        {/* ========== 桌面端右侧 (>= lg) ========== */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Daily Tasks Button - 图标 + 文字 */}
          <button
            onClick={onDailyTasksClick}
            className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-medium hover:from-pink-600 hover:to-purple-600 hover:shadow-lg transition-all"
          >
            <Gift className="w-4 h-4" />
            <span className="text-sm">{t('studio.dailyTasks') || '福利'}</span>
          </button>

          {/* Upgrade Button - 始终显示 */}
          <button
            onClick={onUpgradeClick}
            className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-slate-800 to-slate-900 text-yellow-400 border-2 border-yellow-400/30 rounded-lg font-medium hover:border-yellow-400/50 hover:shadow-lg hover:shadow-yellow-400/20 transition-all"
          >
            <Crown className="w-4 h-4" />
            <span className="text-sm hidden xl:inline">{t('studio.upgrade') || '购买/升级'}</span>
          </button>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-300"></div>

          {/* Language Switcher - 桌面端显示完整名称 */}
          <LanguageSwitcher theme="dark" variant="full" showArrow={true} />

          {/* Divider */}
          <div className="h-6 w-px bg-gray-300"></div>

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