'use client';

import { useState, useRef, useEffect } from 'react';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import UserMenuItem from './UserMenuItem';
import { userMenuItems } from '@/config/userMenuConfig';
import LoginModal from '@/components/features/auth/LoginModal';

interface UserMenuProps {
  size?: 'sm' | 'md';
}

/**
 * 用户菜单组件
 *
 * 显示用户头像和下拉菜单
 */
export default function UserMenu({ size = 'md' }: UserMenuProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useFirebaseAuth();
  const { t } = useLanguage();
  const router = useRouter();

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 处理菜单项点击
  const handleMenuItemClick = async (item: typeof userMenuItems[0]) => {
    setIsOpen(false);

    if (item.action === 'signout') {
      try {
        await signOut();
        // 退出后留在当前页面，由页面自己决定是否需要登录
        // 不再跳转到首页
      } catch (error) {
        console.error('Sign out error:', error);
      }
    } else if (item.href) {
      router.push(item.href);
    }
  };

  // 头像尺寸
  const avatarSize = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const iconSize = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6';

  // 未登录状态：显示登录按钮，点击弹出模态框
  if (!user) {
    return (
      <>
        <button
          onClick={() => setIsLoginModalOpen(true)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          aria-label="Sign in"
        >
          <div className={`${avatarSize} rounded-full bg-gray-200 flex items-center justify-center`}>
            <svg
              className={`${iconSize} text-gray-600`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        </button>

        {/* 登录模态框 */}
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
        />
      </>
    );
  }

  const imageSize = size === 'sm' ? 32 : 40;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 用户头像按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        aria-label="User menu"
      >
        {user.photoURL ? (
          <Image
            src={user.photoURL}
            alt={user.displayName || 'User'}
            width={imageSize}
            height={imageSize}
            className={`${avatarSize} rounded-full border-2 border-gray-200 object-cover`}
          />
        ) : (
          <div className={`${avatarSize} rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold ${size === 'sm' ? 'text-sm' : ''}`}>
            {user.email?.charAt(0).toUpperCase()}
          </div>
        )}
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {/* 用户信息 */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {user.displayName || 'User'}
                </p>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>

          {/* 菜单项 */}
          <div className="py-1">
            {userMenuItems.map((item) => (
              <UserMenuItem
                key={item.id}
                icon={item.icon}
                label={t(item.labelKey)}
                onClick={() => handleMenuItemClick(item)}
                variant={item.variant}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}