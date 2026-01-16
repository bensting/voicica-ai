'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, ChevronRight, UserPlus, CreditCard, Sparkles, Play } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import CreditsIcon from '@/components/icons/CreditsIcon';
import LoginModal from '@/components/features/auth/LoginModal';
import UpgradeModal from '@/components/features/pricing/UpgradeModal';
import { appConfig } from '@/config/appConfig';

interface CreditsBarProps {
  /** 总积分 */
  credits: number;
  /** 永久积分（购买、注册赠送） */
  permanentCredits?: number;
  /** 当月积分（每日任务） */
  monthlyCredits?: number;
  /** 积分加载中 */
  creditsLoading?: boolean;
  /** 当前字符数 */
  characterCount?: number;
  /** 最大字符数 */
  maxCharacters?: number;
  /** 是否显示字符计数 */
  showCharacterCount?: boolean;
  /** 是否显示清空按钮 */
  showClearButton?: boolean;
  /** 清空回调 */
  onClear?: () => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 打开每日任务模态框回调 */
  onDailyTasksClick?: () => void;
  /** 样式变体：attached（附着在其他元素底部）或 standalone（独立卡片） */
  variant?: 'attached' | 'standalone';
}

/**
 * Credits Bar Component
 *
 * 可复用的积分显示栏组件，显示：
 * - 积分图标 + 积分数量 + "积分"
 * - "免费" 按钮，点击显示下拉菜单（注册、免费积分、订阅）
 * - 可选：清空按钮 + 字符计数
 */
export default function CreditsBar({
  credits,
  permanentCredits = 0,
  monthlyCredits = 0,
  creditsLoading = false,
  characterCount,
  maxCharacters,
  showCharacterCount = false,
  showClearButton = false,
  onClear,
  disabled = false,
  onDailyTasksClick,
  variant = 'attached',
}: CreditsBarProps) {
  const { t } = useLanguage();
  const { user } = useFirebaseAuth();

  // "More" menu state
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  // Modal states
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Track if component has mounted (client-side only)
  const [hasMounted, setHasMounted] = useState(false);

  // Get signup bonus from config
  const signupBonus = appConfig.credits.registered_user;

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isClickInsideButton = moreButtonRef.current?.contains(target);
      const isClickInsideMenu = moreMenuRef.current?.contains(target);
      if (!isClickInsideButton && !isClickInsideMenu) {
        setShowMoreMenu(false);
      }
    };
    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMoreMenu]);

  // Handle opening the menu and calculating position
  const handleToggleMenu = () => {
    if (!showMoreMenu && moreButtonRef.current) {
      const rect = moreButtonRef.current.getBoundingClientRect();
      const menuWidth = 240; // w-60 = 15rem = 240px
      const viewportWidth = window.innerWidth;

      // Calculate left position, ensuring menu stays within viewport
      let left = rect.left;
      if (left + menuWidth > viewportWidth - 16) {
        // If menu would overflow right, align to right edge with padding
        left = viewportWidth - menuWidth - 16;
      }

      setMenuPosition({
        top: rect.top - 8, // 8px gap above the button
        left: Math.max(16, left), // Ensure at least 16px from left edge
      });
    }
    setShowMoreMenu(!showMoreMenu);
  };

  // 根据 variant 选择样式
  const containerClassName = variant === 'standalone'
    ? 'flex items-center justify-between px-4 py-3 bg-purple-50 rounded-2xl'
    : 'flex items-center justify-between px-4 py-3 bg-purple-50 border-t border-purple-100 rounded-b-2xl';

  return (
    <>
      <div className={containerClassName}>
        {/* Left: Credits display and More Menu */}
        <div className="flex items-center gap-1.5 relative" ref={moreMenuRef}>
          <CreditsIcon className="w-4 h-4 lg:w-5 lg:h-5 text-amber-500" />
          <span className="text-sm lg:text-base font-medium text-gray-700 group/credits relative">
            {creditsLoading ? (
              <span className="inline-flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            ) : (
              <span className="cursor-default">
                {credits.toLocaleString()}
                {/* 已登录用户：hover 时显示积分明细 tooltip */}
                {user && (
                  <span className="absolute left-0 bottom-full mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg whitespace-nowrap opacity-0 invisible group-hover/credits:opacity-100 group-hover/credits:visible transition-all duration-200 z-50">
                    <span className="flex flex-col gap-1">
                      <span className="flex items-center justify-between gap-4">
                        <span className="text-gray-300">{t('tts.input.permanent')}:</span>
                        <span className="font-medium">{permanentCredits.toLocaleString()}</span>
                      </span>
                      <span className="flex items-center justify-between gap-4">
                        <span className="text-gray-300">{t('tts.input.monthly')}:</span>
                        <span className="font-medium">{monthlyCredits.toLocaleString()}</span>
                      </span>
                    </span>
                    {/* Tooltip arrow */}
                    <span className="absolute left-4 top-full border-4 border-transparent border-t-gray-800" />
                  </span>
                )}
              </span>
            )}{' '}
            {t('tts.input.creditsLeft')}
          </span>

          {/* More chip - show for all users */}
          <button
            ref={moreButtonRef}
            type="button"
            onClick={handleToggleMenu}
            className="ml-1 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white text-xs font-medium rounded-full transition-all shadow-sm flex items-center gap-0.5"
          >
            <Sparkles className="w-3 h-3" />
            <span>{t('tts.input.more') || 'More'}</span>
          </button>

        </div>

        {/* Right: Clear button and Character count */}
        <div className="flex items-center gap-2">
          {/* Clear button */}
          {showClearButton && hasMounted && characterCount !== undefined && characterCount > 0 && (
            <button
              type="button"
              onClick={onClear}
              disabled={disabled}
              className="p-1 hover:bg-purple-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
              aria-label="Clear text"
            >
              <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
            </button>
          )}

          {/* Character count */}
          {showCharacterCount && maxCharacters !== undefined && (
            <span className="text-gray-400 text-sm font-normal">
              {hasMounted ? (characterCount || 0) : 0} / {maxCharacters}
            </span>
          )}
        </div>
      </div>

      {/* Floating menu dropdown - rendered via portal to body */}
      {hasMounted && showMoreMenu && createPortal(
        <div
          ref={moreMenuRef}
          className="fixed w-60 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-[9999] animate-in fade-in slide-in-from-bottom-2 duration-200"
          style={{
            top: menuPosition.top,
            left: menuPosition.left,
            transform: 'translateY(-100%)',
          }}
        >
          {/* Menu header */}
          <div className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500">
            <p className="text-xs font-medium text-white/90">{t('tts.input.moreMenu.title') || 'Get more credits'}</p>
          </div>

          {/* Menu items */}
          <div className="p-2 space-y-1">
            {/* Sign up option - only for non-logged-in users */}
            {!user && (
              <button
                type="button"
                onClick={() => {
                  setShowMoreMenu(false);
                  setIsLoginModalOpen(true);
                }}
                className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 rounded-xl transition-all group"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all">
                  <UserPlus className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{t('tts.input.moreMenu.signUp') || 'Sign up free'}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {t('tts.input.moreMenu.signUpDesc', { credits: signupBonus }) || `Get ${signupBonus} free credits`}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </button>
            )}

            {/* Free Credits option - watch videos to earn credits */}
            {onDailyTasksClick && (
              <button
                type="button"
                onClick={() => {
                  setShowMoreMenu(false);
                  onDailyTasksClick();
                }}
                className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-gradient-to-r hover:from-pink-50 hover:to-pink-100 rounded-xl transition-all group"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all">
                  <Play className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{t('tts.input.moreMenu.freeCredits') || 'Free Credits'}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {t('tts.input.moreMenu.freeCreditsDesc') || 'Watch videos'}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-pink-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </button>
            )}

            {/* View pricing option - show for all users */}
            <button
              type="button"
              onClick={() => {
                setShowMoreMenu(false);
                setIsUpgradeModalOpen(true);
              }}
              className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 rounded-xl transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all">
                <CreditCard className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-semibold text-gray-800">{t('tts.input.moreMenu.pricing') || 'View pricing'}</p>
                <p className="text-xs text-gray-500 truncate">{t('tts.input.moreMenu.pricingDesc') || 'Explore subscription plans'}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Login Modal - rendered via portal to body */}
      {hasMounted && isLoginModalOpen && createPortal(
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
        />,
        document.body
      )}

      {/* Upgrade Modal - rendered via portal to body */}
      {hasMounted && isUpgradeModalOpen && createPortal(
        <UpgradeModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
        />,
        document.body
      )}
    </>
  );
}
