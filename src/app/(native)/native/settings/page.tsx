'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import nativeVersion from '@/native-version.json';

// 支持的语言列表
const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'th', name: 'Thai', nativeName: 'ภาษาไทย' },
];

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

// 语言图标
const LanguageIcon = () => (
  <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
  </svg>
);

// 选中图标
const CheckIcon = () => (
  <svg className="w-5 h-5 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 6L9 17l-5-5" />
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
  const { user, signOut } = useFirebaseAuth();
  const isLoggedIn = !!user;
  const [showLanguageSheet, setShowLanguageSheet] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const currentLanguage = languages.find(l => l.code === selectedLanguage);

  const handleBack = () => {
    router.back();
  };

  const handleLanguageSelect = (code: string) => {
    setSelectedLanguage(code);
    setShowLanguageSheet(false);
    // TODO: 实现语言切换功能
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
          <div className="h-px bg-gray-700/50 mx-4" />
          <button
            onClick={() => setShowLanguageSheet(true)}
            className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <LanguageIcon />
              <span className="text-white">Language</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">{currentLanguage?.nativeName}</span>
              <ChevronIcon />
            </div>
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

        {/* 卡片3: 退出登录 - 仅登录后显示 */}
        {isLoggedIn && (
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
        )}

        {/* 版本号 */}
        <div className="pt-8 pb-4 text-center">
          <p className="text-gray-500 text-sm">
            Version {nativeVersion.version} ({nativeVersion.buildNumber})
          </p>
        </div>
      </div>

      {/* 语言选择 Sheet */}
      {showLanguageSheet && (
        <div className="fixed inset-0 z-50">
          {/* 背景遮罩 */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowLanguageSheet(false)}
          />
          {/* Sheet 内容 */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-[#1a1a2e] rounded-t-3xl max-h-[70vh] flex flex-col animate-slide-up"
            style={{ paddingBottom: 'var(--safe-area-inset-bottom, 0px)' }}
          >
            {/* 拖动条 */}
            <div className="flex justify-center py-3">
              <div className="w-10 h-1 bg-gray-600 rounded-full" />
            </div>
            {/* 标题 */}
            <div className="px-4 pb-3 border-b border-gray-700/50">
              <h3 className="text-lg font-semibold text-white text-center">Select Language</h3>
            </div>
            {/* 语言列表 */}
            <div className="flex-1 overflow-y-auto px-4 py-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageSelect(lang.code)}
                  className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-700/30 rounded-xl transition-colors"
                >
                  <div className="flex flex-col items-start">
                    <span className="text-white font-medium">{lang.nativeName}</span>
                    <span className="text-gray-500 text-sm">{lang.name}</span>
                  </div>
                  {selectedLanguage === lang.code && <CheckIcon />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
