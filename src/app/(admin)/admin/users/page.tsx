'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  getAdminUserList,
  getAdminAnonymousUserList,
  updateUserCredits,
  deleteAnonymousUser,
  cleanExpiredAnonymousUsers,
  getUserCreditHistory,
} from '@/actions/admin/users';

interface RegisteredUser {
  id: number;
  user_id: string;
  email: string | null;
  name: string | null;
  photo_url: string | null;
  auth_provider: string | null;
  platform: string | null;
  credits: number;
  total_credits_used: number;
  created_at: Date;
  has_active_subscription: boolean;
}

/**
 * 平台标签配置
 */
const PLATFORM_CONFIG: Record<string, { label: string; icon: string; bg: string; text: string }> = {
  web: { label: 'Web', icon: '🖥️', bg: 'bg-slate-100', text: 'text-slate-700' },
  'mobile-web': { label: 'Mobile', icon: '📱', bg: 'bg-orange-100', text: 'text-orange-700' },
  android: { label: 'Android', icon: '🤖', bg: 'bg-green-100', text: 'text-green-700' },
  ios: { label: 'iOS', icon: '🍎', bg: 'bg-blue-100', text: 'text-blue-700' },
};

interface AnonymousUser {
  id: number;
  user_id: string;
  device_fingerprint: string;
  ip_address: string | null;
  credits: number;
  total_credits_used: number;
  is_anonymous: boolean;
  converted_to_user_id: string | null;
  expires_at: Date | null;
  last_used_at: Date | null;
  created_at: Date;
}

interface CreditHistoryRecord {
  id: number;
  amount: number;
  description: string;
  product_type: string | null;
  task_id: string | null;
  created_at: Date;
}

type TabType = 'registered' | 'anonymous';

/**
 * 用户管理页面
 */
export default function UsersManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>('registered');

  // 注册用户状态
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [registeredTotal, setRegisteredTotal] = useState(0);
  const [registeredPage, setRegisteredPage] = useState(1);
  const [registeredTotalPages, setRegisteredTotalPages] = useState(1);
  const [registeredLoading, setRegisteredLoading] = useState(false);
  const [registeredSearch, setRegisteredSearch] = useState('');
  const [subscriptionFilter, setSubscriptionFilter] = useState<'all' | 'active' | 'none'>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('');

  // 匿名用户状态
  const [anonymousUsers, setAnonymousUsers] = useState<AnonymousUser[]>([]);
  const [anonymousTotal, setAnonymousTotal] = useState(0);
  const [anonymousPage, setAnonymousPage] = useState(1);
  const [anonymousTotalPages, setAnonymousTotalPages] = useState(1);
  const [anonymousLoading, setAnonymousLoading] = useState(false);
  const [anonymousSearch, setAnonymousSearch] = useState('');
  const [convertedFilter, setConvertedFilter] = useState<'all' | 'converted' | 'not_converted'>('all');

  // 积分编辑模态框
  const [editingCredits, setEditingCredits] = useState<{
    userId: string;
    currentCredits: number;
    newCredits: number;
    reason: string;
  } | null>(null);

  // 积分历史模态框
  const [creditHistory, setCreditHistory] = useState<{
    userId: string;
    userName: string | null;
    records: CreditHistoryRecord[];
    total: number;
    page: number;
    totalPages: number;
    loading: boolean;
  } | null>(null);

  // 加载注册用户
  const loadRegisteredUsers = useCallback(async () => {
    setRegisteredLoading(true);
    try {
      const result = await getAdminUserList({
        page: registeredPage,
        pageSize: 20,
        search: registeredSearch || undefined,
        hasSubscription: subscriptionFilter === 'all' ? undefined : subscriptionFilter === 'active',
        platform: platformFilter || undefined,
      });
      setRegisteredUsers(result.users);
      setRegisteredTotal(result.total);
      setRegisteredTotalPages(result.totalPages);
    } catch (error) {
      console.error('加载注册用户失败:', error);
    } finally {
      setRegisteredLoading(false);
    }
  }, [registeredPage, registeredSearch, subscriptionFilter, platformFilter]);

  // 加载匿名用户
  const loadAnonymousUsers = useCallback(async () => {
    setAnonymousLoading(true);
    try {
      const result = await getAdminAnonymousUserList({
        page: anonymousPage,
        pageSize: 20,
        search: anonymousSearch || undefined,
        isConverted: convertedFilter === 'all' ? undefined : convertedFilter === 'converted',
      });
      setAnonymousUsers(result.users);
      setAnonymousTotal(result.total);
      setAnonymousTotalPages(result.totalPages);
    } catch (error) {
      console.error('加载匿名用户失败:', error);
    } finally {
      setAnonymousLoading(false);
    }
  }, [anonymousPage, anonymousSearch, convertedFilter]);

  // 加载数据
  useEffect(() => {
    if (activeTab === 'registered') {
      loadRegisteredUsers();
    } else {
      loadAnonymousUsers();
    }
  }, [activeTab, loadRegisteredUsers, loadAnonymousUsers]);

  // 加载用户积分历史
  const loadCreditHistory = async (userId: string, userName: string | null, page: number = 1) => {
    setCreditHistory((prev) => prev ? { ...prev, loading: true } : {
      userId,
      userName,
      records: [],
      total: 0,
      page: 1,
      totalPages: 1,
      loading: true,
    });

    try {
      const result = await getUserCreditHistory({ userId, page, pageSize: 20 });
      setCreditHistory({
        userId,
        userName,
        records: result.records,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        loading: false,
      });
    } catch (error) {
      console.error('加载积分历史失败:', error);
      setCreditHistory(null);
    }
  };

  // 保存积分修改
  const handleSaveCredits = async () => {
    if (!editingCredits) return;

    const result = await updateUserCredits(
      editingCredits.userId,
      editingCredits.newCredits,
      editingCredits.reason
    );

    if (result.success) {
      setEditingCredits(null);
      loadRegisteredUsers();
    } else {
      alert(result.message);
    }
  };

  // 删除匿名用户
  const handleDeleteAnonymous = async (id: number) => {
    if (!confirm('确定要删除此匿名用户吗？')) return;

    const result = await deleteAnonymousUser(id);
    if (result.success) {
      loadAnonymousUsers();
    } else {
      alert(result.message);
    }
  };

  // 清理过期匿名用户
  const handleCleanExpired = async () => {
    if (!confirm('确定要清理所有过期的匿名用户吗？')) return;

    const result = await cleanExpiredAnonymousUsers();
    alert(result.message);
    if (result.success) {
      loadAnonymousUsers();
    }
  };

  // 格式化日期
  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 格式化认证方式显示
  const formatAuthProvider = (provider: string | null) => {
    if (!provider) return { label: '-', color: 'gray' };

    const providerConfig: Record<string, { label: string; color: string }> = {
      google: { label: 'Google', color: 'red' },
      apple: { label: 'Apple', color: 'gray' },
      password: { label: '邮箱密码', color: 'blue' },
      facebook: { label: 'Facebook', color: 'indigo' },
      x: { label: 'X', color: 'gray' },
    };

    return providerConfig[provider] || { label: provider, color: 'gray' };
  };

  return (
    <div>
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
        <p className="text-gray-600 mt-1">管理注册用户和匿名用户</p>
      </div>

      {/* 标签页切换 */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('registered')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'registered'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            注册用户
          </button>
          <button
            onClick={() => setActiveTab('anonymous')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'anonymous'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            匿名用户
          </button>
        </nav>
      </div>

      {/* 注册用户列表 */}
      {activeTab === 'registered' && (
        <div>
          {/* 筛选栏 */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="搜索邮箱、用户名..."
                  value={registeredSearch}
                  onChange={(e) => {
                    setRegisteredSearch(e.target.value);
                    setRegisteredPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <select
                value={subscriptionFilter}
                onChange={(e) => {
                  setSubscriptionFilter(e.target.value as 'all' | 'active' | 'none');
                  setRegisteredPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">所有用户</option>
                <option value="active">有订阅</option>
                <option value="none">无订阅</option>
              </select>
              <select
                value={platformFilter}
                onChange={(e) => {
                  setPlatformFilter(e.target.value);
                  setRegisteredPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">所有平台</option>
                <option value="web">🖥️ Web</option>
                <option value="mobile-web">📱 Mobile Web</option>
                <option value="android">🤖 Android</option>
                <option value="ios">🍎 iOS</option>
              </select>
            </div>
          </div>

          {/* 统计 */}
          <div className="mb-4 text-sm text-gray-600">共 {registeredTotal} 个用户</div>

          {/* 用户表格 */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">用户</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">注册方式</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">平台</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">积分</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">已用积分</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">订阅</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">注册时间</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {registeredLoading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                          加载中...
                        </div>
                      </td>
                    </tr>
                  ) : registeredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                        没有找到用户
                      </td>
                    </tr>
                  ) : (
                    registeredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {user.photo_url ? (
                              <Image
                                src={user.photo_url}
                                alt={user.name || '用户'}
                                width={40}
                                height={40}
                                className="rounded-full"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                <span className="text-gray-500 text-sm">
                                  {(user.name || user.email || '?')[0].toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900">
                                {user.name || '未设置'}
                              </div>
                              <div className="text-xs text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {(() => {
                            const { label, color } = formatAuthProvider(user.auth_provider);
                            const colorClasses: Record<string, string> = {
                              red: 'bg-red-100 text-red-700',
                              blue: 'bg-blue-100 text-blue-700',
                              indigo: 'bg-indigo-100 text-indigo-700',
                              gray: 'bg-gray-100 text-gray-600',
                            };
                            return user.auth_provider ? (
                              <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${colorClasses[color] || colorClasses.gray}`}>
                                {label}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3">
                          {user.platform && PLATFORM_CONFIG[user.platform] ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded ${PLATFORM_CONFIG[user.platform].bg} ${PLATFORM_CONFIG[user.platform].text}`}
                            >
                              <span>{PLATFORM_CONFIG[user.platform].icon}</span>
                              {PLATFORM_CONFIG[user.platform].label}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-900">
                            {user.credits.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-600">
                            {user.total_credits_used.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {user.has_active_subscription ? (
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-700">
                              有效订阅
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">无</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => loadCreditHistory(user.user_id, user.name || user.email)}
                              className="text-sm text-purple-600 hover:text-purple-700"
                            >
                              积分历史
                            </button>
                            <button
                              onClick={() =>
                                setEditingCredits({
                                  userId: user.user_id,
                                  currentCredits: user.credits,
                                  newCredits: user.credits,
                                  reason: '',
                                })
                              }
                              className="text-sm text-blue-600 hover:text-blue-700"
                            >
                              调整积分
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            {registeredTotalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  第 {registeredPage} / {registeredTotalPages} 页
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setRegisteredPage((p) => Math.max(1, p - 1))}
                    disabled={registeredPage === 1}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => setRegisteredPage((p) => Math.min(registeredTotalPages, p + 1))}
                    disabled={registeredPage === registeredTotalPages}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 匿名用户列表 */}
      {activeTab === 'anonymous' && (
        <div>
          {/* 筛选栏 */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="搜索用户ID、设备指纹、IP..."
                  value={anonymousSearch}
                  onChange={(e) => {
                    setAnonymousSearch(e.target.value);
                    setAnonymousPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <select
                value={convertedFilter}
                onChange={(e) => {
                  setConvertedFilter(e.target.value as 'all' | 'converted' | 'not_converted');
                  setAnonymousPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">所有状态</option>
                <option value="converted">已转化</option>
                <option value="not_converted">未转化</option>
              </select>
              <button
                onClick={handleCleanExpired}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                清理过期用户
              </button>
            </div>
          </div>

          {/* 统计 */}
          <div className="mb-4 text-sm text-gray-600">共 {anonymousTotal} 个匿名用户</div>

          {/* 匿名用户表格 */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">用户ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">设备指纹</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">IP</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">积分</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">已用</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">状态</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">过期时间</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {anonymousLoading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                          加载中...
                        </div>
                      </td>
                    </tr>
                  ) : anonymousUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                        没有找到匿名用户
                      </td>
                    </tr>
                  ) : (
                    anonymousUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="text-sm font-mono text-gray-700">
                            {user.user_id.substring(0, 8)}...
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-mono text-gray-500">
                            {user.device_fingerprint.substring(0, 12)}...
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">{user.ip_address || '-'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-900">{user.credits}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-600">{user.total_credits_used}</span>
                        </td>
                        <td className="px-4 py-3">
                          {user.converted_to_user_id ? (
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-700">
                              已转化
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-600">
                              匿名
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(user.expires_at)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleDeleteAnonymous(user.id)}
                            className="text-sm text-red-600 hover:text-red-700"
                          >
                            删除
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            {anonymousTotalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  第 {anonymousPage} / {anonymousTotalPages} 页
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAnonymousPage((p) => Math.max(1, p - 1))}
                    disabled={anonymousPage === 1}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => setAnonymousPage((p) => Math.min(anonymousTotalPages, p + 1))}
                    disabled={anonymousPage === anonymousTotalPages}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 积分编辑模态框 */}
      {editingCredits && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md m-4">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">调整用户积分</h2>
              <button
                onClick={() => setEditingCredits(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">当前积分</label>
                <div className="text-2xl font-bold text-gray-900">
                  {editingCredits.currentCredits.toLocaleString()}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">新积分</label>
                <input
                  type="number"
                  value={editingCredits.newCredits}
                  onChange={(e) =>
                    setEditingCredits({
                      ...editingCredits,
                      newCredits: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <div className="mt-1 text-sm text-gray-500">
                  变化: {editingCredits.newCredits - editingCredits.currentCredits >= 0 ? '+' : ''}
                  {editingCredits.newCredits - editingCredits.currentCredits}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">调整原因</label>
                <input
                  type="text"
                  value={editingCredits.reason}
                  onChange={(e) =>
                    setEditingCredits({
                      ...editingCredits,
                      reason: e.target.value,
                    })
                  }
                  placeholder="请输入调整原因..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setEditingCredits(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveCredits}
                disabled={!editingCredits.reason.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 积分历史模态框 */}
      {creditHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl m-4 max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">积分历史</h2>
                <p className="text-sm text-gray-500">{creditHistory.userName || creditHistory.userId}</p>
              </div>
              <button
                onClick={() => setCreditHistory(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              {creditHistory.loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                  <span className="ml-2 text-gray-500">加载中...</span>
                </div>
              ) : creditHistory.records.length === 0 ? (
                <div className="text-center py-12 text-gray-500">暂无积分记录</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">时间</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">变动</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">类型</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">描述</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {creditHistory.records.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {formatDate(record.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-medium ${
                              record.amount >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {record.amount >= 0 ? '+' : ''}
                            {record.amount.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {record.product_type ? (
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700">
                              {record.product_type}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={record.description}>
                          {record.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {/* 分页 */}
            {creditHistory.totalPages > 1 && (
              <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  共 {creditHistory.total} 条记录，第 {creditHistory.page} / {creditHistory.totalPages} 页
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => loadCreditHistory(creditHistory.userId, creditHistory.userName, creditHistory.page - 1)}
                    disabled={creditHistory.page === 1 || creditHistory.loading}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => loadCreditHistory(creditHistory.userId, creditHistory.userName, creditHistory.page + 1)}
                    disabled={creditHistory.page === creditHistory.totalPages || creditHistory.loading}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}