'use client';

import { Mic, Coins, Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import LanguageSwitcher from '@/components/layout/Navbar/LanguageSwitcher';
import UserMenu from '@/components/layout/Navbar/UserMenu';
import LoginButton from '@/components/layout/Navbar/LoginButton';

interface StudioToolbarProps {
  title: string;
  onUpgradeClick?: () => void;
}

/**
 * Studio Topbar Component
 *
 * Displays:
 * - Studio feature title with icon
 * - User credits (from user profile)
 * - Upgrade button
 * - Language switcher
 * - User menu / Login button
 */
export default function StudioTopbar({
  title,
  onUpgradeClick,
}: StudioToolbarProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUser();

  // 积分数据从 user profile 获取
  const credits = profile?.credits ?? 0;
  const creditsLoading = profileLoading;

  return (
    <div className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3">
      {/* Left: Icon + Text */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
          <Mic className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      </div>

      {/* Right: Credits + Upgrade + Language + User/Login */}
      <div className="flex items-center gap-3">
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
              <span className="text-sm hidden md:inline">{t('studio.upgrade') || '购买/升级'}</span>
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
  );
}