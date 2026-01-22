'use client';

import { useState, useEffect } from 'react';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useCredits } from '@/contexts/CreditsContext';
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
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [hasShownLoginModal, setHasShownLoginModal] = useState(false);

  const isLoggedIn = !!user;
  const userName = user?.displayName || user?.email?.split('@')[0] || 'Guest';
  const avatarUrl = user?.photoURL || undefined;

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
          planName="Free version"
          credits={credits}
        />

        {/* 订阅推广卡片 */}
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
