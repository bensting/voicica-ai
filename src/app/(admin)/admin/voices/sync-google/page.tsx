'use client';

import {
  useGoogleVoiceSync,
  SyncCard,
  GoogleLocaleTable,
  GoogleVoiceDetailDialog,
  ConfirmDialog,
} from '@/components/features/admin/voices';

/**
 * Google 语音同步页面
 *
 * 功能：
 * - 从 Google TTS 同步语音数据
 * - 同步头像
 */
export default function GoogleVoiceSyncPage() {
  const {
    locales,
    filteredLocales,
    loading,
    syncing,
    syncResults,
    localeFilter,
    confirmDialog,
    voiceDetailDialog,
    setLocaleFilter,
    loadLocales,
    handleSync,
    handleSyncAll,
    handleUpdateAll,
    handleSyncAvatars,
    handleRegenerateAllAvatars,
    closeConfirmDialog,
    handleViewVoices,
    closeVoiceDetailDialog,
    handleSyncSamplesByLocale,
    handleSyncAvatarsByLocale,
  } = useGoogleVoiceSync();

  return (
    <div>
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Google 语音同步</h1>
        <p className="text-gray-600 mt-1">
          从 Google Cloud TTS 服务同步语音数据到本地数据库
        </p>
      </div>

      {/* 基础同步 */}
      <SyncCard
        title="基础同步"
        description="从 Google TTS 同步所有可同步的语言区域"
        syncing={syncing}
        syncResults={syncResults}
        actions={[
          {
            label: syncing === 'all' ? '同步中...' : '同步全部',
            syncKey: 'all',
            onClick: handleSyncAll,
            color: 'blue',
            disabled: locales.filter((l) => l.canSync).length === 0,
          },
          {
            label: syncing === 'update-all' ? '更新中...' : '更新全部',
            syncKey: 'update-all',
            onClick: handleUpdateAll,
            color: 'indigo',
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
            color: 'teal',
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

      {/* 语言列表 */}
      <GoogleLocaleTable
        locales={locales}
        filteredLocales={filteredLocales}
        localeFilter={localeFilter}
        setLocaleFilter={setLocaleFilter}
        loading={loading}
        syncing={syncing}
        syncResults={syncResults}
        onRefresh={loadLocales}
        onSync={handleSync}
        onView={handleViewVoices}
        onSyncSamples={handleSyncSamplesByLocale}
        onSyncAvatars={handleSyncAvatarsByLocale}
      />

      {/* 说明 */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">说明</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>
            • 语音数据从 <strong>Google Cloud TTS API</strong> 获取，按语言区域（locale）分组显示
          </li>
          <li>• 同步操作只会<strong>插入新语音</strong>，不会更新已存在的语音数据</li>
          <li>• 「Google 数量」表示 Google TTS 服务可用的语音数量</li>
          <li>• 「数据库数量」表示当前数据库中 provider=google 的语音数量</li>
          <li>• Google 语音类型包括：Wavenet、Neural2、Standard、Studio 等</li>
        </ul>
      </div>

      {/* 确认对话框 */}
      <ConfirmDialog dialog={confirmDialog} onClose={closeConfirmDialog} />

      {/* 语音详情弹窗 */}
      <GoogleVoiceDetailDialog dialog={voiceDetailDialog} onClose={closeVoiceDetailDialog} />
    </div>
  );
}