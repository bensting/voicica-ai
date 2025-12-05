'use client';

import {
  useFishVoiceSync,
  SyncCard,
  FishVoiceTable,
  FishVoiceDetailDialog,
  ConfirmDialog,
} from '@/components/features/admin/voices';

/**
 * Fish Audio 语音同步页面
 *
 * 功能：
 * - 从 Fish Audio 同步热门语音数据
 * - 更新语音封面和样例
 */
export default function FishVoiceSyncPage() {
  const {
    voices,
    filteredVoices,
    total,
    loading,
    syncing,
    syncResults,
    searchFilter,
    languageFilter,
    sortBy,
    pageNumber,
    pageSize,
    confirmDialog,
    voiceDetailDialog,
    exporting,
    setSearchFilter,
    setLanguageFilter,
    setSortBy,
    handleSearch,
    handleSyncPopular,
    handleUpdateAll,
    handleSyncAvatars,
    handleSyncSingle,
    handleSyncToTW,
    closeConfirmDialog,
    handleViewVoice,
    closeVoiceDetailDialog,
    handlePageChange,
    handleExportExcel,
  } = useFishVoiceSync();

  return (
    <div>
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Fish Audio 语音同步</h1>
        <p className="text-gray-600 mt-1">
          从 Fish Audio 平台同步热门语音模型到本地数据库
        </p>
      </div>

      {/* 基础同步 */}
      <SyncCard
        title="批量同步"
        description="从 Fish Audio 同步热门语音模型（按使用次数排序）"
        syncing={syncing}
        syncResults={syncResults}
        actions={[
          {
            label: syncing === 'popular' ? '同步中...' : '同步前 50 个',
            syncKey: 'popular',
            onClick: () => handleSyncPopular(50),
            color: 'blue',
          },
          {
            label: syncing === 'update-all' ? '更新中...' : '更新全部',
            syncKey: 'update-all',
            onClick: handleUpdateAll,
            color: 'indigo',
          },
        ]}
        resultKeys={['popular', 'update-all']}
      />

      {/* 头像同步 */}
      <SyncCard
        title="头像同步"
        description="从 Fish Audio 获取语音封面图作为头像"
        syncing={syncing}
        syncResults={syncResults}
        actions={[
          {
            label: syncing === 'avatars' ? '同步中...' : '同步空头像',
            syncKey: 'avatars',
            onClick: handleSyncAvatars,
            color: 'teal',
          },
        ]}
        resultKeys={['avatars']}
      />

      {/* 语音列表 */}
      <FishVoiceTable
        voices={voices}
        filteredVoices={filteredVoices}
        total={total}
        searchFilter={searchFilter}
        setSearchFilter={setSearchFilter}
        languageFilter={languageFilter}
        setLanguageFilter={setLanguageFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        loading={loading}
        syncing={syncing}
        syncResults={syncResults}
        pageNumber={pageNumber}
        pageSize={pageSize}
        exporting={exporting}
        onSearch={handleSearch}
        onSync={handleSyncSingle}
        onSyncTW={handleSyncToTW}
        onView={handleViewVoice}
        onPageChange={handlePageChange}
        onExport={handleExportExcel}
      />

      {/* 说明 */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">说明</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>
            • 语音数据从 <strong>Fish Audio API</strong> 获取，按热度（使用次数）排序
          </li>
          <li>• 同步操作只会<strong>插入新语音</strong>，不会覆盖已存在的语音</li>
          <li>• 每个语音的封面图会自动作为头像使用</li>
          <li>• 语音样例 URL 带有签名，有效期为 1 小时，需要定期更新</li>
          <li>• Fish Audio 语音来自社区贡献，质量可能参差不齐</li>
        </ul>
      </div>

      {/* 确认对话框 */}
      <ConfirmDialog dialog={confirmDialog} onClose={closeConfirmDialog} />

      {/* 语音详情弹窗 */}
      <FishVoiceDetailDialog
        dialog={voiceDetailDialog}
        onClose={closeVoiceDetailDialog}
        onSync={handleSyncSingle}
        syncing={syncing}
      />
    </div>
  );
}