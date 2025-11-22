'use client';

import { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface MyBenefitsCardProps {
  credits: number;
  onRefresh: () => Promise<void>;
}

// 积分项组件
function CreditItem({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  valueColor = 'text-purple-600',
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: number;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${iconBg} rounded-full flex items-center justify-center`}>
          <div className={iconColor}>{icon}</div>
        </div>
        <span className="text-gray-700 font-medium">{label}</span>
      </div>
      <span className={`text-2xl font-bold ${valueColor}`}>
        {value.toLocaleString()}
      </span>
    </div>
  );
}

export default function MyBenefitsCard({ credits, onRefresh }: MyBenefitsCardProps) {
  const { t } = useLanguage();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, onRefresh]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            {t('settings.benefits.title')}
          </h2>
        </div>

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
          title={t('settings.benefits.refresh')}
        >
          <svg
            className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`}
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
        </button>
      </div>

      {/* Credits List */}
      <div className="space-y-3">
        {/* 语音积分 */}
        <CreditItem
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          }
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
          label={t('settings.benefits.voiceCredits')}
          value={credits}
          valueColor="text-purple-600"
        />

        {/* 未来可以添加更多积分类型，例如：
        <CreditItem
          icon={<MusicIcon />}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          label={t('settings.benefits.musicCredits')}
          value={musicCredits}
          valueColor="text-blue-600"
        />
        */}
      </div>
    </div>
  );
}