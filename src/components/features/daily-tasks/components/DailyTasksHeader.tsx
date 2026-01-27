'use client';

import { Gift } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface DailyTasksHeaderProps {
  isLoggedIn: boolean;
}

/**
 * 每日任务标题
 */
export default function DailyTasksHeader({ isLoggedIn }: DailyTasksHeaderProps) {
  const { t } = useLanguage();

  return (
    <div className="text-center mb-5">
      <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
        <Gift className="w-7 h-7 text-white" />
      </div>
      <h3 className="text-xl font-bold text-gray-900">
        {t('dailyTasks.title')}
      </h3>
      <p className="text-sm text-gray-500">
        {isLoggedIn ? t('dailyTasks.subtitle') : t('dailyTasks.loginToEarn')}
      </p>
    </div>
  );
}
