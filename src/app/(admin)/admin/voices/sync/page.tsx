'use client';

import {
  useVoiceSync,
  SyncCard,
  LocaleTable,
  ConfirmDialog,
} from '@/components/features/admin/voices';

/**
 * Azure 语音同步页面
 *
 * 功能：
 * - 从 Azure TTS 同步语音数据
 * - 同步头像
 * - 生成语音样本
 */
export default function VoiceSyncPage() {
  const {
    locales,
    filteredLocales,
    loading,
    syncing,
    syncResults,
    localeFilter,
    confirmDialog,
    setLocaleFilter,
    loadLocales,
    handleSync,
    handleSyncAll,
    handleUpdateAll,
    handleSyncAvatars,
    handleRegenerateAllAvatars,
    handleGenerateSamples,
    handleGenerateAllSamples,
    handleClearSamples,
    closeConfirmDialog,
  } = useVoiceSync();

  return (
    <div>
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Azure 语音同步</h1>
        <p className="text-gray-600 mt-1">
          从 Azure TTS 服务同步语音数据到本地数据库
        </p>
      </div>

      {/* 基础同步 */}
      <SyncCard
        title="基础同步"
        description="从 Azure TTS 同步所有可同步的语言区域"
        syncing={syncing}
        syncResults={syncResults}
        actions={[
          {
            label: syncing === 'all' ? '同步中...' : '同步全部',
            syncKey: 'all',
            onClick: handleSyncAll,
            color: 'purple',
            disabled: locales.filter((l) => l.canSync).length === 0,
          },
          {
            label: syncing === 'update-all' ? '更新中...' : '更新全部',
            syncKey: 'update-all',
            onClick: handleUpdateAll,
            color: 'blue',
          },
        ]}
        resultKeys={['all', 'update-all']}
      />

      {/* 头像同步 */}
      <SyncCard
        title="头像同步"
        description="使用 DiceBear 为语音生成头像"
        syncing={syncing}
        syncResults={syncResults}
        actions={[
          {
            label: syncing === 'avatars' ? '同步中...' : '同步空头像',
            syncKey: 'avatars',
            onClick: handleSyncAvatars,
            color: 'indigo',
          },
          {
            label: syncing === 'regenerate' ? '生成中...' : '重新生成全部',
            syncKey: 'regenerate',
            onClick: handleRegenerateAllAvatars,
            color: 'orange',
          },
        ]}
        resultKeys={['avatars', 'regenerate']}
      />

      {/* 语音样本生成 */}
      <SyncCard
        title="语音样本"
        description="使用 Azure TTS 为语音生成试听样本（上传到 R2）"
        syncing={syncing}
        syncResults={syncResults}
        actions={[
          {
            label: syncing === 'samples-all' ? '生成中...' : '批量生成样本',
            syncKey: 'samples-all',
            onClick: handleGenerateAllSamples,
            color: 'teal',
          },
        ]}
        resultKeys={['samples-all']}
      />

      {/* 语言列表 */}
      <LocaleTable
        locales={locales}
        filteredLocales={filteredLocales}
        localeFilter={localeFilter}
        setLocaleFilter={setLocaleFilter}
        loading={loading}
        syncing={syncing}
        syncResults={syncResults}
        onRefresh={loadLocales}
        onSync={handleSync}
        onGenerateSamples={handleGenerateSamples}
        onClearSamples={handleClearSamples}
      />

      {/* 说明 */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">说明</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>
            • 语音数据从 <strong>Azure TTS API</strong> 获取，按语言区域（locale）分组显示
          </li>
          <li>• 同步操作只会<strong>插入新语音</strong>，不会更新已存在的语音数据</li>
          <li>• 「Azure 数量」表示 Azure TTS 服务可用的语音数量</li>
          <li>• 「数据库数量」表示当前数据库中的语音数量</li>
        </ul>
      </div>

      {/* 确认对话框 */}
      <ConfirmDialog dialog={confirmDialog} onClose={closeConfirmDialog} />
    </div>
  );
}