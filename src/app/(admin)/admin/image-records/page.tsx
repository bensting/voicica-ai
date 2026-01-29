'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getImageRecords,
  getImageRecordsStats,
  deleteImageRecord,
  deleteImageRecords,
  ImageRecordItem,
} from '@/actions/admin/image-records';

/**
 * 状态标签颜色
 */
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  SUCCESS: { bg: 'bg-green-100', text: 'text-green-800' },
  FAILURE: { bg: 'bg-red-100', text: 'text-red-800' },
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  PROCESSING: { bg: 'bg-blue-100', text: 'text-blue-800' },
};

/**
 * 状态显示名称
 */
const STATUS_LABELS: Record<string, string> = {
  SUCCESS: '已完成',
  FAILURE: '失败',
  PENDING: '等待中',
  PROCESSING: '处理中',
};

/**
 * Image 记录管理页面
 */
export default function ImageRecordsPage() {
  const [records, setRecords] = useState<ImageRecordItem[]>([]);
  const [stats, setStats] = useState<{
    totalRecords: number;
    successRecords: number;
    failedRecords: number;
    processingRecords: number;
    todayRecords: number;
    weekRecords: number;
    totalCredits: number;
    publicRecords: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // 筛选条件
  const [statusFilter, setStatusFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 选中的记录
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // 详情弹窗
  const [detailRecord, setDetailRecord] = useState<ImageRecordItem | null>(null);

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [recordsResult, statsResult] = await Promise.all([
        getImageRecords({
          page,
          pageSize: 20,
          status: statusFilter || undefined,
          model: modelFilter || undefined,
          userId: userIdFilter || undefined,
          search: searchFilter || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
        getImageRecordsStats(),
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
  }, [page, statusFilter, modelFilter, userIdFilter, searchFilter, startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 删除单条记录
  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这条记录吗？')) return;

    const result = await deleteImageRecord(id);
    if (result.success) {
      loadData();
    } else {
      alert(result.message);
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) {
      alert('请先选择要删除的记录');
      return;
    }

    if (!confirm(`确定要删除选中的 ${selectedIds.length} 条记录吗？`)) return;

    const result = await deleteImageRecords(selectedIds);
    if (result.success) {
      setSelectedIds([]);
      loadData();
    } else {
      alert(result.message);
    }
  };

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectedIds.length === records.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(records.map((r) => r.id));
    }
  };

  // 切换选中
  const handleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // 重置筛选
  const handleResetFilters = () => {
    setStatusFilter('');
    setModelFilter('');
    setUserIdFilter('');
    setSearchFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  // 格式化日期
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

  // 截断文本
  const truncateText = (text: string | null, maxLength: number = 50) => {
    if (!text) return '-';
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  return (
    <div>
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Image 记录管理</h1>
        <p className="text-gray-600 mt-1">查看和管理 AI 图片生成记录</p>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
            <div className="text-sm text-gray-500">已完成</div>
          </div>
          <div className="bg-red-50 rounded-xl border border-red-200 p-4">
            <div className="text-2xl font-bold text-red-600">
              {stats.failedRecords.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">失败</div>
          </div>
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
            <div className="text-2xl font-bold text-blue-600">
              {stats.processingRecords.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">处理中</div>
          </div>
          <div className="bg-purple-50 rounded-xl border border-purple-200 p-4">
            <div className="text-2xl font-bold text-purple-600">
              {stats.todayRecords.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">今日新增</div>
          </div>
          <div className="bg-orange-50 rounded-xl border border-orange-200 p-4">
            <div className="text-2xl font-bold text-orange-600">
              {stats.weekRecords.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">本周新增</div>
          </div>
          <div className="bg-teal-50 rounded-xl border border-teal-200 p-4">
            <div className="text-2xl font-bold text-teal-600">
              {stats.totalCredits.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">消耗积分</div>
          </div>
          <div className="bg-pink-50 rounded-xl border border-pink-200 p-4">
            <div className="text-2xl font-bold text-pink-600">
              {stats.publicRecords.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">公开作品</div>
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
              <option value="SUCCESS">已完成</option>
              <option value="FAILURE">失败</option>
              <option value="PENDING">等待中</option>
              <option value="PROCESSING">处理中</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">模型</label>
            <select
              value={modelFilter}
              onChange={(e) => {
                setModelFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">全部模型</option>
              <option value="kling-v1.5-pro">Kling v1.5 Pro</option>
              <option value="kling-v2-master">Kling v2 Master</option>
              <option value="flux-pro">Flux Pro</option>
              <option value="flux-dev">Flux Dev</option>
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
              placeholder="搜索 prompt..."
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
                    预览
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Prompt
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    模型
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
                    创建时间
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
                      {record.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={record.imageUrl}
                          alt="Preview"
                          className="w-12 h-12 object-cover rounded-lg cursor-pointer hover:opacity-80"
                          onClick={() => setDetailRecord(record)}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                          无
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className="text-sm text-gray-900 max-w-[200px] truncate cursor-pointer hover:text-purple-600"
                        title={record.prompt}
                        onClick={() => setDetailRecord(record)}
                      >
                        {truncateText(record.prompt)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                        {record.model}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 max-w-[120px] truncate" title={record.userId}>
                        {record.userId.length > 12
                          ? record.userId.slice(0, 6) + '...' + record.userId.slice(-4)
                          : record.userId}
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
                      {record.progress > 0 && record.progress < 100 && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {record.progress}%
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {record.creditsUsed}
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
                        {record.imageUrl && (
                          <a
                            href={record.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                          >
                            查看
                          </a>
                        )}
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
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">Image 记录详情</h3>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Task ID</div>
                  <div className="text-sm text-gray-900 font-mono break-all">{detailRecord.taskId}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">用户 ID</div>
                  <div className="text-sm text-gray-900 font-mono break-all">{detailRecord.userId}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">模型</div>
                  <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                    {detailRecord.model}
                  </span>
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
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-1">Prompt</div>
                <div className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap max-h-32 overflow-auto">
                  {detailRecord.prompt}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">宽高比</div>
                  <div className="text-sm text-gray-900">{detailRecord.aspectRatio}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">质量</div>
                  <div className="text-sm text-gray-900">{detailRecord.quality}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">消耗积分</div>
                  <div className="text-sm text-gray-900">{detailRecord.creditsUsed}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">进度</div>
                  <div className="text-sm text-gray-900">{detailRecord.progress}%</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">是否公开</div>
                  <div className="text-sm text-gray-900">{detailRecord.isPublic ? '是' : '否'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">创建时间</div>
                  <div className="text-sm text-gray-900">{formatDate(detailRecord.createdAt)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">完成时间</div>
                  <div className="text-sm text-gray-900">
                    {detailRecord.completedAt ? formatDate(detailRecord.completedAt) : '-'}
                  </div>
                </div>
              </div>

              {detailRecord.error && (
                <div>
                  <div className="text-sm text-gray-500">错误信息</div>
                  <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
                    {detailRecord.error}
                  </div>
                </div>
              )}

              {detailRecord.imageUrl && (
                <div>
                  <div className="text-sm text-gray-500 mb-2">图片预览</div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={detailRecord.imageUrl}
                    alt="Preview"
                    className="max-w-full max-h-64 rounded-lg object-contain bg-gray-100"
                  />
                </div>
              )}
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
