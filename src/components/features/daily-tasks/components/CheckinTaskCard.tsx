'use client';

import { Play, Check, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCredits } from '../utils';

interface CheckinTaskCardProps {
  isDone: boolean;
  credits: number;
  isLoading: boolean;
  error: string | null;
  onCheckin: () => void;
}

/**
 * 签到任务卡片
 */
export default function CheckinTaskCard({
  isDone,
  credits,
  isLoading,
  error,
  onCheckin,
}: CheckinTaskCardProps) {
  const { t } = useLanguage();

  return (
    <div className="border border-gray-200 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isDone ? 'bg-green-100' : 'bg-purple-100'
            }`}
          >
            {isDone ? (
              <Check className="w-5 h-5 text-green-600" />
            ) : (
              <Play className="w-5 h-5 text-purple-600" />
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">{t('dailyTasks.checkin')}</p>
            <p className="text-sm text-gray-500">
              +{formatCredits(credits)} {t('dailyTasks.credits')}
            </p>
          </div>
        </div>
        <button
          onClick={onCheckin}
          disabled={isDone || isLoading}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-1.5 ${
            isDone
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50'
          }`}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isDone ? (
            t('dailyTasks.claimed')
          ) : (
            <>
              <Play className="w-4 h-4" />
              {t('dailyTasks.watchCheckinGet', { credits: formatCredits(credits) })}
            </>
          )}
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 text-center">
          {error}
        </div>
      )}
    </div>
  );
}
