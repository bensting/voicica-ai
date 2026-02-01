'use client';

import { useRouter } from 'next/navigation';

// 设置图标
const SettingsIcon = () => (
  <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

// 默认头像
const DefaultAvatar = () => (
  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center border-2 border-purple-500/30">
    <svg className="w-10 h-10 text-white/80" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 10-16 0" />
    </svg>
  </div>
);

interface ProfileHeaderProps {
  userName?: string;
  avatarUrl?: string;
  isLoggedIn?: boolean;
  onAvatarClick?: () => void;
}

/**
 * Me 页面头部区域
 * 包含头像、用户名、设置按钮
 */
export default function ProfileHeader({
  userName,
  avatarUrl,
  isLoggedIn = false,
  onAvatarClick,
}: ProfileHeaderProps) {
  const router = useRouter();

  const handleAvatarClick = () => {
    if (!isLoggedIn && onAvatarClick) {
      onAvatarClick();
    }
  };

  const handleSettingsClick = () => {
    router.push('/native/settings');
  };

  return (
    <div
      className="relative pb-2"
      style={{ paddingTop: 'calc(16px + var(--safe-area-inset-top, 0px))' }}
    >
      {/* 背景渐变 */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/40 via-pink-900/20 to-transparent pointer-events-none" />

      {/* 设置按钮 */}
      <button
        onClick={handleSettingsClick}
        className="absolute right-4 z-50 p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 transition-colors cursor-pointer"
        style={{ top: 'calc(16px + var(--safe-area-inset-top, 0px))' }}
      >
        <SettingsIcon />
      </button>

      {/* 头像和用户名 */}
      <div className="relative z-10 flex flex-col items-center">
        <button
          onClick={handleAvatarClick}
          disabled={isLoggedIn}
          className={`${!isLoggedIn ? 'cursor-pointer active:scale-95 transition-transform' : ''}`}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={userName}
              className="w-20 h-20 rounded-full border-2 border-purple-500/30 object-cover"
            />
          ) : (
            <DefaultAvatar />
          )}
        </button>
        <h1 className="mt-3 text-xl font-semibold text-white">{userName}</h1>
      </div>
    </div>
  );
}
