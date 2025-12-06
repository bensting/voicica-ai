'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAdminStats, TimeRange } from '@/actions/admin/stats';

interface DailyCount {
  date: string;
  count: number;
}

interface StatsData {
  users: {
    registered: {
      total: number;
      newInRange: number;
      daily: DailyCount[];
    };
    anonymous: {
      total: number;
      newInRange: number;
      daily: DailyCount[];
    };
  };
  ttsRecords: {
    total: number;
    newInRange: number;
    successCount: number;
    failureCount: number;
    daily: DailyCount[];
  };
}

/**
 * 管理后台统计页面
 */
export default function AdminStatsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7days');
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminStats(timeRange);
      setStats(data);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // 获取时间范围的显示文本
  const getTimeRangeLabel = (range: TimeRange) => {
    switch (range) {
      case 'today':
        return '今天';
      case '7days':
        return '最近 7 天';
      case '30days':
        return '最近 30 天';
    }
  };

  // 格式化日期为 MM/DD
  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // 简单的条形图组件
  const BarChart = ({
    data,
    color = 'purple',
  }: {
    data: DailyCount[];
    color?: 'purple' | 'blue' | 'green';
  }) => {
    if (data.length === 0) {
      return <div className="text-sm text-gray-400 text-center py-4">暂无数据</div>;
    }

    const maxCount = Math.max(...data.map((d) => d.count), 1);
    const colorClasses = {
      purple: 'bg-purple-500',
      blue: 'bg-blue-500',
      green: 'bg-green-500',
    };

    return (
      <div className="flex items-end gap-1 h-32">
        {data.map((item) => (
          <div key={item.date} className="flex-1 flex flex-col items-center gap-1">
            <div className="text-xs text-gray-500">{item.count}</div>
            <div
              className={`w-full ${colorClasses[color]} rounded-t transition-all`}
              style={{
                height: `${Math.max((item.count / maxCount) * 100, 4)}%`,
                minHeight: item.count > 0 ? '4px' : '2px',
              }}
            />
            <div className="text-xs text-gray-400 truncate w-full text-center">
              {formatDateShort(item.date)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      {/* 页面标题和时间范围选择 */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">数据统计</h1>
          <p className="text-gray-600 mt-1">查看用户和 TTS 任务的统计数据</p>
        </div>
        <div className="flex gap-2">
          {(['today', '7days', '30days'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-purple-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {getTimeRangeLabel(range)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-2 text-gray-500">
            <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            加载中...
          </div>
        </div>
      ) : stats ? (
        <div className="space-y-6">
          {/* 概览卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 注册用户 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-gray-500">注册用户</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.users.registered.total.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <span className="text-green-600 text-sm font-medium">
                  +{stats.users.registered.newInRange}
                </span>
                <span className="text-gray-500 text-sm ml-1">{getTimeRangeLabel(timeRange)}</span>
              </div>
            </div>

            {/* 匿名用户 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-gray-500">匿名用户</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.users.anonymous.total.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <span className="text-green-600 text-sm font-medium">
                  +{stats.users.anonymous.newInRange}
                </span>
                <span className="text-gray-500 text-sm ml-1">{getTimeRangeLabel(timeRange)}</span>
              </div>
            </div>

            {/* TTS 任务 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-gray-500">TTS 任务</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.ttsRecords.total.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <span className="text-green-600 text-sm font-medium">
                  +{stats.ttsRecords.newInRange}
                </span>
                <span className="text-gray-500 text-sm ml-1">{getTimeRangeLabel(timeRange)}</span>
              </div>
            </div>

            {/* TTS 成功率 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-gray-500">成功率</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.ttsRecords.newInRange > 0
                      ? (
                          (stats.ttsRecords.successCount / stats.ttsRecords.newInRange) *
                          100
                        ).toFixed(1)
                      : '0'}
                    %
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <span className="text-green-600 text-sm">{stats.ttsRecords.successCount} 成功</span>
                <span className="text-gray-400 mx-1">/</span>
                <span className="text-red-600 text-sm">{stats.ttsRecords.failureCount} 失败</span>
              </div>
            </div>
          </div>

          {/* 趋势图 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 用户增长趋势 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">用户增长趋势</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">注册用户</span>
                    <span className="text-sm font-medium text-purple-600">
                      +{stats.users.registered.newInRange}
                    </span>
                  </div>
                  <BarChart data={stats.users.registered.daily} color="purple" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">匿名用户</span>
                    <span className="text-sm font-medium text-blue-600">
                      +{stats.users.anonymous.newInRange}
                    </span>
                  </div>
                  <BarChart data={stats.users.anonymous.daily} color="blue" />
                </div>
              </div>
            </div>

            {/* TTS 任务趋势 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">TTS 任务趋势</h3>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">任务数量</span>
                  <span className="text-sm font-medium text-green-600">
                    +{stats.ttsRecords.newInRange}
                  </span>
                </div>
                <BarChart data={stats.ttsRecords.daily} color="green" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500">加载统计数据失败</div>
      )}
    </div>
  );
}