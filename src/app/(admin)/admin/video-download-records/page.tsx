'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getVideoDownloadRecords,
  getVideoDownloadRecordsStats,
  deleteVideoDownloadRecord,
  deleteVideoDownloadRecords,
  VideoDownloadRecordItem,
} from '@/actions/admin/video-download-records';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  SUCCESS: { bg: 'bg-green-100', text: 'text-green-800' },
  FAILED: { bg: 'bg-red-100', text: 'text-red-800' },
};

const STATUS_LABELS: Record<string, string> = {
  SUCCESS: '成功',
  FAILED: '失败',
};

const PLATFORM_COLORS: Record<string, { bg: string; text: string }> = {
  youtube: { bg: 'bg-red-100', text: 'text-red-800' },
  tiktok: { bg: 'bg-gray-900', text: 'text-white' },
  instagram: { bg: 'bg-pink-100', text: 'text-pink-800' },
  twitter: { bg: 'bg-blue-100', text: 'text-blue-800' },
  facebook: { bg: 'bg-blue-100', text: 'text-blue-800' },
};

export default function VideoDownloadRecordsPage() {
  const [records, setRecords] = useState<VideoDownloadRecordItem[]>([]);
  const [stats, setStats] = useState<{
    totalRecords: number;
    successRecords: number;
    failedRecords: number;
    todayRecords: number;
    weekRecords: number;
    totalCredits: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // 筛选条件
  const [statusFilter, setStatusFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 选中的记录
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // 详情弹窗
  const [detailRecord, setDetailRecord] = useState<VideoDownloadRecordItem | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [recordsResult, statsResult] = await Promise.all([
        getVideoDownloadRecords({
          page,
          pageSize: 20,
          status: statusFilter || undefined,
          platform: platformFilter || undefined,
          userId: userIdFilter || undefined,
          search: searchFilter || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
        getVideoDownloadRecordsStats(),
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
  }, [page, statusFilter, platformFilter, userIdFilter, searchFilter, startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这条记录吗？')) return;
    const result = await deleteVideoDownloadRecord(id);
    if (result.success) {
      loadData();
    } else {
      alert(result.message);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) {
      alert('请先选择要删除的记录');
      return;
    }
    if (!confirm(`确定要删除选中的 ${selectedIds.length} 条记录吗？`)) return;
    const result = await deleteVideoDownloadRecords(selectedIds);
    if (result.success) {
      setSelectedIds([]);
      loadData();
    } else {
      alert(result.message);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === records.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(records.map((r) => r.id));
    }
  };

  const handleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleResetFilters = () => {
    setStatusFilter('');
    setPlatformFilter('');
    setUserIdFilter('');
    setSearchFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateText = (text: string | null, maxLength: number = 50) => {
    if (!text) return '-';
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  return (
    <div>
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Download 记录管理</h1>
        <p className="text-gray-600 mt-1">查看和管理视频下载解析记录</p>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900">
              {stats.totalRecords.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">总记录数</div>
          </div>
          <div className="bg-green-50 rounded-xl border border-green-200 p-4">
            <div className="text-2xl font-bold text-green-600">
              {stats.successRecords.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">成功</div>
          </div>
          <div className="bg-red-50 rounded-xl border border-red-200 p-4">
            <div className="text-2xl font-bold text-red-600">
              {stats.failedRecords.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">失败</div>
          </div>
          <div className="bg-purple-50 rounded-xl border border-purple-200 p-4">
            <div className="text-2xl font-bold text-purple-600">
              {stats.todayRecords.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">今日</div>
          </div>
          <div className="bg-orange-50 rounded-xl border border-orange-200 p-4">
            <div className="text-2xl font-bold text-orange-600">
              {stats.weekRecords.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">本周</div>
          </div>
          <div className="bg-teal-50 rounded-xl border border-teal-200 p-4">
            <div className="text-2xl font-bold text-teal-600">
              {stats.totalCredits.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">总积分</div>
          </div>
        </div>
      )}

      {/* 筛选条件 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm text-gray-600 mb-1">状态</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">全部状态</option>
              <option value="SUCCESS">成功</option>
              <option value="FAILED">失败</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">平台</label>
            <select
              value={platformFilter}
              onChange={(e) => {
                setPlatformFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">全部平台</option>
              <option value="youtube">YouTube</option>
              <option value="tiktok">TikTok</option>
              <option value="instagram">Instagram</option>
              <option value="twitter">Twitter/X</option>
              <option value="facebook">Facebook</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">用户ID</label>
            <input
              type="text"
              value={userIdFilter}
              onChange={(e) => setUserIdFilter(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setPage(1)}
              placeholder="搜索用户ID..."
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-40"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">搜索</label>
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setPage(1)}
              placeholder="搜索 URL/标题..."
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-48"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">开始日期</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">结束日期</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
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

      {/* 操作栏 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            共 {total.toLocaleString()} 条记录
          </span>
          {selectedIds.length > 0 && (
            <button
              onClick={handleBatchDelete}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
            >
              删除选中 ({selectedIds.length})
            </button>
          )}
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          {loading ? '加载中...' : '刷新'}
        </button>
      </div>

      {/* 数据表格 */}
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
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === records.length && records.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    URL
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    平台
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    标题
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    用户
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    状态
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    积分
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    时间
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(record.id)}
                        onChange={() => handleSelect(record.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className="text-sm text-gray-900 max-w-[200px] truncate cursor-pointer hover:text-purple-600"
                        title={record.url}
                        onClick={() => setDetailRecord(record)}
                      >
                        {truncateText(record.url, 40)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {record.platform ? (
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                            PLATFORM_COLORS[record.platform]?.bg || 'bg-gray-100'
                          } ${PLATFORM_COLORS[record.platform]?.text || 'text-gray-800'}`}
                        >
                          {record.platform}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 max-w-[150px] truncate" title={record.videoTitle || ''}>
                        {truncateText(record.videoTitle, 30)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 max-w-[120px] truncate" title={record.userId}>
                        {record.userId.length > 12
                          ? record.userId.slice(0, 6) + '...' + record.userId.slice(-4)
                          : record.userId}
                        {record.isAnonymous && (
                          <span className="ml-1 text-xs text-gray-400">(匿名)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          STATUS_COLORS[record.status]?.bg || 'bg-gray-100'
                        } ${STATUS_COLORS[record.status]?.text || 'text-gray-800'}`}
                      >
                        {STATUS_LABELS[record.status] || record.status}
                      </span>
                      {record.errorCode && (
                        <div className="text-xs text-gray-400 mt-0.5">{record.errorCode}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {record.creditsCost}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(record.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setDetailRecord(record)}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                        >
                          详情
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              第 {page} 页，共 {totalPages} 页
            </div>
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

      {/* 详情弹窗 */}
      {detailRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDetailRecord(null)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">下载记录详情</h3>
              <button
                onClick={() => setDetailRecord(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 space-y-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">URL</div>
                <div className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3 break-all">
                  <a href={detailRecord.url} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                    {detailRecord.url}
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">平台</div>
                  <div className="text-sm text-gray-900">
                    {detailRecord.platform ? (
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          PLATFORM_COLORS[detailRecord.platform]?.bg || 'bg-gray-100'
                        } ${PLATFORM_COLORS[detailRecord.platform]?.text || 'text-gray-800'}`}
                      >
                        {detailRecord.platform}
                      </span>
                    ) : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">状态</div>
                  <span
                    className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                      STATUS_COLORS[detailRecord.status]?.bg || 'bg-gray-100'
                    } ${STATUS_COLORS[detailRecord.status]?.text || 'text-gray-800'}`}
                  >
                    {STATUS_LABELS[detailRecord.status] || detailRecord.status}
                  </span>
                </div>
                <div>
                  <div className="text-sm text-gray-500">视频标题</div>
                  <div className="text-sm text-gray-900">{detailRecord.videoTitle || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">作者</div>
                  <div className="text-sm text-gray-900">{detailRecord.videoAuthor || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">用户 ID</div>
                  <div className="text-sm text-gray-900 font-mono break-all">
                    {detailRecord.userId}
                    {detailRecord.isAnonymous && <span className="ml-1 text-gray-400">(匿名)</span>}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">消耗积分</div>
                  <div className="text-sm text-gray-900">{detailRecord.creditsCost}</div>
                </div>
                {detailRecord.errorCode && (
                  <div>
                    <div className="text-sm text-gray-500">错误码</div>
                    <div className="text-sm text-red-600">{detailRecord.errorCode}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-500">创建时间</div>
                  <div className="text-sm text-gray-900">{formatDate(detailRecord.createdAt)}</div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => setDetailRecord(null)}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
