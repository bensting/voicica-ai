'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getAdminDeviceTokens,
  getDeviceTokenStats,
  deleteDeviceToken,
  type AdminDeviceTokenItem,
} from '@/actions/admin/device-tokens';

const PLATFORM_CONFIG: Record<string, { label: string; icon: string; bg: string; text: string }> = {
  android: { label: 'Android', icon: '🤖', bg: 'bg-green-100', text: 'text-green-700' },
  ios: { label: 'iOS', icon: '🍎', bg: 'bg-blue-100', text: 'text-blue-700' },
  web: { label: 'Web', icon: '🌐', bg: 'bg-gray-100', text: 'text-gray-700' },
};

interface Stats {
  total: number;
  uniqueUsers: number;
  platforms: { platform: string; count: number }[];
}

export default function DeviceTokensPage() {
  const [items, setItems] = useState<AdminDeviceTokenItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // 筛选
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [platform, setPlatform] = useState('');

  const loadData = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await getAdminDeviceTokens({
        page: p,
        pageSize: 20,
        search: search || undefined,
        platform: platform || undefined,
      });
      setItems(res.items);
      setPage(res.page);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch (e) {
      console.error('Failed to load device tokens:', e);
    } finally {
      setLoading(false);
    }
  }, [search, platform]);

  // 加载统计
  useEffect(() => {
    getDeviceTokenStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setStatsLoading(false));
  }, []);

  // 加载列表
  useEffect(() => {
    loadData(1);
  }, [loadData]);

  const handleSearch = () => {
    setSearch(searchInput.trim());
  };

  const handleDelete = async (item: AdminDeviceTokenItem) => {
    const confirmed = window.confirm(
      `确认删除设备令牌？\n\n用户: ${item.userEmail || item.userId}\n平台: ${item.platform}\nToken: ${item.token.slice(0, 20)}...`,
    );
    if (!confirmed) return;

    try {
      await deleteDeviceToken(item.id);
      loadData(page);
      // 刷新统计
      getDeviceTokenStats().then(setStats).catch(console.error);
    } catch (e) {
      alert('删除失败: ' + (e as Error).message);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">设备令牌</h1>
        <p className="text-gray-600 mt-1">管理推送通知设备令牌（FCM Token）</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="总设备数"
          value={statsLoading ? '...' : stats?.total ?? 0}
          color="purple"
        />
        <StatCard
          label="覆盖用户"
          value={statsLoading ? '...' : stats?.uniqueUsers ?? 0}
          color="blue"
        />
        {stats?.platforms.map((p) => {
          const cfg = PLATFORM_CONFIG[p.platform];
          return (
            <StatCard
              key={p.platform}
              label={cfg?.label || p.platform}
              value={p.count}
              color="green"
            />
          );
        })}
      </div>

      {/* 筛选栏 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          {/* 搜索 */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">搜索</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="用户 ID / Token"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
              >
                搜索
              </button>
            </div>
          </div>

          {/* 平台筛选 */}
          <div className="min-w-[140px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">平台</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">全部平台</option>
              <option value="android">Android</option>
              <option value="ios">iOS</option>
              <option value="web">Web</option>
            </select>
          </div>

          {/* 重置 */}
          {(search || platform) && (
            <button
              onClick={() => {
                setSearchInput('');
                setSearch('');
                setPlatform('');
              }}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              重置
            </button>
          )}
        </div>
      </div>

      {/* 数据表格 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            设备列表
            {!loading && <span className="text-sm font-normal text-gray-500 ml-2">共 {total} 条</span>}
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">暂无设备令牌</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">ID</th>
                    <th className="text-left px-4 py-3 font-medium">用户</th>
                    <th className="text-left px-4 py-3 font-medium">平台</th>
                    <th className="text-left px-4 py-3 font-medium">Token</th>
                    <th className="text-left px-4 py-3 font-medium">创建时间</th>
                    <th className="text-left px-4 py-3 font-medium">更新时间</th>
                    <th className="text-left px-4 py-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item) => {
                    const pcfg = PLATFORM_CONFIG[item.platform] || PLATFORM_CONFIG.web;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500">{item.id}</td>
                        <td className="px-4 py-3">
                          <div className="max-w-[180px]">
                            {item.userEmail ? (
                              <div>
                                <div className="text-gray-900 truncate" title={item.userEmail}>
                                  {item.userName || item.userEmail}
                                </div>
                                {item.userName && (
                                  <div className="text-xs text-gray-400 truncate" title={item.userEmail}>
                                    {item.userEmail}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 font-mono text-xs" title={item.userId}>
                                {item.userId.slice(0, 16)}...
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${pcfg.bg} ${pcfg.text}`}>
                            <span>{pcfg.icon}</span>
                            {pcfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="font-mono text-xs text-gray-500 cursor-pointer hover:text-gray-800"
                            title={item.token}
                            onClick={() => {
                              navigator.clipboard.writeText(item.token).catch(() => {});
                            }}
                          >
                            {item.token.slice(0, 24)}...
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                          {formatTime(item.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                          {formatTime(item.updatedAt)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleDelete(item)}
                            className="text-xs text-red-500 hover:text-red-700 hover:underline transition-colors"
                          >
                            删除
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  第 {page} / {totalPages} 页
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => loadData(page - 1)}
                    disabled={page <= 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => loadData(page + 1)}
                    disabled={page >= totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  };
  const c = colors[color] || colors.purple;

  return (
    <div className={`${c.bg} ${c.border} border rounded-xl p-4`}>
      <div className={`text-2xl font-bold ${c.text}`}>{value}</div>
      <div className="text-sm text-gray-600 mt-1">{label}</div>
    </div>
  );
}

function formatTime(raw: string) {
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Shanghai',
    });
  } catch {
    return raw;
  }
}
