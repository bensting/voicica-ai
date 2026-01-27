'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { formatCredits } from '../utils';

interface DailyTasksProgressProps {
  earnedCredits: number;
  maxCredits: number;
}

/**
 * 今日进度条
 */
export default function DailyTasksProgress({
  earnedCredits,
  maxCredits,
}: DailyTasksProgressProps) {
  const { t } = useLanguage();

  const progress = maxCredits > 0 ? (earnedCredits / maxCredits) * 100 : 0;

  return (
    <div className="bg-gray-50 rounded-xl p-4 mb-5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{t('dailyTasks.todayEarned')}</span>
        <span className="font-semibold text-purple-600">
          {formatCredits(earnedCredits)} / {formatCredits(maxCredits)}
        </span>
      </div>
      <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
