'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { getCreditHistory } from '@/actions/user';
import type { CreditHistoryItem } from '@/types/user';

interface UseCreditHistoryOptions {
  pageSize?: number;
}

interface UseCreditHistoryReturn {
  items: CreditHistoryItem[];
  total: number;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMoreRef: React.RefObject<HTMLDivElement | null>;
}

export function useCreditHistory(options: UseCreditHistoryOptions = {}): UseCreditHistoryReturn {
  const { pageSize = 20 } = options;
  const { user, loading: authLoading } = useFirebaseAuth();

  const [items, setItems] = useState<CreditHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

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
  }, [pageSize]);

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

  return {
    items,
    total,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMoreRef,
  };
}