'use client';

import { useState, useEffect, useRef } from 'react';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useCredits } from '@/contexts/CreditsContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useLanguage } from '@/contexts/LanguageContext';
import ProfileHeader from '@/components/native/me/ProfileHeader';
import UserStatsBar from '@/components/native/me/UserStatsBar';
import SubscribeCard from '@/components/native/me/SubscribeCard';
import MyCreations from '@/components/native/me/MyCreations';
import LoginModal from '@/components/native/LoginModal';

// Session storage key for tracking login modal
const LOGIN_MODAL_SHOWN_KEY = 'me_page_login_modal_shown';

/**
 * Me 页面
 * 用户个人中心，展示用户信息、订阅状态、作品列表
 */
export default function MePage() {
  const { user, loading } = useFirebaseAuth();
  const { credits } = useCredits();
  const { isSubscribed, activeSubscription } = useSubscription();
  const { t, locale } = useLanguage();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  // 使用 ref 跟踪是否已经显示过登录框，防止重复弹出
  const hasShownRef = useRef(false);

  const isLoggedIn = !!user;
  const guestName = t('native.me.guest');
  const userName = user?.displayName || user?.email?.split('@')[0] || guestName;
  const avatarUrl = user?.photoURL || undefined;

  // 获取计划名称
  const getPlanDisplayName = () => {
    if (!isSubscribed || !activeSubscription) {
      return t('native.me.freeVersion');
    }
    // 尝试从 display_name 获取（多语言支持）
    if (activeSubscription.display_name) {
      return activeSubscription.display_name[locale] || activeSubscription.display_name['en'] || 'Pro';
    }
    // 从 product_type 推断计划名称
    if (activeSubscription.product_type) {
      const typeMap: Record<string, string> = {
        'starter': 'Starter',
        'creator': 'Creator',
        'pro': 'Pro',
      };
      return typeMap[activeSubscription.product_type] || 'Pro';
    }
    return 'Pro';
  };
  const planName = getPlanDisplayName();

  // 登录成功时清除 sessionStorage 标记
  useEffect(() => {
    if (isLoggedIn) {
      sessionStorage.removeItem(LOGIN_MODAL_SHOWN_KEY);
      hasShownRef.current = false;
    }
  }, [isLoggedIn]);

  // 未登录时自动弹出登录框（只弹一次，使用 sessionStorage 防止重复）
  useEffect(() => {
    if (!loading && !isLoggedIn) {
      // 检查 sessionStorage 和 ref，确保只弹一次
      const alreadyShown = sessionStorage.getItem(LOGIN_MODAL_SHOWN_KEY) === 'true' || hasShownRef.current;
      if (!alreadyShown) {
        setIsLoginModalOpen(true);
        sessionStorage.setItem(LOGIN_MODAL_SHOWN_KEY, 'true');
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

        {/* 用户信息栏 */}
        <UserStatsBar
          planName={planName}
          credits={credits}
        />

        {/* 订阅推广卡片 - 仅未订阅时显示 */}
        {!isSubscribed && <SubscribeCard />}
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
