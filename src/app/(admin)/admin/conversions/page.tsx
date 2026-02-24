'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getAdminConversions,
  getConversionStats,
  type AdminConversionItem,
} from '@/actions/admin/conversions';

export default function ConversionsPage() {
  const [records, setRecords] = useState<AdminConversionItem[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    totalVoicica: number;
    totalUsdt: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [searchFilter, setSearchFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [recordsResult, statsResult] = await Promise.all([
        getAdminConversions({
          page,
          pageSize: 20,
          search: searchFilter || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
        getConversionStats(),
      ]);

      setRecords(recordsResult.items);
      setTotalPages(recordsResult.totalPages);
      setTotal(recordsResult.total);
      setStats(statsResult);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [page, searchFilter, startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleResetFilters = () => {
    setSearchFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div>
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">兑换记录</h1>
        <p className="text-gray-600 mt-1">查看 $VOICICA 兑换 USDT 的历史记录</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total.toLocaleString()}</div>
            <div className="text-sm text-gray-500">总兑换次数</div>
          </div>
          <div className="bg-purple-50 rounded-xl border border-purple-200 p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.totalVoicica.toLocaleString()}</div>
            <div className="text-sm text-gray-500">总兑换 $VOICICA</div>
          </div>
          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
            <div className="text-2xl font-bold text-emerald-600">{Number(stats.totalUsdt).toFixed(2)}</div>
            <div className="text-sm text-gray-500">总兑换 USDT</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm text-gray-600 mb-1">用户搜索</label>
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setPage(1)}
              placeholder="搜索用户ID..."
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-56"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">开始日期</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">结束日期</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            onClick={() => setPage(1)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
          >
            搜索
          </button>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
          >
            重置
          </button>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-600">共 {total.toLocaleString()} 条记录</span>
        <button
          onClick={loadData}
          disabled={loading}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          {loading ? '加载中...' : '刷新'}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center text-gray-500">暂无数据</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">用户</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">$VOICICA</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">USDT</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">汇率</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">#{r.id}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 max-w-[140px] truncate font-mono" title={r.userId}>
                        {r.userId.length > 12 ? r.userId.slice(0, 6) + '...' + r.userId.slice(-4) : r.userId}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-purple-600 font-medium">
                      -{r.voicicaAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-emerald-600 font-medium">
                      +{Number(r.usdtAmount).toFixed(4)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      ${Number(r.rate).toFixed(6)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(r.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">第 {page} 页，共 {totalPages} 页</div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
