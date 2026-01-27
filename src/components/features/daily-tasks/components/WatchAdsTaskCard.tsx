'use client';

import { Play, Check, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCredits } from '../utils';

interface WatchAdsTaskCardProps {
  adTiers: number[];
  claimedCount: number;
  earnedCredits: number;
  nextReward: number | null;
  isLoading: boolean;
  error: string | null;
  onWatchAd: () => void;
}

/**
 * 看广告赚积分任务卡片
 */
export default function WatchAdsTaskCard({
  adTiers,
  claimedCount,
  earnedCredits,
  nextReward,
  isLoading,
  error,
  onWatchAd,
}: WatchAdsTaskCardProps) {
  const { t } = useLanguage();

  const totalCredits = adTiers.reduce((sum, v) => sum + v, 0);

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
              {formatCredits(earnedCredits)} / {formatCredits(totalCredits)} {t('dailyTasks.credits')}
            </p>
          </div>
        </div>
      </div>

      {/* 广告档位进度 */}
      <div className="flex gap-1.5 mb-4">
        {adTiers.map((tier, index) => {
          const isClaimed = index < claimedCount;
          const isNext = index === claimedCount;
          return (
            <div
              key={index}
              className={`flex-1 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                isClaimed
                  ? 'bg-green-500 text-white'
                  : isNext
                  ? 'bg-purple-100 text-purple-600 border-2 border-purple-300'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {isClaimed ? <Check className="w-3.5 h-3.5" /> : tier}
            </div>
          );
        })}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 text-center">
          {error}
        </div>
      )}

      {/* 看广告按钮 */}
      {nextReward !== null ? (
        <button
          onClick={onWatchAd}
          disabled={isLoading}
          className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{t('dailyTasks.loadingAd') || '加载广告中...'}</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              {t('dailyTasks.watchAdGet', { credits: formatCredits(nextReward) })}
            </>
          )}
        </button>
      ) : (
        <div className="w-full py-3 bg-gray-100 text-gray-400 font-semibold rounded-xl text-center">
          {t('dailyTasks.allAdsClaimed')}
        </div>
      )}
    </div>
  );
}
