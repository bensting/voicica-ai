'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getRvcVoiceModels,
  createRvcVoiceModel,
  updateRvcVoiceModel,
  deleteRvcVoiceModel,
  toggleRvcVoiceModelActive,
  getRvcModelZipUploadUrl,
  getRvcAvatarUploadUrl,
  createBuiltinModels,
  type RvcVoiceModel,
} from '@/actions/admin/rvc-models';

// 声音模型分类
const RVC_CATEGORIES = [
  { id: 'music', label: '音乐' },
  { id: 'rapper', label: '说唱' },
  { id: 'celebrity', label: '名人' },
  { id: 'cartoon', label: '卡通' },
  { id: 'anime', label: '动漫' },
  { id: 'my-clone', label: '我的克隆' },
];

// 内置模型名称（RVC-v2 API 支持的）
const BUILTIN_MODEL_NAMES = ['Obama', 'Trump', 'Sandy', 'Rogan'];

/**
 * RVC Voice Models 管理页面
 * 管理 AI Cover 功能的声音模型
 */
export default function RvcModelsPage() {
  const [models, setModels] = useState<RvcVoiceModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  // 上传模态框状态
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  // 编辑模态框状态
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingModel, setEditingModel] = useState<RvcVoiceModel | null>(null);
  const [editUploading, setEditUploading] = useState(false);
  const [editUploadProgress, setEditUploadProgress] = useState(0);
  const [editUploadStatus, setEditUploadStatus] = useState<string>('');

  // 表单状态
  const [form, setForm] = useState({
    name: '',
    slug: '',
    category: 'music',
    is_builtin: false,
    builtin_name: '',
    sort_order: 0,
  });

  // 文件状态
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const zipInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // 编辑表单状态
  const [editForm, setEditForm] = useState({
    name: '',
    category: '',
    sort_order: 0,
  });
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const editAvatarInputRef = useRef<HTMLInputElement>(null);

  // 加载模型列表
  const loadModels = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getRvcVoiceModels({
        category: categoryFilter || undefined,
      });
      setModels(result);
    } catch (error) {
      console.error('加载模型列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  // 自动生成 slug
  useEffect(() => {
    if (form.name && !form.slug) {
      const slug = form.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setForm((prev) => ({ ...prev, slug }));
    }
  }, [form.name, form.slug]);

  // 格式化使用次数
  const formatUsesCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}m`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  // 上传文件到 R2
  const uploadFileToR2 = async (
    file: File,
    uploadUrl: string,
    onProgress?: (percent: number) => void,
    contentType?: string
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(true);
        } else {
          console.error('R2 上传失败:', xhr.status, xhr.statusText);
          resolve(false);
        }
      };

      xhr.onerror = () => {
        console.error('R2 上传网络错误');
        resolve(false);
      };

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', contentType || file.type || 'application/octet-stream');
      xhr.send(file);
    });
  };

  // 创建模型
  const handleCreate = async () => {
    if (!form.name || !form.slug) {
      alert('请填写名称和 Slug');
      return;
    }

    // 内置模型不需要上传文件
    if (form.is_builtin) {
      if (!form.builtin_name) {
        alert('请选择内置模型名称');
        return;
      }

      const result = await createRvcVoiceModel({
        name: form.name,
        slug: form.slug,
        category: form.category,
        model_url: '', // 内置模型不需要 URL
        is_builtin: true,
        builtin_name: form.builtin_name,
        sort_order: form.sort_order,
      });

      if (result.success) {
        alert('创建成功');
        resetForm();
        loadModels();
      } else {
        alert(result.message);
      }
      return;
    }

    // 自定义模型需要上传 ZIP 文件
    if (!zipFile) {
      alert('请选择模型 ZIP 文件（包含 .pth 和可选的 .index）');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      let modelUrl = '';
      let avatarUrl: string | undefined;

      // 1. 获取 ZIP 上传 URL
      setUploadStatus('正在准备上传...');
      setUploadProgress(5);
      const zipUrlResult = await getRvcModelZipUploadUrl({ slug: form.slug });
      if (!zipUrlResult.success || !zipUrlResult.uploadUrl) {
        throw new Error(zipUrlResult.message);
      }

      // 2. 上传 ZIP 文件
      setUploadStatus('正在上传模型 ZIP 文件...');
      const zipSuccess = await uploadFileToR2(
        zipFile,
        zipUrlResult.uploadUrl,
        (p) => setUploadProgress(5 + Math.round(p * 0.75)),
        'application/zip'
      );
      if (!zipSuccess) throw new Error('ZIP 文件上传失败');
      modelUrl = zipUrlResult.publicUrl!;

      // 3. 上传头像（可选）
      if (avatarFile) {
        setUploadStatus('正在上传头像...');
        const avatarUrlResult = await getRvcAvatarUploadUrl({ slug: form.slug });
        if (!avatarUrlResult.success || !avatarUrlResult.uploadUrl) {
          throw new Error(avatarUrlResult.message);
        }

        const avatarSuccess = await uploadFileToR2(
          avatarFile,
          avatarUrlResult.uploadUrl,
          (p) => setUploadProgress(80 + Math.round(p * 0.1)),
          'image/jpeg'
        );
        if (!avatarSuccess) throw new Error('头像上传失败');
        avatarUrl = avatarUrlResult.publicUrl!;
      }

      // 5. 保存到数据库
      setUploadStatus('正在保存模型信息...');
      setUploadProgress(95);

      const result = await createRvcVoiceModel({
        name: form.name,
        slug: form.slug,
        category: form.category,
        model_url: modelUrl,
        // index_url 不再需要，因为 .index 已打包到 ZIP 中
        avatar_url: avatarUrl,
        is_builtin: false,
        sort_order: form.sort_order,
      });

      if (result.success) {
        setUploadProgress(100);
        alert('创建成功');
        resetForm();
        setShowUploadModal(false);
        loadModels();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('创建模型失败:', error);
      alert(error instanceof Error ? error.message : '创建失败');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadStatus('');
    }
  };

  // 重置表单
  const resetForm = () => {
    setForm({
      name: '',
      slug: '',
      category: 'music',
      is_builtin: false,
      builtin_name: '',
      sort_order: 0,
    });
    setZipFile(null);
    setAvatarFile(null);
  };

  // 切换启用/禁用
  const handleToggleActive = async (id: number) => {
    const result = await toggleRvcVoiceModelActive(id);
    if (result.success) {
      loadModels();
    } else {
      alert(result.message);
    }
  };

  // 删除模型
  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`确定要删除模型 "${name}" 吗？此操作不可恢复。`)) return;

    const result = await deleteRvcVoiceModel(id);
    if (result.success) {
      loadModels();
    } else {
      alert(result.message);
    }
  };

  // 打开编辑模态框
  const handleOpenEdit = (model: RvcVoiceModel) => {
    setEditingModel(model);
    setEditForm({
      name: model.name,
      category: model.category,
      sort_order: model.sort_order,
    });
    setEditAvatarFile(null);
    setShowEditModal(true);
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editingModel) return;

    setEditUploading(true);
    setEditUploadProgress(0);

    try {
      let avatarUrl: string | undefined;

      // 如果有新头像，先上传
      if (editAvatarFile) {
        setEditUploadStatus('正在上传头像...');
        const avatarUrlResult = await getRvcAvatarUploadUrl({ slug: editingModel.slug });
        if (!avatarUrlResult.success || !avatarUrlResult.uploadUrl) {
          throw new Error(avatarUrlResult.message);
        }

        const avatarSuccess = await uploadFileToR2(
          editAvatarFile,
          avatarUrlResult.uploadUrl,
          (p) => setEditUploadProgress(Math.round(p * 0.8)),
          'image/jpeg'
        );
        if (!avatarSuccess) throw new Error('头像上传失败');
        avatarUrl = avatarUrlResult.publicUrl!;
      }

      // 更新数据库
      setEditUploadStatus('正在保存...');
      setEditUploadProgress(90);

      const result = await updateRvcVoiceModel(editingModel.id, {
        name: editForm.name,
        category: editForm.category,
        sort_order: editForm.sort_order,
        ...(avatarUrl && { avatar_url: avatarUrl }),
      });

      if (result.success) {
        setEditUploadProgress(100);
        alert('保存成功');
        setShowEditModal(false);
        setEditingModel(null);
        loadModels();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('保存失败:', error);
      alert(error instanceof Error ? error.message : '保存失败');
    } finally {
      setEditUploading(false);
      setEditUploadProgress(0);
      setEditUploadStatus('');
    }
  };

  // 创建内置模型
  const handleCreateBuiltinModels = async () => {
    if (!confirm('确定要创建所有内置模型 (Obama, Trump, Sandy, Rogan) 吗？')) return;

    const result = await createBuiltinModels();
    alert(result.message);
    if (result.success) {
      loadModels();
    }
  };

  return (
    <div>
      {/* 页面标题 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">RVC 声音模型管理</h1>
          <p className="text-gray-600 mt-1">管理 AI Cover 功能的声音模型</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCreateBuiltinModels}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            创建内置模型
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            添加新模型
          </button>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex gap-4">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">所有分类</option>
            {RVC_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 模型列表 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">模型</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">分类</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">类型</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">使用次数</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">状态</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">排序</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                      加载中...
                    </div>
                  </td>
                </tr>
              ) : models.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    暂无模型记录
                  </td>
                </tr>
              ) : (
                models.map((model) => (
                  <tr key={model.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {model.avatar_url ? (
                          <img
                            src={model.avatar_url}
                            alt={model.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                            {model.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{model.name}</div>
                          <div className="text-xs text-gray-500">{model.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700">
                        {RVC_CATEGORIES.find((c) => c.id === model.category)?.label || model.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {model.is_builtin ? (
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-700">
                          内置 ({model.builtin_name})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-700">
                          自定义
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatUsesCount(model.uses_count)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded ${
                          model.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {model.is_active ? '已启用' : '已禁用'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{model.sort_order}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(model)}
                          className="text-sm text-purple-600 hover:text-purple-700"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleToggleActive(model.id)}
                          className={`text-sm ${
                            model.is_active
                              ? 'text-gray-600 hover:text-gray-700'
                              : 'text-green-600 hover:text-green-700'
                          }`}
                        >
                          {model.is_active ? '禁用' : '启用'}
                        </button>
                        <button
                          onClick={() => handleDelete(model.id, model.name)}
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

      {/* 添加模型模态框 */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg m-4 max-h-[90vh] overflow-y-auto">
            {/* 模态框头部 */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-gray-900">添加新模型</h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              {/* 模型名称 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">模型名称 *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="如: Ariana Grande"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="如: ariana-grande"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">URL 友好的唯一标识，只能包含小写字母、数字和连字符</p>
              </div>

              {/* 分类 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">分类 *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {RVC_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 模型类型 */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_builtin}
                    onChange={(e) => setForm({ ...form, is_builtin: e.target.checked })}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">内置模型（使用 RVC-v2 预设声音）</span>
                </label>
              </div>

              {/* 内置模型选择 */}
              {form.is_builtin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    内置模型名称 *
                  </label>
                  <select
                    value={form.builtin_name}
                    onChange={(e) => setForm({ ...form, builtin_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">请选择</option>
                    {BUILTIN_MODEL_NAMES.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 自定义模型文件上传 */}
              {!form.is_builtin && (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                    <strong>提示：</strong>请上传包含 .pth 模型文件（必须）和 .index 索引文件（可选）的 ZIP 压缩包。
                  </div>

                  {/* ZIP 文件 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      模型 ZIP 文件 *
                    </label>
                    <input
                      type="file"
                      ref={zipInputRef}
                      accept=".zip"
                      onChange={(e) => setZipFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <div
                      onClick={() => zipInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-purple-500 transition-colors"
                    >
                      {zipFile ? (
                        <div className="text-sm text-gray-700">
                          <span className="font-medium">{zipFile.name}</span>
                          <span className="text-gray-500 ml-2">
                            ({(zipFile.size / (1024 * 1024)).toFixed(1)} MB)
                          </span>
                        </div>
                      ) : (
                        <div className="text-gray-500 text-sm">点击选择 ZIP 文件（包含 .pth 和 .index）</div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* 头像 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  头像图片 <span className="text-gray-400">可选</span>
                </label>
                <input
                  type="file"
                  ref={avatarInputRef}
                  accept="image/*"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <div
                  onClick={() => avatarInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-purple-500 transition-colors"
                >
                  {avatarFile ? (
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">{avatarFile.name}</span>
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm">点击选择头像图片</div>
                  )}
                </div>
              </div>

              {/* 排序 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">排序值</label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">数字越小排序越靠前</p>
              </div>
            </div>

            {/* 模态框底部 */}
            <div className="px-6 py-4 border-t border-gray-200 sticky bottom-0 bg-white">
              {/* 上传进度 */}
              {uploading && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>{uploadStatus}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    resetForm();
                  }}
                  disabled={uploading}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={handleCreate}
                  disabled={uploading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {uploading ? '上传中...' : '创建'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 编辑模型模态框 */}
      {showEditModal && editingModel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg m-4 max-h-[90vh] overflow-y-auto">
            {/* 模态框头部 */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-gray-900">编辑模型</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingModel(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              {/* 当前头像预览 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">当前头像</label>
                <div className="flex items-center gap-4">
                  {editAvatarFile ? (
                    <img
                      src={URL.createObjectURL(editAvatarFile)}
                      alt="新头像预览"
                      className="w-20 h-20 rounded-full object-cover border-2 border-purple-500"
                    />
                  ) : editingModel.avatar_url ? (
                    <img
                      src={editingModel.avatar_url}
                      alt={editingModel.name}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl">
                      {editingModel.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <input
                      type="file"
                      ref={editAvatarInputRef}
                      accept="image/*"
                      onChange={(e) => setEditAvatarFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <button
                      onClick={() => editAvatarInputRef.current?.click()}
                      className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                    >
                      上传新头像
                    </button>
                    {editAvatarFile && (
                      <button
                        onClick={() => setEditAvatarFile(null)}
                        className="ml-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                      >
                        取消
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 模型名称 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">模型名称</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Slug (只读) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={editingModel.slug}
                  disabled
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">Slug 不可修改</p>
              </div>

              {/* 分类 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {RVC_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 模型类型 (只读) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">模型类型</label>
                <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 text-sm">
                  {editingModel.is_builtin ? (
                    <span>内置模型 ({editingModel.builtin_name})</span>
                  ) : (
                    <span>自定义模型</span>
                  )}
                </div>
              </div>

              {/* 模型文件 URL (只读，仅自定义模型显示) */}
              {!editingModel.is_builtin && editingModel.model_url && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">模型文件 URL</label>
                  <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-xs text-gray-600 break-all">
                    <a
                      href={editingModel.model_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-700 hover:underline"
                    >
                      {editingModel.model_url}
                    </a>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">点击链接测试是否可以访问</p>
                </div>
              )}

              {/* Index 文件 URL (只读，仅自定义模型显示) */}
              {!editingModel.is_builtin && editingModel.index_url && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Index 文件 URL</label>
                  <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-xs text-gray-600 break-all">
                    <a
                      href={editingModel.index_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-700 hover:underline"
                    >
                      {editingModel.index_url}
                    </a>
                  </div>
                </div>
              )}

              {/* 排序 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">排序值</label>
                <input
                  type="number"
                  value={editForm.sort_order}
                  onChange={(e) => setEditForm({ ...editForm, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">数字越小排序越靠前</p>
              </div>
            </div>

            {/* 模态框底部 */}
            <div className="px-6 py-4 border-t border-gray-200 sticky bottom-0 bg-white">
              {/* 上传进度 */}
              {editUploading && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>{editUploadStatus}</span>
                    <span>{editUploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${editUploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingModel(null);
                  }}
                  disabled={editUploading}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={editUploading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {editUploading ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
