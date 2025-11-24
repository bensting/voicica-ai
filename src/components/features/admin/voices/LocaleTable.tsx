'use client';

import { LocaleStats, SyncResult } from './types';

interface LocaleTableProps {
  locales: LocaleStats[];
  filteredLocales: LocaleStats[];
  localeFilter: string;
  setLocaleFilter: (value: string) => void;
  loading: boolean;
  syncing: string | null;
  syncResults: Record<string, SyncResult>;
  onRefresh: () => void;
  onSync: (locale: string) => void;
  onGenerateSamples: (locale: string) => void;
  onClearSamples: (locale: string) => void;
}

/**
 * 语言区域列表表格组件
 */
export default function LocaleTable({
  locales,
  filteredLocales,
  localeFilter,
  setLocaleFilter,
  loading,
  syncing,
  syncResults,
  onRefresh,
  onSync,
  onGenerateSamples,
  onClearSamples,
}: LocaleTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* 表头 */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">语言区域列表</h2>
          <input
            type="text"
            placeholder="搜索语言区域..."
            value={localeFilter}
            onChange={(e) => setLocaleFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent w-48"
          />
          {localeFilter && (
            <span className="text-sm text-gray-500">
              {filteredLocales.length}/{locales.length}
            </span>
          )}
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          {loading ? '加载中...' : '刷新'}
        </button>
      </div>

      {/* 表格内容 */}
      {loading ? (
        <div className="p-8 text-center text-gray-500">加载中...</div>
      ) : locales.length === 0 ? (
        <div className="p-8 text-center text-gray-500">暂无数据</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  语言区域
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azure 数量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  数据库数量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  头像数量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  样本数量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLocales.map((item) => (
                <LocaleTableRow
                  key={item.locale}
                  item={item}
                  syncing={syncing}
                  syncResults={syncResults}
                  onSync={onSync}
                  onGenerateSamples={onGenerateSamples}
                  onClearSamples={onClearSamples}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/**
 * 表格行组件
 */
function LocaleTableRow({
  item,
  syncing,
  syncResults,
  onSync,
  onGenerateSamples,
  onClearSamples,
}: {
  item: LocaleStats;
  syncing: string | null;
  syncResults: Record<string, SyncResult>;
  onSync: (locale: string) => void;
  onGenerateSamples: (locale: string) => void;
  onClearSamples: (locale: string) => void;
}) {
  const result = syncResults[item.locale] || syncResults[`sample-${item.locale}`] || syncResults[`clear-${item.locale}`];

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="font-medium text-gray-900">{item.locale}</div>
        <div className="text-sm text-gray-500">{item.localeName}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {item.azureCount}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {item.dbCount}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        {item.dbCount === 0 ? (
          <span className="text-gray-400">-</span>
        ) : item.avatarCount === item.dbCount ? (
          <span className="text-green-600">{item.avatarCount}</span>
        ) : (
          <span className="text-yellow-600">
            {item.avatarCount}/{item.dbCount}
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        {item.dbCount === 0 ? (
          <span className="text-gray-400">-</span>
        ) : item.sampleCount === item.dbCount ? (
          <span className="text-green-600">{item.sampleCount}</span>
        ) : (
          <span className="text-yellow-600">
            {item.sampleCount}/{item.dbCount}
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {item.azureCount === item.dbCount ? (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            已同步
          </span>
        ) : item.canSync ? (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
            待同步 (+{item.azureCount - item.dbCount})
          </span>
        ) : (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
            无需同步
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
        <button
          onClick={() => onSync(item.locale)}
          disabled={syncing !== null || !item.canSync}
          className={`px-3 py-1 text-sm rounded-lg transition-colors ${
            item.canSync
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          } disabled:opacity-50`}
        >
          {syncing === item.locale ? '...' : '同步'}
        </button>
        <button
          onClick={() => onGenerateSamples(item.locale)}
          disabled={syncing !== null || item.dbCount === 0}
          className={`px-3 py-1 text-sm rounded-lg transition-colors ${
            item.dbCount > 0
              ? 'bg-teal-600 text-white hover:bg-teal-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          } disabled:opacity-50`}
        >
          {syncing === `sample-${item.locale}` ? '...' : '生成'}
        </button>
        <button
          onClick={() => onClearSamples(item.locale)}
          disabled={syncing !== null || item.sampleCount === 0}
          className={`px-3 py-1 text-sm rounded-lg transition-colors ${
            item.sampleCount > 0
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          } disabled:opacity-50`}
        >
          {syncing === `clear-${item.locale}` ? '...' : '清空'}
        </button>
        {result && (
          <div className={`mt-2 text-xs ${result.success ? 'text-green-600' : 'text-red-600'}`}>
            {syncResults[`clear-${item.locale}`]
              ? (syncResults[`clear-${item.locale}`].success ? `清空 ${syncResults[`clear-${item.locale}`].updated || 0}` : '失败')
              : syncResults[`sample-${item.locale}`]
                ? (syncResults[`sample-${item.locale}`].success ? `+${syncResults[`sample-${item.locale}`].updated || 0}` : '失败')
                : (syncResults[item.locale]?.success ? `+${syncResults[item.locale].inserted || 0}` : '失败')}
          </div>
        )}
      </td>
    </tr>
  );
}
