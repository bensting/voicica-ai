'use client';

import { SyncResult } from './types';
import { GoogleLocaleStats } from './useGoogleVoiceSync';

interface GoogleLocaleTableProps {
  locales: GoogleLocaleStats[];
  filteredLocales: GoogleLocaleStats[];
  localeFilter: string;
  setLocaleFilter: (value: string) => void;
  loading: boolean;
  syncing: string | null;
  syncResults: Record<string, SyncResult>;
  onRefresh: () => void;
  onSync: (locale: string) => void;
  onView: (locale: string, localeName: string) => void;
  onSyncSamples: (locale: string) => void;
  onSyncAvatars: (locale: string) => void;
}

/**
 * Google 语言区域列表表格组件
 */
export default function GoogleLocaleTable({
  locales,
  filteredLocales,
  localeFilter,
  setLocaleFilter,
  loading,
  syncing,
  syncResults,
  onRefresh,
  onSync,
  onView,
  onSyncSamples,
  onSyncAvatars,
}: GoogleLocaleTableProps) {
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
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48"
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
                  Google 数量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  数据库数量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  样例
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  头像
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
                <GoogleLocaleTableRow
                  key={item.locale}
                  item={item}
                  syncing={syncing}
                  syncResults={syncResults}
                  onSync={onSync}
                  onView={onView}
                  onSyncSamples={onSyncSamples}
                  onSyncAvatars={onSyncAvatars}
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
function GoogleLocaleTableRow({
  item,
  syncing,
  syncResults,
  onSync,
  onView,
  onSyncSamples,
  onSyncAvatars,
}: {
  item: GoogleLocaleStats;
  syncing: string | null;
  syncResults: Record<string, SyncResult>;
  onSync: (locale: string) => void;
  onView: (locale: string, localeName: string) => void;
  onSyncSamples: (locale: string) => void;
  onSyncAvatars: (locale: string) => void;
}) {
  const result = syncResults[item.locale];
  const samplesResult = syncResults[`samples-${item.locale}`];
  const avatarsResult = syncResults[`avatars-${item.locale}`];
  const isSyncingSamples = syncing === `samples-${item.locale}`;
  const isSyncingAvatars = syncing === `avatars-${item.locale}`;
  const hasDbData = item.dbCount > 0;

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="font-medium text-gray-900">{item.locale}</div>
        <div className="text-sm text-gray-500">{item.localeName}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {item.googleCount}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {item.dbCount}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        {item.dbCount > 0 ? (
          <span className={item.sampleCount === item.dbCount ? 'text-green-600' : 'text-gray-900'}>
            {item.sampleCount}/{item.dbCount}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        {item.dbCount > 0 ? (
          <span className={item.avatarCount === item.dbCount ? 'text-green-600' : 'text-gray-900'}>
            {item.avatarCount}/{item.dbCount}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {item.googleCount === item.dbCount ? (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            已同步
          </span>
        ) : item.canSync ? (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
            待同步 (+{item.googleCount - item.dbCount})
          </span>
        ) : (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
            无需同步
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onView(item.locale, item.localeName)}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            查看
          </button>
          <button
            onClick={() => onSyncSamples(item.locale)}
            disabled={syncing !== null || !hasDbData}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              hasDbData
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            } disabled:opacity-50`}
          >
            {isSyncingSamples ? '生成中...' : '样例'}
          </button>
          <button
            onClick={() => onSyncAvatars(item.locale)}
            disabled={syncing !== null || !hasDbData}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              hasDbData
                ? 'bg-teal-600 text-white hover:bg-teal-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            } disabled:opacity-50`}
          >
            {isSyncingAvatars ? '生成中...' : '头像'}
          </button>
          <button
            onClick={() => onSync(item.locale)}
            disabled={syncing !== null || !item.canSync}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              item.canSync
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            } disabled:opacity-50`}
          >
            {syncing === item.locale ? '同步中...' : '同步'}
          </button>
        </div>
        {/* 结果提示 */}
        <div className="mt-2 text-xs space-y-1">
          {result && (
            <div className={result.success ? 'text-green-600' : 'text-red-600'}>
              同步: {result.success ? `+${result.inserted || 0}` : '失败'}
            </div>
          )}
          {samplesResult && (
            <div className={samplesResult.success ? 'text-purple-600' : 'text-red-600'}>
              样例: {samplesResult.success ? `${samplesResult.updated || 0} 成功` : '失败'}
            </div>
          )}
          {avatarsResult && (
            <div className={avatarsResult.success ? 'text-teal-600' : 'text-red-600'}>
              头像: {avatarsResult.success ? `${avatarsResult.updated || 0} 成功` : '失败'}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}