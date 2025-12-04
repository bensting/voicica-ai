
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

// 版本检查间隔（毫秒）
const VERSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 分钟

/**
 * Server Action 错误处理 + 主动版本检测组件
 *
 * 功能：
 * 1. 被动检测：监听 Server Action 版本不匹配错误
 * 2. 主动检测：定期检查服务器版本，发现更新时提示用户
 */
export default function ServerActionErrorHandler() {
  const [showRefreshPrompt, setShowRefreshPrompt] = useState(false);
  const { t } = useLanguage();
  const initialBuildIdRef = useRef<string | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleRefresh = useCallback(() => {
    // 清除缓存并刷新
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name);
        });
      });
    }
    window.location.reload();
  }, []);

  const handleDismiss = useCallback(() => {
    setShowRefreshPrompt(false);
  }, []);

  // 主动版本检测
  useEffect(() => {
    const checkVersion = async () => {
      try {
        // 添加时间戳避免缓存
        const response = await fetch(`/build-info.json?t=${Date.now()}`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          // 文件不存在时静默忽略（可能是开发环境）
          return;
        }

        const data = await response.json();
        const serverBuildId = data.buildId;

        if (!serverBuildId) return;

        // 首次加载，记录当前版本
        if (initialBuildIdRef.current === null) {
          initialBuildIdRef.current = serverBuildId;
          console.log('[VersionCheck] 初始版本:', serverBuildId);
          return;
        }

        // 版本发生变化
        if (initialBuildIdRef.current !== serverBuildId) {
          console.log('[VersionCheck] 检测到新版本:', {
            current: initialBuildIdRef.current,
            server: serverBuildId,
          });
          setShowRefreshPrompt(true);

          // 停止继续检查
          if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current);
            checkIntervalRef.current = null;
          }
        }
      } catch (error) {
        // 网络错误时静默忽略
        console.debug('[VersionCheck] 检查失败:', error);
      }
    };

    // 初始检查
    checkVersion();

    // 定期检查
    checkIntervalRef.current = setInterval(checkVersion, VERSION_CHECK_INTERVAL);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

  // 被动错误监听
  useEffect(() => {
    // 监听全局错误
    const handleError = (event: ErrorEvent) => {
      const message = event.message || '';
      // 检测 Server Action 错误
      if (
        message.includes('Failed to find Server Action') ||
        message.includes('Server Action') ||
        message.includes('older or newer deployment')
      ) {
        console.warn('[ServerActionErrorHandler] 检测到版本不匹配，提示用户刷新');
        setShowRefreshPrompt(true);
        event.preventDefault();
      }
    };

    // 监听未处理的 Promise 拒绝（Server Action 错误可能以这种形式出现）
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.message || event.reason?.toString() || '';
      if (
        reason.includes('Failed to find Server Action') ||
        reason.includes('Server Action') ||
        reason.includes('older or newer deployment')
      ) {
        console.warn('[ServerActionErrorHandler] 检测到版本不匹配（Promise），提示用户刷新');
        setShowRefreshPrompt(true);
        event.preventDefault();
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (!showRefreshPrompt) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-purple-100 rounded-full">
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

        <h3 className="text-lg font-semibold text-center text-gray-900 mb-2">
          {t('app.updateAvailable') || 'Update Available'}
        </h3>

        <p className="text-sm text-center text-gray-600 mb-6">
          {t('app.refreshRequired') || 'A new version is available. Please refresh to continue.'}
        </p>

        <div className="flex gap-3">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {t('common.later') || 'Later'}
          </button>
          <button
            onClick={handleRefresh}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
          >
            {t('common.refresh') || 'Refresh'}
          </button>
        </div>
      </div>
    </div>
  );
}