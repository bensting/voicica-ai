'use client';

import {
  CreditHistoryHeader,
  CreditHistoryList,
  CreditHistorySkeleton,
  useCreditHistory,
} from '@/components/features/settings/credit-history';

/**
 * 积分历史页面
 */
export default function CreditHistoryPage() {
  const {
    items,
    total,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMoreRef,
    authLoading,
  } = useCreditHistory();

  // Loading 骨架屏
  if (authLoading || loading) {
    return <CreditHistorySkeleton />;
  }

  return (
    <div className="h-full flex flex-col gap-6">
      {/* 页面标题 */}
      <CreditHistoryHeader total={total} />

      {/* 错误提示 */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center gap-3 shrink-0">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* 历史列表 */}
      <div className="flex-1 min-h-0 bg-gray-50/50 rounded-xl border border-gray-100 overflow-hidden flex flex-col">
        <CreditHistoryList
          items={items}
          loadingMore={loadingMore}
          hasMore={hasMore}
          loadMoreRef={loadMoreRef}
        />
      </div>
    </div>
  );
}