'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { formatCredits } from '../utils';

interface DailyTasksProgressProps {
  earnedCredits: number;
}

/**
 * 今日积分统计
 */
export default function DailyTasksProgress({
  earnedCredits,
}: DailyTasksProgressProps) {
  const { t } = useLanguage();

  return (
    <div className="bg-gray-50 rounded-xl p-4 mb-5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{t('dailyTasks.todayEarned')}</span>
        <span className="font-semibold text-purple-600">
          {formatCredits(earnedCredits)} $VOICICA
        </span>
      </div>
    </div>
  );
}
