'use client';

import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useCredits } from '@/contexts/CreditsContext';
import ProfileHeader from '@/components/native/me/ProfileHeader';
import UserStatsBar from '@/components/native/me/UserStatsBar';
import SubscribeCard from '@/components/native/me/SubscribeCard';
import MyCreations from '@/components/native/me/MyCreations';

/**
 * Me 页面
 * 用户个人中心，展示用户信息、订阅状态、作品列表
 */
export default function MePage() {
  const { user } = useFirebaseAuth();
  const { credits } = useCredits();

  const isLoggedIn = !!user;
  const userName = user?.displayName || user?.email?.split('@')[0] || 'Guest';
  const avatarUrl = user?.photoURL || undefined;

  return (
    <div className="min-h-screen">
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

      {/* 我的作品 */}
      <MyCreations />
    </div>
  );
}
