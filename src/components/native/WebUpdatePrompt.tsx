/**
 * Web 内容更新提示组件
 *
 * 用于原生 App WebView 中检测 Web 内容版本更新
 * - 对比 localStorage 中的版本与当前版本
 * - 版本不同时显示刷新提示
 * - 用户点击后清除缓存并刷新
 */
'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

// 当前 Web 版本（从环境变量获取）
const CURRENT_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0';
const VERSION_STORAGE_KEY = 'web_content_version';

export default function WebUpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [previousVersion, setPreviousVersion] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    // 仅在客户端运行
    if (typeof window === 'undefined') return;

    // 检查是否在原生 App 中（通过 User-Agent 检测）
    const isNativeApp = navigator.userAgent.includes('VoicicaApp');
    if (!isNativeApp) return;

    // 获取上次存储的版本
    const storedVersion = localStorage.getItem(VERSION_STORAGE_KEY);

    // 如果没有存储版本（首次安装），直接保存当前版本
    if (!storedVersion) {
      localStorage.setItem(VERSION_STORAGE_KEY, CURRENT_VERSION);
      return;
    }

    // 如果版本不同，显示更新提示
    if (storedVersion !== CURRENT_VERSION) {
      setPreviousVersion(storedVersion);
      setShowPrompt(true);
    }
  }, []);

  const handleRefresh = () => {
    // 更新存储的版本
    localStorage.setItem(VERSION_STORAGE_KEY, CURRENT_VERSION);

    // 清除缓存并刷新（使用 location.reload(true) 或强制刷新）
    // 清除 session storage
    sessionStorage.clear();

    // 强制从服务器重新加载
    window.location.href = window.location.href.split('?')[0] + '?_t=' + Date.now();
  };

  const handleDismiss = () => {
    // 更新存储的版本（用户选择稍后，下次不再提示）
    localStorage.setItem(VERSION_STORAGE_KEY, CURRENT_VERSION);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">
                {t('webUpdate.title') || 'Content Updated'}
              </h2>
              <p className="text-white/80 text-sm">
                v{CURRENT_VERSION}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Version Info */}
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
            <span>{t('webUpdate.previousVersion') || 'Previous'}: v{previousVersion}</span>
            <span className="text-purple-600 font-medium">
              → v{CURRENT_VERSION}
            </span>
          </div>

          {/* Description */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {t('webUpdate.description') || 'New features and improvements are available. Refresh to get the latest version.'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {t('webUpdate.later') || 'Later'}
          </button>
          <button
            onClick={handleRefresh}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-colors"
          >
            {t('webUpdate.refresh') || 'Refresh Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
