'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { getCreditHistory } from '@/actions/user';
import type { CreditHistoryItem } from '@/types/user';
import CreditsIcon from '@/components/icons/CreditsIcon';

/**
 * 积分历史页面
 */
export default function CreditHistoryPage() {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useFirebaseAuth();
  const router = useRouter();

  const [items, setItems] = useState<CreditHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 20;
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 获取积分历史
  const fetchHistory = useCallback(async (pageNum: number, isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const result = await getCreditHistory(pageNum, pageSize);

      if (isLoadMore) {
        setItems(prev => [...prev, ...result.items]);
      } else {
        setItems(result.items);
      }

      setTotal(result.total);
      setHasMore(pageNum * pageSize < result.total);
    } catch (err) {
      console.error('获取积分历史失败:', err);
      setError(err instanceof Error ? err.message : '获取数据失败');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    if (!authLoading && user) {
      fetchHistory(1);
    }
  }, [authLoading, user, fetchHistory]);

  // 加载更多
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchHistory(nextPage, true);
    }
  }, [loadingMore, hasMore, page, fetchHistory]);

  // Intersection Observer 监听滚动到底部
  useEffect(() => {
    if (loading) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, hasMore, loadingMore, loadMore]);

  // 未登录重定向
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?returnUrl=/studio/settings/credit-history');
    }
  }, [authLoading, user, router]);

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 获取产品类型配置
  const getProductTypeConfig = (productType: string | null) => {
    switch (productType) {
      case 'text_to_speech':
        return {
          label: t('creditHistory.productType.textToSpeech'),
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200',
        };
      case 'voice_cloning':
        return {
          label: t('creditHistory.productType.voiceCloning'),
          bgColor: 'bg-purple-50',
          textColor: 'text-purple-700',
          borderColor: 'border-purple-200',
        };
      default:
        return {
          label: t('creditHistory.productType.other'),
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-600',
          borderColor: 'border-gray-200',
        };
    }
  };

  // Loading 骨架屏
  if (authLoading || loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
            <div className="h-7 bg-gray-200 rounded w-32"></div>
          </div>
        </div>

        {/* List Skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 bg-gray-100 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-48"></div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 bg-gray-100 rounded w-32"></div>
                      <div className="h-5 bg-gray-100 rounded-full w-20"></div>
                    </div>
                  </div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl flex items-center justify-center">
            <CreditsIcon className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {t('creditHistory.title')}
            </h1>
            {total > 0 && (
              <p className="text-sm text-gray-500">
                {total} {t('generationHistory.total')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center gap-3">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* 历史列表 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {items.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditsIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">{t('creditHistory.empty')}</p>
          </div>
        ) : (
          <>
            {/* 列表项 */}
            <div className="divide-y divide-gray-100">
              {items.map((item: CreditHistoryItem) => {
                const typeConfig = getProductTypeConfig(item.product_type);
                const isPositive = item.amount > 0;

                return (
                  <div
                    key={item.id}
                    className="px-6 py-4 hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* 图标 */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        isPositive ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {isPositive ? (
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                          </svg>
                        )}
                      </div>

                      {/* 内容 */}
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 font-medium truncate">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-500">
                            {formatDate(item.created_at)}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${typeConfig.bgColor} ${typeConfig.textColor} ${typeConfig.borderColor}`}>
                            {typeConfig.label}
                          </span>
                        </div>
                      </div>

                      {/* 积分数量 */}
                      <div className={`text-lg font-bold shrink-0 ${
                        isPositive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {isPositive ? '+' : ''}
                        {item.amount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 加载更多触发器 */}
            <div ref={loadMoreRef} className="px-6 py-4 border-t border-gray-100">
              {loadingMore ? (
                <div className="flex items-center justify-center gap-2 text-gray-500">
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="text-sm">{t('common.loading')}</span>
                </div>
              ) : hasMore ? (
                <div className="text-center text-sm text-gray-400">
                  {t('generationHistory.allRecordsLoaded').replace('所有记录已加载完毕', '向下滑动加载更多')}
                </div>
              ) : (
                <div className="text-center text-sm text-gray-400">
                  {t('generationHistory.allRecordsLoaded')}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}