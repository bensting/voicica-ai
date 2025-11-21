'use client';

import { useState, useEffect } from 'react';
import { syncVoicesByLocale, getVoiceStatsByLocale, syncVoiceAvatars, regenerateAllAvatars, generateVoiceSamples, generateAllVoiceSamples } from '@/actions/admin/voices';

interface LocaleStats {
  locale: string;
  localeName: string;
  azureCount: number;
  dbCount: number;
  avatarCount: number;
  sampleCount: number;
  canSync: boolean;
}

interface SyncResult {
  success: boolean;
  message: string;
  inserted?: number;
  skipped?: number;
  updated?: number;
}

/**
 * 语音管理页面
 */
export default function VoicesManagementPage() {
  const [locales, setLocales] = useState<LocaleStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncResults, setSyncResults] = useState<Record<string, SyncResult>>({});

  // 加载 locale 列表和统计
  const loadLocales = async () => {
    setLoading(true);
    try {
      const data = await getVoiceStatsByLocale();
      setLocales(data);
    } catch (error) {
      console.error('加载语言列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocales();
  }, []);

  // 同步指定 locale 的语音
  const handleSync = async (locale: string) => {
    setSyncing(locale);
    try {
      const result = await syncVoicesByLocale(locale);
      setSyncResults((prev) => ({ ...prev, [locale]: result }));
      // 同步成功后刷新统计
      if (result.success) {
        await loadLocales();
      }
    } catch (error) {
      setSyncResults((prev) => ({
        ...prev,
        [locale]: {
          success: false,
          message: error instanceof Error ? error.message : '同步失败',
        },
      }));
    } finally {
      setSyncing(null);
    }
  };

  // 基础同步所有
  const handleSyncAll = async () => {
    setSyncing('all');
    let totalInserted = 0;
    let totalSkipped = 0;
    let failedLocales: string[] = [];

    for (const item of locales) {
      if (item.canSync) {
        try {
          const result = await syncVoicesByLocale(item.locale);
          if (result.success) {
            totalInserted += result.inserted || 0;
            totalSkipped += result.skipped || 0;
          } else {
            failedLocales.push(item.locale);
          }
          setSyncResults((prev) => ({ ...prev, [item.locale]: result }));
        } catch (error) {
          failedLocales.push(item.locale);
        }
      }
    }

    setSyncing(null);
    await loadLocales();

    // 显示总结
    setSyncResults((prev) => ({
      ...prev,
      all: {
        success: failedLocales.length === 0,
        message: failedLocales.length === 0
          ? `全部同步完成`
          : `部分同步失败: ${failedLocales.join(', ')}`,
        inserted: totalInserted,
        skipped: totalSkipped,
      },
    }));
  };

  // 同步头像（只更新空头像）
  const handleSyncAvatars = async () => {
    setSyncing('avatars');
    try {
      const result = await syncVoiceAvatars();
      setSyncResults((prev) => ({ ...prev, avatars: result }));
      if (result.success) {
        await loadLocales();
      }
    } catch (error) {
      setSyncResults((prev) => ({
        ...prev,
        avatars: {
          success: false,
          message: error instanceof Error ? error.message : '同步失败',
        },
      }));
    } finally {
      setSyncing(null);
    }
  };

  // 重新生成全部头像
  const handleRegenerateAllAvatars = async () => {
    setSyncing('regenerate');
    try {
      const result = await regenerateAllAvatars();
      setSyncResults((prev) => ({ ...prev, regenerate: result }));
      if (result.success) {
        await loadLocales();
      }
    } catch (error) {
      setSyncResults((prev) => ({
        ...prev,
        regenerate: {
          success: false,
          message: error instanceof Error ? error.message : '重新生成失败',
        },
      }));
    } finally {
      setSyncing(null);
    }
  };

  // 生成指定 locale 的语音样本
  const handleGenerateSamples = async (locale: string) => {
    setSyncing(`sample-${locale}`);
    try {
      const result = await generateVoiceSamples(locale);
      setSyncResults((prev) => ({ ...prev, [`sample-${locale}`]: result }));
      if (result.success) {
        await loadLocales();
      }
    } catch (error) {
      setSyncResults((prev) => ({
        ...prev,
        [`sample-${locale}`]: {
          success: false,
          message: error instanceof Error ? error.message : '生成失败',
        },
      }));
    } finally {
      setSyncing(null);
    }
  };

  // 批量生成所有语音样本
  const handleGenerateAllSamples = async () => {
    setSyncing('samples-all');
    try {
      const result = await generateAllVoiceSamples();
      setSyncResults((prev) => ({ ...prev, 'samples-all': result }));
      if (result.success) {
        await loadLocales();
      }
    } catch (error) {
      setSyncResults((prev) => ({
        ...prev,
        'samples-all': {
          success: false,
          message: error instanceof Error ? error.message : '生成失败',
        },
      }));
    } finally {
      setSyncing(null);
    }
  };

  return (
    <div>
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">语音管理</h1>
        <p className="text-gray-600 mt-1">按语言区域同步语音数据（仅插入新语音，不更新现有数据）</p>
      </div>

      {/* 全部同步 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">基础同步</h2>
            <p className="text-sm text-gray-600 mt-1">从 Azure TTS 同步所有可同步的语言区域</p>
          </div>
          <button
            onClick={handleSyncAll}
            disabled={syncing !== null || locales.filter(l => l.canSync).length === 0}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncing === 'all' ? '同步中...' : '同步全部'}
          </button>
        </div>
        {syncResults.all && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            syncResults.all.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            <div className="font-medium">
              {syncResults.all.success ? '✓ 同步完成' : '✗ 部分失败'}
            </div>
            <div className="mt-1">{syncResults.all.message}</div>
            {(syncResults.all.inserted !== undefined || syncResults.all.skipped !== undefined) && (
              <div className="mt-1 text-xs opacity-80">
                新增: {syncResults.all.inserted || 0} | 跳过: {syncResults.all.skipped || 0}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 头像同步 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">头像同步</h2>
            <p className="text-sm text-gray-600 mt-1">使用 DiceBear 为语音生成头像</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSyncAvatars}
              disabled={syncing !== null}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncing === 'avatars' ? '同步中...' : '同步空头像'}
            </button>
            <button
              onClick={handleRegenerateAllAvatars}
              disabled={syncing !== null}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncing === 'regenerate' ? '生成中...' : '重新生成全部'}
            </button>
          </div>
        </div>
        {(syncResults.avatars || syncResults.regenerate) && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            (syncResults.regenerate || syncResults.avatars)?.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            <div className="font-medium">
              {(syncResults.regenerate || syncResults.avatars)?.success ? '✓ 操作完成' : '✗ 操作失败'}
            </div>
            <div className="mt-1">{(syncResults.regenerate || syncResults.avatars)?.message}</div>
            {(syncResults.regenerate || syncResults.avatars)?.updated !== undefined && (
              <div className="mt-1 text-xs opacity-80">
                更新: {(syncResults.regenerate || syncResults.avatars)?.updated}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 语音样本生成 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">语音样本</h2>
            <p className="text-sm text-gray-600 mt-1">使用 Azure TTS 为语音生成试听样本（上传到 R2）</p>
          </div>
          <button
            onClick={handleGenerateAllSamples}
            disabled={syncing !== null}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncing === 'samples-all' ? '生成中...' : '批量生成样本'}
          </button>
        </div>
        {syncResults['samples-all'] && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            syncResults['samples-all'].success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            <div className="font-medium">
              {syncResults['samples-all'].success ? '✓ 生成完成' : '✗ 生成失败'}
            </div>
            <div className="mt-1">{syncResults['samples-all'].message}</div>
            {syncResults['samples-all'].updated !== undefined && (
              <div className="mt-1 text-xs opacity-80">
                生成: {syncResults['samples-all'].updated}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 语言列表 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">语言区域列表</h2>
          <button
            onClick={loadLocales}
            disabled={loading}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {loading ? '加载中...' : '刷新'}
          </button>
        </div>

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
                {locales.map((item) => (
                  <tr key={item.locale} className="hover:bg-gray-50">
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
                        onClick={() => handleSync(item.locale)}
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
                        onClick={() => handleGenerateSamples(item.locale)}
                        disabled={syncing !== null || item.dbCount === 0 || item.sampleCount === item.dbCount}
                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                          item.dbCount > 0 && item.sampleCount < item.dbCount
                            ? 'bg-teal-600 text-white hover:bg-teal-700'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        } disabled:opacity-50`}
                      >
                        {syncing === `sample-${item.locale}` ? '...' : '样本'}
                      </button>
                      {(syncResults[item.locale] || syncResults[`sample-${item.locale}`]) && (
                        <div className={`mt-2 text-xs ${
                          (syncResults[`sample-${item.locale}`] || syncResults[item.locale])?.success ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {syncResults[`sample-${item.locale}`]
                            ? (syncResults[`sample-${item.locale}`].success ? `+${syncResults[`sample-${item.locale}`].updated || 0}` : '失败')
                            : (syncResults[item.locale]?.success ? `+${syncResults[item.locale].inserted || 0}` : '失败')}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 说明 */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">说明</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 语音数据从 <strong>Azure TTS API</strong> 获取，按语言区域（locale）分组显示</li>
          <li>• 同步操作只会<strong>插入新语音</strong>，不会更新已存在的语音数据</li>
          <li>• "Azure 数量"表示 Azure TTS 服务可用的语音数量</li>
          <li>• "数据库数量"表示当前数据库中的语音数量</li>
        </ul>
      </div>
    </div>
  );
}