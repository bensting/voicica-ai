'use client';

import { RefreshCw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface RetryOverlayProps {
  isVisible: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onRetry: () => void;
}

/**
 * 重试覆盖层
 */
export default function RetryOverlay({
  isVisible,
  errorMessage,
  onClose,
  onRetry,
}: RetryOverlayProps) {
  const { t } = useLanguage();

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-[9999]">
      <div className="bg-white rounded-2xl p-8 flex flex-col items-center shadow-2xl min-w-[280px]">
        <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-4">
          <RefreshCw className="w-6 h-6 text-orange-500" />
        </div>
        <p className="text-gray-700 font-medium text-center">
          {errorMessage || t('dailyTasks.loadFailed') || '加载失败'}
        </p>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-5 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm"
          >
            {t('dailyTasks.close') || '关闭'}
          </button>
          <button
            onClick={onRetry}
            className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {t('dailyTasks.retry') || '重试'}
          </button>
        </div>
      </div>
    </div>
  );
}
