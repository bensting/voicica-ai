'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminSendPush, adminGetPushStats, adminGetPushHistory } from '@/actions/push-notification';

interface PushStats {
  totalTokens: number;
  uniqueUsers: number;
  platforms: { platform: string; count: number }[];
}

interface PushLog {
  id: number;
  target: string;
  targetUserId: string | null;
  title: string;
  body: string;
  sentBy: string;
  totalDevices: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
}

interface SendResult {
  success: boolean;
  message: string;
}

export default function PushNotificationPage() {
  const [target, setTarget] = useState<'all' | 'user'>('all');
  const [userId, setUserId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);
  const [stats, setStats] = useState<PushStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [logs, setLogs] = useState<PushLog[]>([]);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);
  const [logsLoading, setLogsLoading] = useState(true);

  const loadHistory = useCallback((page: number) => {
    setLogsLoading(true);
    adminGetPushHistory(page)
      .then((res) => {
        setLogs(res.logs as PushLog[]);
        setLogsPage(res.page);
        setLogsTotalPages(res.totalPages);
      })
      .catch(console.error)
      .finally(() => setLogsLoading(false));
  }, []);

  useEffect(() => {
    adminGetPushStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setStatsLoading(false));
    loadHistory(1);
  }, [loadHistory]);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      setResult({ success: false, message: '请填写标题和内容' });
      return;
    }
    if (target === 'user' && !userId.trim()) {
      setResult({ success: false, message: '请输入用户 ID' });
      return;
    }

    const confirmed = window.confirm(
      target === 'all'
        ? `确认向所有 ${stats?.totalTokens ?? '?'} 台设备广播推送？`
        : `确认向用户 ${userId} 发送推送？`
    );
    if (!confirmed) return;

    setSending(true);
    setResult(null);

    try {
      const res = await adminSendPush({ target, userId, title, body });
      setResult(res);
      // 刷新统计和历史
      adminGetPushStats().then(setStats).catch(console.error);
      loadHistory(1);
    } catch (e) {
      setResult({ success: false, message: (e as Error).message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">推送通知</h1>
        <p className="text-gray-600 mt-1">向用户设备发送 FCM 远程推送通知</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="注册设备"
          value={statsLoading ? '...' : stats?.totalTokens ?? 0}
          color="purple"
        />
        <StatCard
          label="覆盖用户"
          value={statsLoading ? '...' : stats?.uniqueUsers ?? 0}
          color="blue"
        />
        {stats?.platforms.map((p) => (
          <StatCard
            key={p.platform}
            label={p.platform === 'android' ? 'Android' : p.platform === 'ios' ? 'iOS' : p.platform}
            value={p.count}
            color="green"
          />
        ))}
      </div>

      {/* 发送表单 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">发送推送</h2>

        {/* 推送目标 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">推送目标</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="target"
                value="all"
                checked={target === 'all'}
                onChange={() => setTarget('all')}
                className="text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">全体用户</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="target"
                value="user"
                checked={target === 'user'}
                onChange={() => setTarget('user')}
                className="text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">指定用户</span>
            </label>
          </div>
        </div>

        {/* 用户 ID */}
        {target === 'user' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              用户 ID (Firebase UID)
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="例如: abc123xyz..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        )}

        {/* 标题 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">通知标题</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如: New Feature Available!"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        {/* 内容 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">通知内容</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="例如: Check out our latest AI voice features..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
          />
        </div>

        {/* 发送按钮 */}
        <button
          onClick={handleSend}
          disabled={sending}
          className="bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {sending ? '发送中...' : target === 'all' ? '广播推送' : '发送推送'}
        </button>

        {/* 结果提示 */}
        {result && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            result.success
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {result.message}
          </div>
        )}
      </div>

      {/* 推送历史 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">推送历史</h2>
        </div>

        {logsLoading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">暂无推送记录</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">时间</th>
                    <th className="text-left px-4 py-3 font-medium">目标</th>
                    <th className="text-left px-4 py-3 font-medium">标题</th>
                    <th className="text-left px-4 py-3 font-medium">内容</th>
                    <th className="text-left px-4 py-3 font-medium">结果</th>
                    <th className="text-left px-4 py-3 font-medium">发送者</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {formatTime(log.createdAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {log.target === 'all' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                            全体
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700" title={log.targetUserId || ''}>
                            用户
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-[200px] truncate" title={log.title}>
                        {log.title}
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-[240px] truncate" title={log.body}>
                        {log.body}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-green-600">{log.sentCount}</span>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-600">{log.totalDevices}</span>
                        {log.failedCount > 0 && (
                          <span className="text-red-500 ml-1">({log.failedCount} failed)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs truncate max-w-[120px]" title={log.sentBy}>
                        {log.sentBy}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            {logsTotalPages > 1 && (
              <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  第 {logsPage} / {logsTotalPages} 页
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => loadHistory(logsPage - 1)}
                    disabled={logsPage <= 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => loadHistory(logsPage + 1)}
                    disabled={logsPage >= logsTotalPages}
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

function formatTime(iso: string) {
  try {
    const d = new Date(iso + 'Z');
    return d.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Shanghai',
    });
  } catch {
    return iso;
  }
}
