'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAdminStats, TimeRange } from '@/actions/admin/stats';

interface DailyCount {
  date: string;
  count: number;
}

interface TaskStats {
  total: number;
  newInRange: number;
  successCount: number;
  failureCount: number;
  processingCount: number;
  daily: DailyCount[];
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
  tasks: {
    tts: TaskStats;
    music: TaskStats;
    video: TaskStats;
    image: TaskStats;
    cover: TaskStats;
    dialogue: TaskStats;
  };
  ttsRecords: {
    total: number;
    newInRange: number;
    successCount: number;
    failureCount: number;
    daily: DailyCount[];
  };
}

// 任务类型配置
const TASK_TYPES = [
  { key: 'tts', label: 'TTS', color: 'green', icon: '🎤' },
  { key: 'music', label: 'Music', color: 'pink', icon: '🎵' },
  { key: 'video', label: 'Video', color: 'blue', icon: '🎬' },
  { key: 'image', label: 'Image', color: 'purple', icon: '🖼️' },
  { key: 'cover', label: 'Cover', color: 'orange', icon: '🎙️' },
  { key: 'dialogue', label: 'Dialogue', color: 'cyan', icon: '💬' },
] as const;

type TaskType = (typeof TASK_TYPES)[number]['key'];

/**
 * 管理后台统计页面
 */
export default function AdminStatsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7days');
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTaskTab, setActiveTaskTab] = useState<TaskType>('tts');
  const [activeUserTab, setActiveUserTab] = useState<'registered' | 'anonymous'>('registered');

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
    color?: 'purple' | 'blue' | 'green' | 'pink' | 'orange' | 'cyan' | 'yellow';
  }) => {
    if (data.length === 0) {
      return <div className="text-sm text-gray-400 text-center py-4">暂无数据</div>;
    }

    const maxCount = Math.max(...data.map((d) => d.count), 1);
    const colorClasses = {
      purple: 'bg-purple-500',
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      pink: 'bg-pink-500',
      orange: 'bg-orange-500',
      cyan: 'bg-cyan-500',
      yellow: 'bg-yellow-500',
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
          {/* 用户统计卡片 - 带 Tab */}
          <div className="bg-white rounded-xl border border-gray-200">
            {/* Tab 头部 */}
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setActiveUserTab('registered')}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeUserTab === 'registered'
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>👤</span>
                  <span>注册用户</span>
                  <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">
                    {stats.users.registered.total.toLocaleString()}
                  </span>
                </button>
                <button
                  onClick={() => setActiveUserTab('anonymous')}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeUserTab === 'anonymous'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>👥</span>
                  <span>匿名用户</span>
                  <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                    {stats.users.anonymous.total.toLocaleString()}
                  </span>
                </button>
              </div>
            </div>

            {/* Tab 内容 */}
            <div className="p-5">
              {activeUserTab === 'registered' ? (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-3xl font-bold text-purple-600">
                        {stats.users.registered.total.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">总用户数</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-3xl font-bold text-green-600">
                        +{stats.users.registered.newInRange}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">{getTimeRangeLabel(timeRange)}新增</div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">增长趋势</span>
                      <span className="text-sm font-medium text-purple-600">
                        +{stats.users.registered.newInRange}
                      </span>
                    </div>
                    <BarChart data={stats.users.registered.daily} color="purple" />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600">
                        {stats.users.anonymous.total.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">总用户数</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-3xl font-bold text-green-600">
                        +{stats.users.anonymous.newInRange}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">{getTimeRangeLabel(timeRange)}新增</div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">访问趋势</span>
                      <span className="text-sm font-medium text-blue-600">
                        +{stats.users.anonymous.newInRange}
                      </span>
                    </div>
                    <BarChart data={stats.users.anonymous.daily} color="blue" />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 任务统计卡片 - 带 Tab */}
          <div className="bg-white rounded-xl border border-gray-200">
            {/* Tab 头部 */}
            <div className="border-b border-gray-200">
              <div className="flex overflow-x-auto">
                {TASK_TYPES.map((type) => {
                  const taskStats = stats.tasks[type.key];
                  return (
                    <button
                      key={type.key}
                      onClick={() => setActiveTaskTab(type.key)}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                        activeTaskTab === type.key
                          ? 'border-purple-600 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span>{type.icon}</span>
                      <span>{type.label}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                        {taskStats.total.toLocaleString()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab 内容 */}
            {TASK_TYPES.map((type) => {
              const taskStats = stats.tasks[type.key];
              const successRate =
                taskStats.newInRange > 0
                  ? ((taskStats.successCount / taskStats.newInRange) * 100).toFixed(1)
                  : '0';

              if (activeTaskTab !== type.key) return null;

              return (
                <div key={type.key} className="p-5">
                  {/* 统计数字 */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        {taskStats.total.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">总任务数</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        +{taskStats.newInRange}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{getTimeRangeLabel(timeRange)}</div>
                    </div>
                    <div className="text-center p-3 bg-emerald-50 rounded-lg">
                      <div className="text-2xl font-bold text-emerald-600">
                        {taskStats.successCount}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">成功</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {taskStats.failureCount}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">失败</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{successRate}%</div>
                      <div className="text-xs text-gray-500 mt-1">成功率</div>
                    </div>
                  </div>

                  {/* 趋势图 */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">任务趋势</span>
                      {taskStats.processingCount > 0 && (
                        <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                          {taskStats.processingCount} 处理中
                        </span>
                      )}
                    </div>
                    <BarChart
                      data={taskStats.daily}
                      color={type.color as 'purple' | 'blue' | 'green' | 'pink' | 'orange' | 'cyan'}
                    />
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      ) : (
        <div className="text-center py-20 text-gray-500">加载统计数据失败</div>
      )}
    </div>
  );
}