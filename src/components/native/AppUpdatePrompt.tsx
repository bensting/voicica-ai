/**
 * App 更新提示组件
 *
 * 在原生 App 中显示版本更新提示弹窗
 * - 普通更新：可以点击"稍后"关闭
 * - 强制更新：无法关闭，必须更新
 */
'use client';

import { useEffect } from 'react';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import { useAppUpdate, UpdateInfo } from '@/hooks/useAppUpdate';
import { useLanguage } from '@/contexts/LanguageContext';

export function AppUpdatePrompt() {
  const { updateInfo, dismissUpdate, isNativeApp } = useAppUpdate();
  const { t } = useLanguage();

  // 强制更新时禁用返回键
  useEffect(() => {
    if (updateInfo?.isForceUpdate && isNativeApp) {
      const handler = App.addListener('backButton', () => {
        // 强制更新时阻止返回
      });

      return () => {
        handler.then((h) => h.remove());
      };
    }
  }, [updateInfo?.isForceUpdate, isNativeApp]);

  if (!updateInfo || !updateInfo.hasUpdate) {
    return null;
  }

  const handleUpdate = async () => {
    // 打开下载链接
    await Browser.open({ url: updateInfo.downloadUrl });
  };

  const handleDismiss = () => {
    if (!updateInfo.isForceUpdate) {
      dismissUpdate();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🚀</span>
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">
                {t('appUpdate.title') || '发现新版本'}
              </h2>
              <p className="text-white/80 text-sm">
                v{updateInfo.latestVersion}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Version Info */}
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
            <span>{t('appUpdate.currentVersion') || '当前版本'}: v{updateInfo.currentVersion}</span>
            <span className="text-purple-600 font-medium">
              → v{updateInfo.latestVersion}
            </span>
          </div>

          {/* Release Notes */}
          {updateInfo.releaseNotes && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {t('appUpdate.releaseNotes') || '更新内容'}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {updateInfo.releaseNotes}
              </p>
            </div>
          )}

          {/* Force Update Warning */}
          {updateInfo.isForceUpdate && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <span>⚠️</span>
                <span className="text-sm font-medium">
                  {t('appUpdate.forceUpdateWarning') || '此版本为必要更新，请立即更新以继续使用'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          {!updateInfo.isForceUpdate && (
            <button
              onClick={handleDismiss}
              className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {t('appUpdate.later') || '稍后'}
            </button>
          )}
          <button
            onClick={handleUpdate}
            className={`${updateInfo.isForceUpdate ? 'w-full' : 'flex-1'} px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-colors`}
          >
            {t('appUpdate.updateNow') || '立即更新'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AppUpdatePrompt;