'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getAppReleases,
  uploadAppRelease,
  updateAppRelease,
  setLatestRelease,
  deleteAppRelease,
  type AppRelease,
} from '@/actions/admin/app-releases';

/**
 * App Releases 管理页面
 * 管理 Android APK 版本发布
 */
export default function AppReleasesPage() {
  const [releases, setReleases] = useState<AppRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [platformFilter, setPlatformFilter] = useState<string>('');

  // 上传相关状态
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    platform: 'android',
    version: '',
    version_code: '',
    release_notes: '',
    is_force_update: false,
    set_as_latest: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 加载版本列表
  const loadReleases = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAppReleases({
        platform: platformFilter || undefined,
      });
      setReleases(result);
    } catch (error) {
      console.error('加载版本列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [platformFilter]);

  useEffect(() => {
    loadReleases();
  }, [loadReleases]);

  // 格式化文件大小
  const formatFileSize = (bytes: bigint | null): string => {
    if (!bytes) return '-';
    const num = Number(bytes);
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 上传新版本
  const handleUpload = async () => {
    if (!selectedFile) {
      alert('请选择 APK 文件');
      return;
    }
    if (!uploadForm.version || !uploadForm.version_code) {
      alert('请填写版本号');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('platform', uploadForm.platform);
      formData.append('version', uploadForm.version);
      formData.append('version_code', uploadForm.version_code);
      formData.append('release_notes', uploadForm.release_notes);
      formData.append('is_force_update', uploadForm.is_force_update.toString());
      formData.append('set_as_latest', uploadForm.set_as_latest.toString());

      const result = await uploadAppRelease(formData);
      if (result.success) {
        alert('上传成功');
        setShowUploadModal(false);
        setSelectedFile(null);
        setUploadForm({
          platform: 'android',
          version: '',
          version_code: '',
          release_notes: '',
          is_force_update: false,
          set_as_latest: true,
        });
        loadReleases();
      } else {
        alert(`上传失败: ${result.message}`);
      }
    } catch (error) {
      console.error('上传失败:', error);
      alert('上传失败');
    } finally {
      setUploading(false);
    }
  };

  // 设为最新版本
  const handleSetLatest = async (id: number, version: string) => {
    if (!confirm(`确定要将 v${version} 设为最新版本吗？`)) return;

    const result = await setLatestRelease(id);
    if (result.success) {
      loadReleases();
    } else {
      alert(result.message);
    }
  };

  // 切换状态
  const handleToggleActive = async (id: number, currentActive: boolean) => {
    const result = await updateAppRelease(id, { is_active: !currentActive });
    if (result.success) {
      setReleases((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_active: !currentActive } : r))
      );
    } else {
      alert(result.message);
    }
  };

  // 切换强制更新
  const handleToggleForceUpdate = async (id: number, currentForce: boolean) => {
    const result = await updateAppRelease(id, { is_force_update: !currentForce });
    if (result.success) {
      setReleases((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_force_update: !currentForce } : r))
      );
    } else {
      alert(result.message);
    }
  };

  // 删除版本
  const handleDelete = async (id: number, version: string) => {
    if (!confirm(`确定要删除 v${version} 吗？此操作不可恢复。`)) return;

    const result = await deleteAppRelease(id);
    if (result.success) {
      loadReleases();
    } else {
      alert(result.message);
    }
  };

  return (
    <div>
      {/* 页面标题 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">App 版本管理</h1>
          <p className="text-gray-600 mt-1">管理 Android APK 版本发布</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          上传新版本
        </button>
      </div>

      {/* 筛选栏 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex gap-4">
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">所有平台</option>
            <option value="android">Android</option>
            <option value="ios">iOS</option>
          </select>
        </div>
      </div>

      {/* 版本列表 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  版本
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  平台
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  版本号
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  文件大小
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  下载次数
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  状态
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  发布日期
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                      加载中...
                    </div>
                  </td>
                </tr>
              ) : releases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    暂无版本记录
                  </td>
                </tr>
              ) : (
                releases.map((release) => (
                  <tr key={release.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          v{release.version}
                        </span>
                        {release.is_latest && (
                          <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                            最新
                          </span>
                        )}
                        {release.is_force_update && (
                          <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                            强制更新
                          </span>
                        )}
                      </div>
                      {release.release_notes && (
                        <div className="text-xs text-gray-500 mt-1 max-w-[200px] truncate">
                          {release.release_notes}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${
                          release.platform === 'android'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {release.platform === 'android' ? 'Android' : 'iOS'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {release.version_code}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatFileSize(release.file_size)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {release.download_count.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${
                          release.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {release.is_active ? '已启用' : '已禁用'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(release.created_at).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <a
                          href={release.download_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          下载
                        </a>
                        {!release.is_latest && (
                          <button
                            onClick={() => handleSetLatest(release.id, release.version)}
                            className="text-sm text-green-600 hover:text-green-700"
                          >
                            设为最新
                          </button>
                        )}
                        <button
                          onClick={() =>
                            handleToggleForceUpdate(release.id, release.is_force_update)
                          }
                          className="text-sm text-orange-600 hover:text-orange-700"
                        >
                          {release.is_force_update ? '取消强制' : '强制更新'}
                        </button>
                        <button
                          onClick={() =>
                            handleToggleActive(release.id, release.is_active)
                          }
                          className={`text-sm ${
                            release.is_active
                              ? 'text-gray-600 hover:text-gray-700'
                              : 'text-green-600 hover:text-green-700'
                          }`}
                        >
                          {release.is_active ? '禁用' : '启用'}
                        </button>
                        <button
                          onClick={() => handleDelete(release.id, release.version)}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 上传模态框 */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg m-4">
            {/* 模态框头部 */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">上传新版本</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* 模态框内容 */}
            <div className="p-6 space-y-4">
              {/* 文件选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  APK 文件
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".apk"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-purple-500 transition-colors"
                >
                  {selectedFile ? (
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">{selectedFile.name}</span>
                      <span className="text-gray-500 ml-2">
                        ({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)
                      </span>
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      <svg
                        className="w-8 h-8 mx-auto mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                        />
                      </svg>
                      点击选择 APK 文件
                    </div>
                  )}
                </div>
              </div>

              {/* 平台 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  平台
                </label>
                <select
                  value={uploadForm.platform}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, platform: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="android">Android</option>
                  <option value="ios">iOS</option>
                </select>
              </div>

              {/* 版本信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    版本号 (如 1.0.0)
                  </label>
                  <input
                    type="text"
                    value={uploadForm.version}
                    onChange={(e) =>
                      setUploadForm({ ...uploadForm, version: e.target.value })
                    }
                    placeholder="1.0.0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    构建号 (递增数字)
                  </label>
                  <input
                    type="number"
                    value={uploadForm.version_code}
                    onChange={(e) =>
                      setUploadForm({ ...uploadForm, version_code: e.target.value })
                    }
                    placeholder="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* 更新说明 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  更新说明
                </label>
                <textarea
                  value={uploadForm.release_notes}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, release_notes: e.target.value })
                  }
                  rows={3}
                  placeholder="本次更新内容..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* 选项 */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={uploadForm.set_as_latest}
                    onChange={(e) =>
                      setUploadForm({ ...uploadForm, set_as_latest: e.target.checked })
                    }
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">设为最新版本</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={uploadForm.is_force_update}
                    onChange={(e) =>
                      setUploadForm({
                        ...uploadForm,
                        is_force_update: e.target.checked,
                      })
                    }
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">强制用户更新</span>
                </label>
              </div>
            </div>

            {/* 模态框底部 */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {uploading ? '上传中...' : '上传'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}