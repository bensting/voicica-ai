'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { getCreditHistory } from '@/actions/user';
import type { CreditHistoryItem, CreditHistoryResponse } from '@/types/user';
import { ArrowLeft, TrendingUp, TrendingDown, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * 积分历史页面
 */
export default function CreditHistoryPage() {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useFirebaseAuth();
  const router = useRouter();

  const [data, setData] = useState<CreditHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // 获取积分历史
  const fetchHistory = useCallback(async (pageNum: number) => {
    try {
      setLoading(true);
      setError(null);
      const result = await getCreditHistory(pageNum, pageSize);
      setData(result);
    } catch (err) {
      console.error('获取积分历史失败:', err);
      setError(err instanceof Error ? err.message : '获取数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    if (!authLoading && user) {
      fetchHistory(page);
    }
  }, [authLoading, user, page, fetchHistory]);

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

  // 获取产品类型标签
  const getProductTypeLabel = (productType: string | null) => {
    switch (productType) {
      case 'text_to_speech':
        return t('creditHistory.productType.textToSpeech');
      case 'voice_cloning':
        return t('creditHistory.productType.voiceCloning');
      default:
        return t('creditHistory.productType.other');
    }
  };

  // Loading 状态
  if (authLoading || (!user && !error)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 返回按钮和标题 */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('creditHistory.title')}
          </h1>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {/* 历史列表 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading && !data ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            </div>
          ) : data?.items.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>{t('creditHistory.empty')}</p>
            </div>
          ) : (
            <>
              {/* 表头 */}
              <div className="hidden sm:grid sm:grid-cols-4 gap-4 px-6 py-3 bg-gray-50 border-b text-sm font-medium text-gray-500">
                <div>{t('creditHistory.date')}</div>
                <div>{t('creditHistory.description')}</div>
                <div>{t('creditHistory.type')}</div>
                <div className="text-right">{t('creditHistory.amount')}</div>
              </div>

              {/* 列表项 */}
              <div className="divide-y divide-gray-100">
                {data?.items.map((item: CreditHistoryItem) => (
                  <div
                    key={item.id}
                    className="px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    {/* 移动端布局 */}
                    <div className="sm:hidden">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {item.amount > 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-500" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                          )}
                          <span className="text-sm text-gray-500">
                            {formatDate(item.created_at)}
                          </span>
                        </div>
                        <span
                          className={`font-semibold ${
                            item.amount > 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {item.amount > 0 ? '+' : ''}
                          {item.amount.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-900 mb-1">{item.description}</p>
                      <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                        {getProductTypeLabel(item.product_type)}
                      </span>
                    </div>

                    {/* 桌面端布局 */}
                    <div className="hidden sm:grid sm:grid-cols-4 gap-4 items-center">
                      <div className="text-sm text-gray-500">
                        {formatDate(item.created_at)}
                      </div>
                      <div className="text-gray-900">{item.description}</div>
                      <div>
                        <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                          {getProductTypeLabel(item.product_type)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-semibold ${
                            item.amount > 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {item.amount > 0 ? '+' : ''}
                          {item.amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
                  <div className="text-sm text-gray-500">
                    {t('creditHistory.pagination', {
                      current: page,
                      total: totalPages,
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1 || loading}
                      className="p-2 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages || loading}
                      className="p-2 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}