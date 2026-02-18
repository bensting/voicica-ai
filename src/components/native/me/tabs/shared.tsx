'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDateLong } from '../utils';

/**
 * Tab 组件共享接口
 */
export interface TabProps {
  isActive: boolean;
  refreshTrigger?: number;
  onDetailOpen?: () => void;
}

/**
 * 空状态插画 SVG
 */
const EmptyIllustration = () => (
  <svg
    className="w-16 h-16 text-gray-600"
    viewBox="0 0 120 120"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="25" y="40" width="50" height="45" rx="4" />
    <path d="M25 50 L25 45 Q25 40 30 40 L45 40 L50 35 L70 35 Q75 35 75 40 L75 50" />
    <line x1="50" y1="55" x2="50" y2="75" strokeWidth="3" />
    <line x1="40" y1="65" x2="60" y2="65" strokeWidth="3" />
    <circle cx="90" cy="55" r="8" />
    <path d="M82 75 Q82 65 90 65 Q98 65 98 75" />
    <path d="M85 72 L80 85" />
    <path d="M95 68 L105 60" />
  </svg>
);

/**
 * 空状态组件
 */
export function EmptyState({
  title,
  subtitle,
  createLink,
}: {
  title: string;
  subtitle: string;
  createLink: string;
}) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <EmptyIllustration />
      <p className="mt-3 text-gray-400 text-center">{title}</p>
      <p className="text-gray-500 text-sm text-center">{subtitle}</p>
      <Link
        href={createLink}
        className="mt-4 px-8 py-3 bg-white/10 border border-white/20 rounded-full text-white font-medium hover:bg-white/20 transition-colors"
      >
        {t('native.me.goCreate')}
      </Link>
    </div>
  );
}

/**
 * 加载中状态
 */
export function LoadingState() {
  return (
    <div className="flex justify-center py-8">
      <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

/**
 * 加载更多按钮
 */
export function LoadMoreButton({
  loading,
  onClick,
}: {
  loading: boolean;
  onClick: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="flex justify-center py-4">
      <button
        onClick={onClick}
        disabled={loading}
        className="px-6 py-2 text-sm text-gray-400 border border-gray-700 rounded-full hover:bg-white/5 transition-colors disabled:opacity-50"
      >
        {loading ? t('native.me.loading') : t('native.me.loadMore')}
      </button>
    </div>
  );
}

/**
 * 按日期分组的列表
 * 接收记录数组，提取日期字段进行分组，然后渲染每组的卡片
 */
export function DateGroupedList<T>({
  records,
  getDateStr,
  getKey,
  renderCard,
}: {
  records: T[];
  getDateStr: (item: T) => string;
  getKey: (item: T) => string;
  renderCard: (item: T) => React.ReactNode;
}) {
  const grouped = records.reduce((groups, item) => {
    const date = formatDateLong(getDateStr(item));
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {} as Record<string, T[]>);

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date}>
          <h3 className="text-gray-500 text-sm mb-2">{date}</h3>
          <div className="space-y-1">
            {items.map((item) => (
              <div key={getKey(item)}>{renderCard(item)}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
