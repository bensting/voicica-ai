'use client';

import { useState, useEffect } from 'react';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useCredits } from '@/contexts/CreditsContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import ProfileHeader from '@/components/native/me/ProfileHeader';
import UserStatsBar from '@/components/native/me/UserStatsBar';
import SubscribeCard from '@/components/native/me/SubscribeCard';
import MyCreations from '@/components/native/me/MyCreations';
import LoginModal from '@/components/native/LoginModal';

/**
 * Me 页面
 * 用户个人中心，展示用户信息、订阅状态、作品列表
 */
export default function MePage() {
  const { user, loading } = useFirebaseAuth();
  const { credits } = useCredits();
  const { isSubscribed, activeSubscription } = useSubscription();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [hasShownLoginModal, setHasShownLoginModal] = useState(false);

  const isLoggedIn = !!user;
  const userName = user?.displayName || user?.email?.split('@')[0] || 'Guest';
  const avatarUrl = user?.photoURL || undefined;

  // 获取计划名称
  const getPlanDisplayName = () => {
    if (!isSubscribed || !activeSubscription) {
      return 'Free version';
    }
    // 尝试从 display_name 获取（多语言支持）
    if (activeSubscription.display_name) {
      return activeSubscription.display_name['en'] || activeSubscription.display_name['zh-CN'] || 'Pro';
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

  // 未登录时自动弹出登录框（只弹一次）
  useEffect(() => {
    if (!loading && !isLoggedIn && !hasShownLoginModal) {
      setIsLoginModalOpen(true);
      setHasShownLoginModal(true);
    }
  }, [loading, isLoggedIn, hasShownLoginModal]);

  return (
    <div className="h-screen flex flex-col bg-[#0a0a1a]">
      {/* 固定顶部区域 */}
      <div className="flex-shrink-0">
        {/* 头部区域 */}
        <ProfileHeader
          userName={userName}
          avatarUrl={avatarUrl}
          isLoggedIn={isLoggedIn}
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
