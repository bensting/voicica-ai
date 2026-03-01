'use client';

import { useState, useEffect, useRef } from 'react';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useCredits } from '@/contexts/CreditsContext';
import { useLanguage } from '@/contexts/LanguageContext';
import ProfileHeader from '@/components/native/me/ProfileHeader';
import UserStatsBar from '@/components/native/me/UserStatsBar';
import MyCreations from '@/components/native/me/MyCreations';
import LoginModal from '@/components/native/LoginModal';

// localStorage key for tracking login modal last shown time
const LOGIN_MODAL_LAST_SHOWN_KEY = 'me_page_login_modal_last_shown';
const LOGIN_MODAL_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Me 页面内容组件
 * 从 MePage 提取，供 NativeLayout 直接渲染以保持 Tab 切换状态
 */
export default function MePageContent({ isActive }: { isActive?: boolean }) {
  const { user, loading } = useFirebaseAuth();
  const { credits, loading: creditsLoading } = useCredits();
  const { t } = useLanguage();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  // 使用 ref 跟踪是否已经显示过登录框，防止重复弹出
  const hasShownRef = useRef(false);

  const isLoggedIn = !!user;
  const guestName = t('native.me.guest');
  const userName = user?.displayName || user?.email?.split('@')[0] || guestName;
  const avatarUrl = user?.photoURL || undefined;

  // 登录成功时清除 localStorage 标记（下次退出后 24h 逻辑重新生效）
  // 注意：不重置 hasShownRef，防止 auth 状态闪烁导致重复弹窗
  useEffect(() => {
    if (isLoggedIn) {
      localStorage.removeItem(LOGIN_MODAL_LAST_SHOWN_KEY);
    }
  }, [isLoggedIn]);

  // 未登录时自动弹出登录框（24小时内只弹一次）
  useEffect(() => {
    if (!loading && !isLoggedIn && !hasShownRef.current) {
      const lastShown = parseInt(localStorage.getItem(LOGIN_MODAL_LAST_SHOWN_KEY) || '0', 10);
      if (Date.now() - lastShown >= LOGIN_MODAL_INTERVAL_MS) {
        setIsLoginModalOpen(true);
        localStorage.setItem(LOGIN_MODAL_LAST_SHOWN_KEY, String(Date.now()));
        hasShownRef.current = true;
      }
    }
  }, [loading, isLoggedIn]);

  return (
    <div className="h-screen flex flex-col bg-[#0a0a1a]">
      {/* 固定顶部区域 */}
      <div className="flex-shrink-0">
        {/* 头部区域 */}
        <ProfileHeader
          userName={userName}
          avatarUrl={avatarUrl}
          isLoggedIn={isLoggedIn}
          onAvatarClick={() => setIsLoginModalOpen(true)}
        />

        {/* VOICICA 余额 + BUY */}
        <UserStatsBar
          credits={credits}
          creditsLoading={creditsLoading}
        />
      </div>

      {/* 可滚动的作品区域 */}
      <div className="flex-1 overflow-hidden">
        <MyCreations isActive={isActive} />
      </div>

      {/* 登录弹窗 - 未登录时自动弹出 */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}
