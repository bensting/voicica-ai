'use client';

import { Play, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCredits } from '../utils';

interface WatchAdsTaskCardProps {
  claimedCount: number;
  maxDailyViews: number;
  remainingViews: number;
  earnedCredits: number;
  isLoading: boolean;
  error: string | null;
  onWatchAd: () => void;
}

/**
 * Video Mining 任务卡片
 */
export default function WatchAdsTaskCard({
  claimedCount,
  maxDailyViews,
  remainingViews,
  earnedCredits,
  isLoading,
  error,
  onWatchAd,
}: WatchAdsTaskCardProps) {
  const { t } = useLanguage();

  return (
    <div className="border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <Play className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{t('dailyTasks.watchAds')}</p>
            <p className="text-sm text-gray-500">
              {claimedCount} / {maxDailyViews} {t('dailyTasks.viewsToday') || 'views today'}
            </p>
          </div>
        </div>
        <span className="text-sm font-medium text-green-600">
          +{formatCredits(earnedCredits)} $VOICICA
        </span>
      </div>

      {/* 进度条 */}
      <div className="mb-4 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${maxDailyViews > 0 ? (claimedCount / maxDailyViews) * 100 : 0}%` }}
        />
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 text-center">
          {error}
        </div>
      )}

      {/* 按钮 */}
      {remainingViews > 0 ? (
        <button
          onClick={onWatchAd}
          disabled={isLoading}
          className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{t('dailyTasks.loadingAd') || 'Loading ad...'}</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              {t('dailyTasks.startMining') || 'Start Mining'}
            </>
          )}
        </button>
      ) : (
        <div className="w-full py-3 bg-gray-100 text-gray-400 font-semibold rounded-xl text-center">
          {t('dailyTasks.dailyLimitReached') || 'Daily limit reached'}
        </div>
      )}
    </div>
  );
}
