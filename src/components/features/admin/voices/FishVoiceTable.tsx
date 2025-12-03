'use client';

import { SyncResult } from './types';
import { FishVoiceDetail } from './useFishVoiceSync';

interface FishVoiceTableProps {
  voices: FishVoiceDetail[];
  filteredVoices: FishVoiceDetail[];
  total: number;
  searchFilter: string;
  setSearchFilter: (value: string) => void;
  languageFilter: string;
  setLanguageFilter: (value: string) => void;
  loading: boolean;
  syncing: string | null;
  syncResults: Record<string, SyncResult>;
  pageNumber: number;
  pageSize: number;
  exporting?: boolean;
  onRefresh: () => void;
  onSync: (modelId: string) => void;
  onSyncTW?: (modelId: string) => void;
  onView: (voice: FishVoiceDetail) => void;
  onPageChange: (page: number) => void;
  onExport?: () => void;
}

// 支持的语言选项
const LANGUAGE_OPTIONS = [
  { value: '', label: '全部语言' },
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'ar', label: 'العربية' },
  { value: 'ru', label: 'Русский' },
  { value: 'pt', label: 'Português' },
];

/**
 * Fish 语音列表表格组件
 */
export default function FishVoiceTable({
  voices,
  filteredVoices,
  total,
  searchFilter,
  setSearchFilter,
  languageFilter,
  setLanguageFilter,
  loading,
  syncing,
  syncResults,
  pageNumber,
  pageSize,
  exporting,
  onRefresh,
  onSync,
  onSyncTW,
  onView,
  onPageChange,
  onExport,
}: FishVoiceTableProps) {
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* 表头 */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <h2 className="text-lg font-semibold text-gray-900">Fish Audio 语音库</h2>
          <input
            type="text"
            placeholder="搜索语音..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48"
          />
          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-500">
            共 {total.toLocaleString()} 个模型
          </span>
        </div>
        <div className="flex gap-2">
          {onExport && (
            <button
              onClick={onExport}
              disabled={exporting || loading}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {exporting ? '导出中...' : '下载 Excel'}
            </button>
          )}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {loading ? '加载中...' : '刷新'}
          </button>
        </div>
      </div>

      {/* 表格内容 */}
      {loading ? (
        <div className="p-8 text-center text-gray-500">加载中...</div>
      ) : voices.length === 0 ? (
        <div className="p-8 text-center text-gray-500">暂无数据</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  语音
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  作者
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  语言
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  使用次数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  点赞
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  标签
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredVoices.map((voice) => (
                <FishVoiceTableRow
                  key={voice.id}
                  voice={voice}
                  syncing={syncing}
                  syncResults={syncResults}
                  onSync={onSync}
                  onSyncTW={onSyncTW}
                  onView={onView}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            第 {pageNumber} 页，共 {totalPages} 页
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(pageNumber - 1)}
              disabled={pageNumber <= 1 || loading}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            <button
              onClick={() => onPageChange(pageNumber + 1)}
              disabled={pageNumber >= totalPages || loading}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 表格行组件
 */
function FishVoiceTableRow({
  voice,
  syncing,
  syncResults,
  onSync,
  onSyncTW,
  onView,
}: {
  voice: FishVoiceDetail;
  syncing: string | null;
  syncResults: Record<string, SyncResult>;
  onSync: (modelId: string) => void;
  onSyncTW?: (modelId: string) => void;
  onView: (voice: FishVoiceDetail) => void;
}) {
  const syncKey = `single-${voice.id}`;
  const syncKeyTW = `single-tw-${voice.id}`;
  const result = syncResults[syncKey];
  const resultTW = syncResults[syncKeyTW];
  const isSyncing = syncing === syncKey;
  const isSyncingTW = syncing === syncKeyTW;

  // 是否是中文语音
  const isChineseVoice = voice.languages.includes('zh');

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          {voice.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={voice.coverImage}
              alt={voice.title}
              className="w-10 h-10 rounded-lg object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-gray-400"
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
          )}
          <div>
            <div className="font-medium text-gray-900 max-w-[200px] truncate">
              {voice.title}
            </div>
            <div className="text-xs text-gray-500 truncate max-w-[200px]">
              {voice.id}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {voice.author}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-wrap gap-1">
          {voice.languages.slice(0, 3).map((lang) => (
            <span
              key={lang}
              className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded"
            >
              {lang}
            </span>
          ))}
          {voice.languages.length > 3 && (
            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
              +{voice.languages.length - 3}
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {voice.taskCount.toLocaleString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {voice.likeCount.toLocaleString()}
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1 max-w-[150px]">
          {voice.tags.slice(0, 2).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
            >
              {tag}
            </span>
          ))}
          {voice.tags.length > 2 && (
            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
              +{voice.tags.length - 2}
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onView(voice)}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            查看
          </button>
          <button
            onClick={() => onSync(voice.id)}
            disabled={syncing !== null}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSyncing ? '同步中...' : '同步'}
          </button>
          {/* 中文语音显示同步TW按钮 */}
          {isChineseVoice && onSyncTW && (
            <button
              onClick={() => onSyncTW(voice.id)}
              disabled={syncing !== null}
              className="px-3 py-1 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {isSyncingTW ? '同步中...' : '同步TW'}
            </button>
          )}
        </div>
        {/* 结果提示 */}
        {result && (
          <div
            className={`mt-1 text-xs ${result.success ? 'text-green-600' : 'text-red-600'}`}
          >
            {result.success
              ? result.inserted
                ? '已同步(CN)'
                : '已存在(CN)'
              : '同步失败'}
          </div>
        )}
        {resultTW && (
          <div
            className={`mt-1 text-xs ${resultTW.success ? 'text-green-600' : 'text-red-600'}`}
          >
            {resultTW.success
              ? resultTW.inserted
                ? '已同步(TW)'
                : '已存在(TW)'
              : '同步失败(TW)'}
          </div>
        )}
      </td>
    </tr>
  );
}