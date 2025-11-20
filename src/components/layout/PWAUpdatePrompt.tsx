'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PWAUpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    // 检查浏览器是否支持 Service Worker
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // 监听 Service Worker 更新
    navigator.serviceWorker.ready.then((registration) => {
      // 检查是否有等待中的 Service Worker
      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
        setShowPrompt(true);
      }

      // 监听新的 Service Worker 安装
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // 有新版本可用
            setWaitingWorker(newWorker);
            setShowPrompt(true);
          }
        });
      });
    });

    // 监听来自 Service Worker 的消息
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Service Worker 已更新,刷新页面
      window.location.reload();
    });

    // 定期检查更新(每小时)
    const interval = setInterval(() => {
      navigator.serviceWorker.ready.then((registration) => {
        registration.update();
      });
    }, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleUpdate = () => {
    if (!waitingWorker) return;

    // 向等待中的 Service Worker 发送消息,让它跳过等待
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-gray-200 shadow-lg lg:bottom-4 lg:left-4 lg:right-auto lg:max-w-md lg:rounded-lg lg:border">
      <div className="flex items-start gap-4">
        {/* 图标 */}
        <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
          <svg
            className="w-6 h-6 text-purple-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">
            {t('pwa.updateAvailable') || 'New version available'}
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            {t('pwa.updateDescription') || 'A new version of the app is available. Click update to get the latest features and improvements.'}
          </p>

          {/* 操作按钮 */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleUpdate}
              className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              {t('pwa.update') || 'Update now'}
            </button>
            <button
              onClick={handleDismiss}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              {t('pwa.later') || 'Later'}
            </button>
          </div>
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}