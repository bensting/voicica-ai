'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import type { CreditHistoryItem as CreditHistoryItemType } from '@/types/user';
import { CreditHistoryItem } from './CreditHistoryItem';
import { CreditHistoryEmpty } from './CreditHistoryEmpty';

interface CreditHistoryListProps {
  items: CreditHistoryItemType[];
  loadingMore: boolean;
  hasMore: boolean;
  loadMoreRef: React.RefObject<HTMLDivElement | null>;
}

export function CreditHistoryList({
  items,
  loadingMore,
  hasMore,
  loadMoreRef
}: CreditHistoryListProps) {
  const { t } = useLanguage();

  if (items.length === 0) {
    return <CreditHistoryEmpty />;
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {/* 列表项 */}
      <div className="space-y-3">
        {items.map((item) => (
          <CreditHistoryItem key={item.id} item={item} />
        ))}
      </div>

      {/* 加载更多触发器 */}
      <div ref={loadMoreRef} className="py-4 mt-2">
        {loadingMore ? (
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-sm">{t('common.loading')}</span>
          </div>
        ) : hasMore ? (
          <div className="text-center text-sm text-gray-400">
            {t('creditHistory.scrollToLoadMore')}
          </div>
        ) : (
          <div className="text-center text-sm text-gray-400">
            {t('generationHistory.allRecordsLoaded')}
          </div>
        )}
      </div>
    </div>
  );
}