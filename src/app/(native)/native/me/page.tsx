'use client';

import { useState } from 'react';
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
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // TODO: 从 AuthContext 获取真实用户状态
  const isLoggedIn = false;
  const user = {
    name: 'Guest',
    avatar: undefined,
    plan: 'Free version',
    credits: 0,
  };

  return (
    <div className="min-h-screen">
      {/* 头部区域 */}
      <ProfileHeader
        userName={user.name}
        avatarUrl={user.avatar}
        isLoggedIn={isLoggedIn}
      />

      {/* 用户信息栏 */}
      <UserStatsBar planName={user.plan} credits={user.credits} />

      {/* 订阅推广卡片 */}
      <SubscribeCard />

      {/* 我的作品 */}
      <MyCreations />

      {/* 登录弹窗 */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}
