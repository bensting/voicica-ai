'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getAdminWithdrawals,
  getWithdrawalStats,
  approveWithdrawal,
  rejectWithdrawal,
  type AdminWithdrawalItem,
} from '@/actions/admin/withdrawals';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  completed: { bg: 'bg-green-100', text: 'text-green-800' },
  rejected: { bg: 'bg-red-100', text: 'text-red-800' },
};

const STATUS_LABELS: Record<string, string> = {
  pending: '待处理',
  completed: '已完成',
  rejected: '已拒绝',
};

export default function WithdrawalsPage() {
  const [records, setRecords] = useState<AdminWithdrawalItem[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    pending: number;
    completed: number;
    rejected: number;
    totalAmount: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal state
  const [approveTarget, setApproveTarget] = useState<AdminWithdrawalItem | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminWithdrawalItem | null>(null);
  const [txHash, setTxHash] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Detail
  const [detailRecord, setDetailRecord] = useState<AdminWithdrawalItem | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [recordsResult, statsResult] = await Promise.all([
        getAdminWithdrawals({
          page,
          pageSize: 20,
          status: statusFilter || undefined,
          search: searchFilter || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
        getWithdrawalStats(),
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
  }, [page, statusFilter, searchFilter, startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = async () => {
    if (!approveTarget) return;
    setActionLoading(true);
    const result = await approveWithdrawal(approveTarget.id, txHash);
    setActionLoading(false);
    if (result.success) {
      setApproveTarget(null);
      setTxHash('');
      loadData();
    } else {
      alert(result.message);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setActionLoading(true);
    const result = await rejectWithdrawal(rejectTarget.id, adminNote);
    setActionLoading(false);
    if (result.success) {
      setRejectTarget(null);
      setAdminNote('');
      loadData();
    } else {
      alert(result.message);
    }
  };

  const handleResetFilters = () => {
    setStatusFilter('');
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

  const truncateAddress = (addr: string) => {
    if (addr.length <= 14) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  };

  return (
    <div>
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">提现管理</h1>
        <p className="text-gray-600 mt-1">审核和管理用户提现请求</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">总提现</div>
          </div>
          <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-500">待处理</div>
          </div>
          <div className="bg-green-50 rounded-xl border border-green-200 p-4">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-gray-500">已完成</div>
          </div>
          <div className="bg-red-50 rounded-xl border border-red-200 p-4">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-sm text-gray-500">已拒绝</div>
          </div>
          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
            <div className="text-2xl font-bold text-emerald-600">{Number(stats.totalAmount).toFixed(2)}</div>
            <div className="text-sm text-gray-500">已出款 (USDT)</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm text-gray-600 mb-1">状态</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">全部状态</option>
              <option value="pending">待处理</option>
              <option value="completed">已完成</option>
              <option value="rejected">已拒绝</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">搜索</label>
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setPage(1)}
              placeholder="用户ID / 钱包 / 邮箱..."
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">金额</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">手续费</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">到账</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">网络</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">钱包地址</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">时间</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">#{r.id}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 max-w-[120px] truncate font-mono" title={r.userId}>
                        {r.userId.length > 12 ? r.userId.slice(0, 6) + '...' + r.userId.slice(-4) : r.userId}
                      </div>
                      <div className="text-xs text-gray-500 truncate max-w-[120px]" title={r.email}>{r.email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{Number(r.amount).toFixed(4)}</td>
                    <td className="px-4 py-3 text-sm text-amber-600">{Number(r.fee).toFixed(4)}</td>
                    <td className="px-4 py-3 text-sm text-emerald-600 font-medium">{Number(r.netAmount).toFixed(4)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{r.network}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 font-mono" title={r.walletAddress}>
                        {truncateAddress(r.walletAddress)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[r.status]?.bg || 'bg-gray-100'} ${STATUS_COLORS[r.status]?.text || 'text-gray-800'}`}>
                        {STATUS_LABELS[r.status] || r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(r.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setDetailRecord(r)}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                        >
                          详情
                        </button>
                        {r.status === 'pending' && (
                          <>
                            <button
                              onClick={() => { setApproveTarget(r); setTxHash(''); }}
                              className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                            >
                              通过
                            </button>
                            <button
                              onClick={() => { setRejectTarget(r); setAdminNote(''); }}
                              className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                            >
                              拒绝
                            </button>
                          </>
                        )}
                      </div>
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

      {/* Approve Modal */}
      {approveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setApproveTarget(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">通过提现 #{approveTarget.id}</h3>
            <div className="space-y-3 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">到账金额</span>
                <span className="font-medium">{Number(approveTarget.netAmount).toFixed(4)} USDT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">网络</span>
                <span>{approveTarget.network}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">钱包</span>
                <span className="font-mono text-xs">{truncateAddress(approveTarget.walletAddress)}</span>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">交易哈希 (可选)</label>
              <input
                type="text"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setApproveTarget(null)}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading ? '处理中...' : '确认通过'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setRejectTarget(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">拒绝提现 #{rejectTarget.id}</h3>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-800">
              拒绝后将退还 {Number(rejectTarget.amount).toFixed(4)} USDT 到用户余额
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">拒绝原因 (可选)</label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="请输入拒绝原因..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setRejectTarget(null)}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? '处理中...' : '确认拒绝'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDetailRecord(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">提现详情 #{detailRecord.id}</h3>
              <button
                onClick={() => setDetailRecord(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">用户 ID</div>
                  <div className="text-sm text-gray-900 font-mono break-all">{detailRecord.userId}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">状态</div>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[detailRecord.status]?.bg} ${STATUS_COLORS[detailRecord.status]?.text}`}>
                    {STATUS_LABELS[detailRecord.status] || detailRecord.status}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-500">金额</div>
                  <div className="text-sm text-gray-900 font-medium">{Number(detailRecord.amount).toFixed(4)} USDT</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">手续费</div>
                  <div className="text-sm text-amber-600">{Number(detailRecord.fee).toFixed(4)} USDT</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">到账</div>
                  <div className="text-sm text-emerald-600 font-medium">{Number(detailRecord.netAmount).toFixed(4)} USDT</div>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">网络</div>
                <div className="text-sm text-gray-900">{detailRecord.network}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">钱包地址</div>
                <div className="text-sm text-gray-900 font-mono break-all">{detailRecord.walletAddress}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">邮箱</div>
                  <div className="text-sm text-gray-900">{detailRecord.email}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Telegram</div>
                  <div className="text-sm text-gray-900">{detailRecord.telegram || '-'}</div>
                </div>
              </div>
              {detailRecord.txHash && (
                <div>
                  <div className="text-sm text-gray-500">交易哈希</div>
                  <div className="text-sm text-gray-900 font-mono break-all">{detailRecord.txHash}</div>
                </div>
              )}
              {detailRecord.adminNote && (
                <div>
                  <div className="text-sm text-gray-500">管理员备注</div>
                  <div className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">{detailRecord.adminNote}</div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">创建时间</div>
                  <div className="text-sm text-gray-900">{formatDate(detailRecord.createdAt)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">完成时间</div>
                  <div className="text-sm text-gray-900">{detailRecord.completedAt ? formatDate(detailRecord.completedAt) : '-'}</div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0">
              {detailRecord.status === 'pending' && (
                <>
                  <button
                    onClick={() => { setDetailRecord(null); setApproveTarget(detailRecord); setTxHash(''); }}
                    className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    通过
                  </button>
                  <button
                    onClick={() => { setDetailRecord(null); setRejectTarget(detailRecord); setAdminNote(''); }}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    拒绝
                  </button>
                </>
              )}
              <button
                onClick={() => setDetailRecord(null)}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
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
