'use client';

import { useState } from 'react';
import {
  getTableStats,
  runDrizzleDbPush,
  runDrizzleGenerate,
  checkDatabaseConnection,
} from '@/actions/admin/database';

interface MigrationResult {
  success: boolean;
  message: string;
  output?: string;
  error?: string;
}

interface TableStats {
  name: string;
  displayName: string;
  count: number;
  lastUpdated?: string;
}

/**
 * 数据库管理页面
 */
export default function DatabaseSyncPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [migrationResults, setMigrationResults] = useState<Record<string, MigrationResult>>({});
  const [stats, setStats] = useState<TableStats[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<MigrationResult | null>(null);

  // 数据库迁移操作
  const migrationActions = [
    {
      key: 'db_push',
      name: 'Drizzle DB Push',
      description: '根据 Drizzle schema 创建/修改数据库表结构（会自动接受数据丢失）',
      action: runDrizzleDbPush,
      dangerous: true,
    },
    {
      key: 'generate',
      name: 'Drizzle Generate',
      description: '根据 Drizzle schema 生成迁移文件',
      action: runDrizzleGenerate,
      dangerous: false,
    },
  ];

  // 检查数据库连接
  const handleCheckConnection = async () => {
    setLoading('connection');
    try {
      const result = await checkDatabaseConnection();
      setConnectionStatus(result);
    } catch (error) {
      setConnectionStatus({
        success: false,
        message: '连接检查失败',
        error: error instanceof Error ? error.message : '未知错误',
      });
    } finally {
      setLoading(null);
    }
  };

  // 执行迁移
  const handleMigration = async (key: string, action: () => Promise<MigrationResult>) => {
    setLoading(key);
    try {
      const result = await action();
      setMigrationResults((prev) => ({ ...prev, [key]: result }));
      // 迁移成功后刷新统计
      if (result.success) {
        await loadStats();
      }
    } catch (error) {
      setMigrationResults((prev) => ({
        ...prev,
        [key]: {
          success: false,
          message: error instanceof Error ? error.message : '操作失败',
        },
      }));
    } finally {
      setLoading(null);
    }
  };

  // 加载表统计
  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const data = await getTableStats();
      setStats(data);
    } catch (error) {
      console.error('加载统计失败:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  return (
    <div>
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">数据库管理</h1>
        <p className="text-gray-600 mt-1">数据库迁移和表结构管理</p>
      </div>

      {/* 数据库连接状态 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">数据库连接</h2>
            <p className="text-sm text-gray-600 mt-1">检查数据库连接状态</p>
          </div>
          <div className="flex items-center gap-4">
            {connectionStatus && (
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  connectionStatus.success
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {connectionStatus.success ? '✓ 已连接' : '✗ 连接失败'}
              </span>
            )}
            <button
              onClick={handleCheckConnection}
              disabled={loading !== null}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {loading === 'connection' ? '检查中...' : '检查连接'}
            </button>
          </div>
        </div>
        {connectionStatus?.error && (
          <div className="mt-3 p-3 bg-red-50 text-red-800 rounded-lg text-sm">
            {connectionStatus.error}
          </div>
        )}
      </div>

      {/* 数据库迁移 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">数据库迁移</h2>
        <div className="space-y-4">
          {migrationActions.map((action) => (
            <div
              key={action.key}
              className={`p-4 rounded-lg border ${
                action.dangerous ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-gray-900">
                      {action.name}
                    </h3>
                    {action.dangerous && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-orange-200 text-orange-800 rounded">
                        需谨慎
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{action.description}</p>

                  {/* 迁移结果 */}
                  {migrationResults[action.key] && (
                    <div
                      className={`mt-3 p-3 rounded-lg text-sm ${
                        migrationResults[action.key].success
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      <div className="font-medium">
                        {migrationResults[action.key].success ? '✓ 执行成功' : '✗ 执行失败'}
                      </div>
                      <div className="mt-1">{migrationResults[action.key].message}</div>
                      {migrationResults[action.key].output && (
                        <pre className="mt-2 text-xs bg-black/10 p-2 rounded overflow-x-auto max-h-40">
                          {migrationResults[action.key].output}
                        </pre>
                      )}
                      {migrationResults[action.key].error && (
                        <pre className="mt-2 text-xs bg-red-200 p-2 rounded overflow-x-auto max-h-40">
                          {migrationResults[action.key].error}
                        </pre>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleMigration(action.key, action.action)}
                  disabled={loading !== null}
                  className={`ml-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    loading === action.key
                      ? 'bg-purple-100 text-purple-600'
                      : action.dangerous
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading === action.key ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      执行中...
                    </span>
                  ) : (
                    '执行'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 表统计 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">数据库表统计</h2>
          <button
            onClick={loadStats}
            disabled={loadingStats}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {loadingStats ? '加载中...' : '刷新统计'}
          </button>
        </div>

        {stats.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {stats.map((table) => (
              <div key={table.name} className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {table.count.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 mt-1">{table.displayName}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">
            点击「刷新统计」查看数据库表信息
          </p>
        )}
      </div>

      {/* 说明 */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-yellow-800 mb-2">注意事项</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• <strong>Drizzle DB Push</strong>: 会根据 Drizzle schema 同步表结构，可能导致数据丢失</li>
          <li>• <strong>Drizzle Generate</strong>: 修改 schema 后执行，生成迁移文件</li>
          <li>• 首次部署时需要先执行 DB Push 创建表结构</li>
        </ul>
      </div>
    </div>
  );
}
