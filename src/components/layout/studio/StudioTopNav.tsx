'use client';

import { Menu, X, Coins, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import LanguageSwitcher from '@/components/layout/Navbar/LanguageSwitcher';
import UserMenu from '@/components/layout/Navbar/UserMenu';
import LoginButton from '@/components/layout/Navbar/LoginButton';
import Link from 'next/link';

interface StudioTopNavProps {
  /** 升级按钮回调（桌面端显示） */
  onUpgradeClick?: () => void;
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
 * - Pricing button
 * - Language switcher
 * - User menu
 *
 * 桌面端样式：
 * - Logo (左侧)
 * - Credits + Upgrade + Language + User/Login (右侧)
 */
export default function StudioTopNav({
  onUpgradeClick,
  isMenuOpen = false,
  onMenuToggle
}: StudioTopNavProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUser();

  // 积分数据从 user profile 获取
  const credits = profile?.credits ?? 0;
  const creditsLoading = profileLoading;

  const toggleMenu = () => {
    onMenuToggle?.(!isMenuOpen);
  };

  const handlePricingClick = () => {
    router.push('/pricing');
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-white lg:bg-gradient-to-r lg:from-purple-50 lg:to-blue-50 border-b border-gray-200">
      <div className="flex items-center justify-between px-3 py-2.5 lg:px-4 lg:py-3 gap-2">
        {/* ========== 左侧：Hamburger Menu (移动端) + Logo (移动端和桌面端) ========== */}
        <div className="flex items-center gap-1.5 flex-shrink min-w-0">
          {/* Hamburger Menu - 仅移动端显示 */}
          <button
            onClick={toggleMenu}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 lg:hidden"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>

          {/* Logo - 移动端和桌面端都显示 */}
          <Link href="/" className="flex items-center min-w-0">
            <Image
              src="/logo/voice-labs-logo-light.svg"
              alt="Voice-Labs.AI"
              width={180}
              height={28}
              priority
              className="h-7 w-auto"
            />
          </Link>
        </div>

        {/* ========== 移动端右侧 (< lg) ========== */}
        <div className="flex items-center gap-1 flex-shrink-0 lg:hidden">
          {/* Pricing Button */}
          <button
            onClick={handlePricingClick}
            className="px-2.5 py-1.5 text-xs font-medium text-purple-600 border border-purple-200 rounded-full hover:bg-purple-50 transition-colors"
          >
            Pricing
          </button>

          {/* Language Switcher */}
          <div className="flex items-center px-1">
            <LanguageSwitcher theme="dark" variant="compact" showArrow={false} />
          </div>

          {/* User Menu */}
          <UserMenu size="sm" />
        </div>

        {/* ========== 桌面端右侧 (>= lg) ========== */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Credits Display - 只在已登录时显示 */}
          {user && (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 rounded-lg">
                <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                  <Coins className="w-3 h-3 text-white" />
                </div>
                {creditsLoading ? (
                  <div className="w-12 h-4 bg-blue-200 rounded animate-pulse" />
                ) : (
                  <span className="text-sm font-semibold text-blue-900">
                    {credits}
                  </span>
                )}
              </div>

              {/* Divider */}
              <div className="h-6 w-px bg-gray-300"></div>

              {/* Upgrade Button */}
              <button
                onClick={onUpgradeClick}
                className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all shadow-sm"
              >
                <Star className="w-4 h-4" />
                <span className="text-sm hidden xl:inline">{t('studio.upgrade') || '购买/升级'}</span>
              </button>

              {/* Divider */}
              <div className="h-6 w-px bg-gray-300"></div>
            </>
          )}

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