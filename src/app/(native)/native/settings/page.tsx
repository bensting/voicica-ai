'use client';

import { useRouter } from 'next/navigation';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';

// 返回图标
const BackIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

// 分享图标
const ShareIcon = () => (
  <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
  </svg>
);

// 更新图标
const UpdateIcon = () => (
  <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12a9 9 0 11-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
  </svg>
);

// 隐私图标
const PrivacyIcon = () => (
  <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

// 条款图标
const TermsIcon = () => (
  <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
  </svg>
);

// 退出图标
const LogoutIcon = () => (
  <svg className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
);

// 箭头图标
const ChevronIcon = () => (
  <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

/**
 * Settings 页面
 * 设置中心，包含分享、更新、隐私政策、条款、退出登录
 */
export default function SettingsPage() {
  const router = useRouter();
  const { signOut } = useFirebaseAuth();

  const handleBack = () => {
    router.back();
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/native');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'VoicicaAI',
        text: 'Check out VoicicaAI - AI Voice Generation Platform',
        url: window.location.origin,
      });
    }
  };

  const handleCheckUpdate = () => {
    // 检查更新功能 - 暂不实现
    alert('You are using the latest version!');
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a]">
      {/* 头部 */}
      <header
        className="sticky top-0 z-50 bg-[#0a0a1a]"
        style={{ paddingTop: 'var(--safe-area-inset-top, 0px)' }}
      >
        <div className="flex items-center px-4 h-14">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 text-white hover:text-gray-300 transition-colors"
          >
            <BackIcon />
          </button>
          <h1 className="ml-2 text-lg font-semibold text-white">Settings</h1>
        </div>
      </header>

      {/* 内容 */}
      <div className="px-4 py-4 space-y-4">
        {/* 卡片1: 分享和更新 */}
        <div className="bg-gray-800/50 rounded-2xl overflow-hidden">
          <button
            onClick={handleShare}
            className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <ShareIcon />
              <span className="text-white">Share VoicicaAI</span>
            </div>
            <ChevronIcon />
          </button>
          <div className="h-px bg-gray-700/50 mx-4" />
          <button
            onClick={handleCheckUpdate}
            className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <UpdateIcon />
              <span className="text-white">Check for updates</span>
            </div>
            <ChevronIcon />
          </button>
        </div>

        {/* 卡片2: 隐私政策和条款 */}
        <div className="bg-gray-800/50 rounded-2xl overflow-hidden">
          <button
            onClick={() => router.push('/privacy')}
            className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <PrivacyIcon />
              <span className="text-white">Privacy policy</span>
            </div>
            <ChevronIcon />
          </button>
          <div className="h-px bg-gray-700/50 mx-4" />
          <button
            onClick={() => router.push('/terms')}
            className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <TermsIcon />
              <span className="text-white">Terms of Service</span>
            </div>
            <ChevronIcon />
          </button>
        </div>

        {/* 卡片3: 退出登录 */}
        <div className="bg-gray-800/50 rounded-2xl overflow-hidden">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <LogoutIcon />
              <span className="text-red-400">Log out</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
