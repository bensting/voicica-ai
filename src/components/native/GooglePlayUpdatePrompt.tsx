'use client';

/**
 * Google Play 应用更新提示组件
 *
 * 采用 Flexible 更新模式：
 * - 检测到更新后自动后台下载
 * - 下载完成后显示底部 Snackbar 提示
 * - 用户可选择"立即安装"或"稍后"
 */

import { useEffect, useState } from 'react';
import { useGooglePlayUpdate } from '@/hooks/useGooglePlayUpdate';
import { useLanguage } from '@/contexts/LanguageContext';

export function GooglePlayUpdatePrompt() {
  const {
    status,
    isAndroid,
    hasUpdate,
    isReadyToInstall,
    startUpdate,
    completeUpdate,
  } = useGooglePlayUpdate();
  const { t } = useLanguage();
  const [dismissed, setDismissed] = useState(false);

  // 检测到更新时自动开始后台下载
  useEffect(() => {
    if (status === 'available') {
      console.log('[GooglePlayUpdatePrompt] 检测到更新，自动开始后台下载');
      startUpdate();
    }
  }, [status, startUpdate]);

  // 用户关闭提示后，本次会话不再显示
  const handleDismiss = () => {
    setDismissed(true);
  };

  // 点击安装
  const handleInstall = async () => {
    await completeUpdate();
  };

  // 不在 Android 环境，或没有更新，或已关闭，或还没下载完成
  if (!isAndroid || !hasUpdate || dismissed || !isReadyToInstall) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9998] p-4 pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        {/* Snackbar */}
        <div className="bg-gray-900 dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
          <div className="px-4 py-3 flex items-center gap-3">
            {/* Icon */}
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm">
                {t('googlePlayUpdate.updateReady')}
              </p>
              <p className="text-gray-400 text-xs truncate">
                {t('googlePlayUpdate.downloadComplete')}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 text-gray-400 hover:text-white text-sm font-medium transition-colors"
              >
                {t('googlePlayUpdate.later')}
              </button>
              <button
                onClick={handleInstall}
                className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors"
              >
                {t('googlePlayUpdate.install')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Animation styles */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default GooglePlayUpdatePrompt;