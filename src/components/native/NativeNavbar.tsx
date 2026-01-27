'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useCredits } from '@/contexts/CreditsContext';
import { useBottomNav } from '@/contexts/BottomNavContext';
import { useDailyTasks } from '@/hooks/useDailyTasks';
import LoginModal from './LoginModal';
import NativeDailyTasksModal from './NativeDailyTasksModal';
import CrownIcon from './common/CrownIcon';
import CreditsIcon from './common/CreditsIcon';

// 宝箱图标
const TreasureIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 10h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V10z" fill="currentColor" fillOpacity="0.2" />
    <path d="M3 10h18M3 10V8a2 2 0 012-2h14a2 2 0 012 2v2M12 10v5M9 15h6" />
    <path d="M7 6V4a2 2 0 012-2h6a2 2 0 012 2v2" />
  </svg>
);

/**
 * Native App 顶部导航栏
 * 包含 Logo 和 Login & Rewards 按钮
 * 支持通过 Context 控制显示/隐藏
 */
export default function NativeNavbar() {
  const router = useRouter();
  const { user } = useFirebaseAuth();
  const { credits, refreshCredits } = useCredits();
  const { isTopNavVisible } = useBottomNav();
  const { shouldShowPopup, status, config } = useDailyTasks();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isDailyTasksOpen, setIsDailyTasksOpen] = useState(false);
  const [hasAutoShown, setHasAutoShown] = useState(false);

  const isLoggedIn = !!user;

  // 自动弹出每日任务弹窗（每30分钟，有未领奖励时）
  useEffect(() => {
    if (shouldShowPopup && !isDailyTasksOpen && !hasAutoShown) {
      setIsDailyTasksOpen(true);
      setHasAutoShown(true);
    }
  }, [shouldShowPopup, isDailyTasksOpen, hasAutoShown]);

  // 判断是否有未领取的奖励（用于显示小红点）
  const hasUnclaimedRewards = status
    ? !status.checkinDone || status.adRewardsClaimed < (config?.ad_reward_tiers?.length || 0)
    : true; // 未加载时默认显示

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

            {/* 每日任务按钮 - 宝箱 + FREE */}
            <button
              onClick={() => setIsDailyTasksOpen(true)}
              className="relative flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 hover:from-amber-500/30 hover:to-orange-500/30 transition-all active:scale-95"
            >
              <TreasureIcon />
              <span className="text-xs font-bold text-amber-400">FREE</span>
              {/* 小红点提示 - 有未领取的奖励时显示 */}
              {hasUnclaimedRewards && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>
          </div>

          {/* 右侧区域 */}
          {isLoggedIn ? (
            /* 已登录：显示积分 */
            <button
              onClick={() => router.push('/native/subscribe')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-95"
            >
              <CrownIcon className="w-4 h-4 text-amber-400" />
              <span className="text-white/20">|</span>
              <CreditsIcon className="w-3.5 h-3.5 text-purple-400" />
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
          // 设置标记防止 Me 页面再次弹出登录框
          sessionStorage.setItem('me_page_login_modal_shown', 'true');
          router.push('/native/me');
        }}
      />

      {/* 每日任务弹窗 */}
      <NativeDailyTasksModal
        isOpen={isDailyTasksOpen}
        onClose={() => setIsDailyTasksOpen(false)}
        onCreditsUpdated={refreshCredits}
      />
    </>
  );
}
