'use client';

import { useState, useEffect, useRef } from 'react';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useCredits } from '@/contexts/CreditsContext';
import { useLanguage } from '@/contexts/LanguageContext';
import ProfileHeader from '@/components/native/me/ProfileHeader';
import UserStatsBar from '@/components/native/me/UserStatsBar';
import SubscribeCard from '@/components/native/me/SubscribeCard';
import MyCreations from '@/components/native/me/MyCreations';
import LoginModal from '@/components/native/LoginModal';

// localStorage key for tracking login modal last shown time
const LOGIN_MODAL_LAST_SHOWN_KEY = 'me_page_login_modal_last_shown';
const LOGIN_MODAL_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Me 页面内容组件
 * 从 MePage 提取，供 NativeLayout 直接渲染以保持 Tab 切换状态
 */
export default function MePageContent() {
  const { user, loading } = useFirebaseAuth();
  const { credits, loading: creditsLoading, refreshCredits } = useCredits();
  const { t } = useLanguage();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  // 使用 ref 跟踪是否已经显示过登录框，防止重复弹出
  const hasShownRef = useRef(false);

  const isLoggedIn = !!user;
  const guestName = t('native.me.guest');
  const userName = user?.displayName || user?.email?.split('@')[0] || guestName;
  const avatarUrl = user?.photoURL || undefined;

  // 每次进入 Me 页面时刷新积分（确保显示最新值）
  useEffect(() => {
    if (!loading) {
      refreshCredits();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // 登录成功时清除标记，下次退出登录后访问会重新弹出
  useEffect(() => {
    if (isLoggedIn) {
      localStorage.removeItem(LOGIN_MODAL_LAST_SHOWN_KEY);
      hasShownRef.current = false;
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

        {/* VOICICA 余额 */}
        <UserStatsBar
          credits={credits}
          creditsLoading={creditsLoading}
        />

        {/* 购买 VOICICA 推广卡片 */}
        <SubscribeCard />
      </div>

      {/* 可滚动的作品区域 */}
      <div className="flex-1 overflow-hidden">
        <MyCreations />
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
