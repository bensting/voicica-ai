'use client';

import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface LoadingOverlayProps {
  isLoading: boolean;
  onCancel: () => void;
}

/**
 * 加载中覆盖层
 */
export default function LoadingOverlay({ isLoading, onCancel }: LoadingOverlayProps) {
  const { t } = useLanguage();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-[9999]">
      <div className="bg-white rounded-2xl p-8 flex flex-col items-center shadow-2xl min-w-[280px]">
        <Loader2 className="w-12 h-12 animate-spin text-purple-500 mb-4" />
        <p className="text-gray-700 font-medium">
          {t('dailyTasks.loadingAd') || '加载广告中...'}
        </p>
        <p className="text-gray-400 text-sm mt-1">
          {t('dailyTasks.pleaseWait') || '请稍候'}
        </p>
        <button
          onClick={onCancel}
          className="mt-6 px-6 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm"
        >
          {t('dailyTasks.cancel') || '取消'}
        </button>
      </div>
    </div>
  );
}
