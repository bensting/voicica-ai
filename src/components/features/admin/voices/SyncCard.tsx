'use client';

import { SyncResult } from './types';

interface SyncCardProps {
  title: string;
  description: string;
  syncing: string | null;
  syncResults: Record<string, SyncResult>;
  actions: {
    label: string;
    syncKey: string;
    onClick: () => void;
    color: 'purple' | 'blue' | 'indigo' | 'orange' | 'teal';
    disabled?: boolean;
  }[];
  resultKeys: string[];
}

const colorClasses = {
  purple: 'bg-purple-600 hover:bg-purple-700',
  blue: 'bg-blue-600 hover:bg-blue-700',
  indigo: 'bg-indigo-600 hover:bg-indigo-700',
  orange: 'bg-orange-600 hover:bg-orange-700',
  teal: 'bg-teal-600 hover:bg-teal-700',
};

/**
 * 同步操作卡片组件
 */
export default function SyncCard({
  title,
  description,
  syncing,
  syncResults,
  actions,
  resultKeys,
}: SyncCardProps) {
  // 获取最新的结果
  const latestResult = resultKeys.find(key => syncResults[key]);
  const result = latestResult ? syncResults[latestResult] : null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
        <div className="flex gap-3">
          {actions.map((action) => (
            <button
              key={action.syncKey}
              onClick={action.onClick}
              disabled={syncing !== null || action.disabled}
              className={`px-6 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${colorClasses[action.color]}`}
            >
              {syncing === action.syncKey ? `${action.label.replace(/[^中文]/g, '')}中...` : action.label}
            </button>
          ))}
        </div>
      </div>
      {result && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${
          result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          <div className="font-medium">
            {result.success ? '✓ 操作完成' : '✗ 操作失败'}
          </div>
          <div className="mt-1">{result.message}</div>
          {result.updated !== undefined && (
            <div className="mt-1 text-xs opacity-80">
              更新: {result.updated}{result.skipped !== undefined ? ` | 跳过: ${result.skipped}` : ''}
            </div>
          )}
          {result.inserted !== undefined && (
            <div className="mt-1 text-xs opacity-80">
              新增: {result.inserted} | 跳过: {result.skipped || 0}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
