'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Native Banner 管理页面
 * 管理 Native App 首页 Banner
 */

// 支持的语言列表
const SUPPORTED_LOCALES = [
  { code: 'en-US', name: 'English' },
  { code: 'zh-CN', name: '简体中文' },
  { code: 'zh-TW', name: '繁體中文' },
  { code: 'ja-JP', name: '日本語' },
  { code: 'th-TH', name: 'ไทย' },
  { code: 'vi-VN', name: 'Tiếng Việt' },
  { code: 'id-ID', name: 'Bahasa Indonesia' },
  { code: 'my-MM', name: 'မြန်မာ' },
  { code: 'es-ES', name: 'Español' },
  { code: 'pt-BR', name: 'Português' },
  { code: 'hi-IN', name: 'हिन्दी' },
  { code: 'ar-SA', name: 'العربية' },
];

interface Banner {
  id: number;
  imageUrl: string;
  linkUrl: string | null;
  titles: Record<string, string>;
  subtitles: Record<string, string>;
  buttonTexts: Record<string, string> | null;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface BannerFormData {
  imageUrl: string;
  linkUrl: string;
  titles: Record<string, string>;
  subtitles: Record<string, string>;
  buttonTexts: Record<string, string>;
  sortOrder: number;
  isActive: boolean;
}

const emptyFormData: BannerFormData = {
  imageUrl: '',
  linkUrl: '',
  titles: {},
  subtitles: {},
  buttonTexts: {},
  sortOrder: 0,
  isActive: true,
};

export default function NativeBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState<BannerFormData>(emptyFormData);
  const [saving, setSaving] = useState(false);
  const [activeLocaleTab, setActiveLocaleTab] = useState('en-US');

  // 加载 Banner 列表
  const loadBanners = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/banners');
      const data = await response.json();
      if (data.success) {
        setBanners(data.banners);
      }
    } catch (error) {
      console.error('加载 Banner 列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBanners();
  }, [loadBanners]);

  // 打开新建模态框
  const handleAdd = () => {
    setEditingBanner(null);
    setFormData(emptyFormData);
    setActiveLocaleTab('en-US');
    setShowModal(true);
  };

  // 打开编辑模态框
  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl || '',
      titles: banner.titles || {},
      subtitles: banner.subtitles || {},
      buttonTexts: banner.buttonTexts || {},
      sortOrder: banner.sortOrder,
      isActive: banner.isActive,
    });
    setActiveLocaleTab('en-US');
    setShowModal(true);
  };

  // 保存 Banner
  const handleSave = async () => {
    if (!formData.imageUrl) {
      alert('请填写图片 URL');
      return;
    }

    // 至少需要一个语言的标题和副标题
    const hasTitle = Object.values(formData.titles).some((t) => t.trim());
    const hasSubtitle = Object.values(formData.subtitles).some((s) => s.trim());

    if (!hasTitle || !hasSubtitle) {
      alert('请至少填写一种语言的标题和副标题');
      return;
    }

    setSaving(true);
    try {
      const url = editingBanner
        ? `/api/admin/banners/${editingBanner.id}`
        : '/api/admin/banners';
      const method = editingBanner ? 'PUT' : 'POST';

      // 清理空值
      const cleanTitles = Object.fromEntries(
        Object.entries(formData.titles).filter(([, v]) => v.trim())
      );
      const cleanSubtitles = Object.fromEntries(
        Object.entries(formData.subtitles).filter(([, v]) => v.trim())
      );
      const cleanButtonTexts = Object.fromEntries(
        Object.entries(formData.buttonTexts).filter(([, v]) => v.trim())
      );

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: formData.imageUrl,
          linkUrl: formData.linkUrl || null,
          titles: cleanTitles,
          subtitles: cleanSubtitles,
          buttonTexts: Object.keys(cleanButtonTexts).length > 0 ? cleanButtonTexts : null,
          sortOrder: formData.sortOrder,
          isActive: formData.isActive,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShowModal(false);
        loadBanners();
      } else {
        alert(data.error || '保存失败');
      }
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 切换启用状态
  const handleToggleActive = async (banner: Banner) => {
    try {
      const response = await fetch(`/api/admin/banners/${banner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !banner.isActive }),
      });
      const data = await response.json();
      if (data.success) {
        setBanners((prev) =>
          prev.map((b) => (b.id === banner.id ? { ...b, isActive: !banner.isActive } : b))
        );
      }
    } catch (error) {
      console.error('更新失败:', error);
    }
  };

  // 删除 Banner
  const handleDelete = async (banner: Banner) => {
    if (!confirm('确定要删除此 Banner 吗？')) return;

    try {
      const response = await fetch(`/api/admin/banners/${banner.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        loadBanners();
      } else {
        alert(data.error || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  // 更新多语言字段
  const updateLocalizedField = (
    field: 'titles' | 'subtitles' | 'buttonTexts',
    locale: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        [locale]: value,
      },
    }));
  };

  // 获取显示文本（优先显示英文）
  const getDisplayText = (texts: Record<string, string> | null): string => {
    if (!texts) return '-';
    return texts['en-US'] || texts['zh-CN'] || Object.values(texts)[0] || '-';
  };

  return (
    <div>
      {/* 页面标题 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Native Banner 管理</h1>
          <p className="text-gray-600 mt-1">管理 Native App 首页 Banner（图片比例 3:1）</p>
        </div>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          添加 Banner
        </button>
      </div>

      {/* Banner 列表 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">预览</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">标题</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">副标题</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">排序</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">状态</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                      加载中...
                    </div>
                  </td>
                </tr>
              ) : banners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    暂无 Banner
                  </td>
                </tr>
              ) : (
                banners.map((banner) => (
                  <tr key={banner.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="w-36 aspect-[3/1] rounded overflow-hidden bg-gray-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={banner.imageUrl}
                          alt="Banner"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-[200px] truncate text-gray-900">
                        {getDisplayText(banner.titles)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {Object.keys(banner.titles || {}).length} 种语言
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-[200px] truncate text-gray-600">
                        {getDisplayText(banner.subtitles)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{banner.sortOrder}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${
                          banner.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {banner.isActive ? '已启用' : '已禁用'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(banner)}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleToggleActive(banner)}
                          className={`text-sm ${
                            banner.isActive
                              ? 'text-gray-600 hover:text-gray-700'
                              : 'text-green-600 hover:text-green-700'
                          }`}
                        >
                          {banner.isActive ? '禁用' : '启用'}
                        </button>
                        <button
                          onClick={() => handleDelete(banner)}
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

      {/* 编辑/新建模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
            {/* 模态框头部 */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingBanner ? '编辑 Banner' : '添加 Banner'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
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
            <div className="p-6 space-y-6">
              {/* 图片 URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  图片 URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/banner.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">推荐尺寸：1200x400 (3:1 比例)</p>
                {formData.imageUrl && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-gray-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formData.imageUrl}
                      alt="预览"
                      className="w-full aspect-[3/1] object-cover"
                    />
                  </div>
                )}
              </div>

              {/* 链接 URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">链接 URL</label>
                <input
                  type="url"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                  placeholder="https://example.com/page（可选）"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* 多语言输入区 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  多语言内容 <span className="text-red-500">*</span>
                </label>

                {/* 语言标签页 */}
                <div className="flex flex-wrap gap-1 mb-4 border-b border-gray-200">
                  {SUPPORTED_LOCALES.map((locale) => {
                    const hasContent =
                      formData.titles[locale.code]?.trim() ||
                      formData.subtitles[locale.code]?.trim();
                    return (
                      <button
                        key={locale.code}
                        onClick={() => setActiveLocaleTab(locale.code)}
                        className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                          activeLocaleTab === locale.code
                            ? 'border-purple-600 text-purple-600'
                            : hasContent
                              ? 'border-transparent text-gray-700 hover:text-purple-600'
                              : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {locale.name}
                        {hasContent && <span className="ml-1 text-green-500">*</span>}
                      </button>
                    );
                  })}
                </div>

                {/* 当前语言的输入框 */}
                <div className="space-y-4 bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-600 mb-2">
                    {SUPPORTED_LOCALES.find((l) => l.code === activeLocaleTab)?.name} (
                    {activeLocaleTab})
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">主标题</label>
                    <input
                      type="text"
                      value={formData.titles[activeLocaleTab] || ''}
                      onChange={(e) =>
                        updateLocalizedField('titles', activeLocaleTab, e.target.value)
                      }
                      placeholder="输入主标题..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">副标题</label>
                    <input
                      type="text"
                      value={formData.subtitles[activeLocaleTab] || ''}
                      onChange={(e) =>
                        updateLocalizedField('subtitles', activeLocaleTab, e.target.value)
                      }
                      placeholder="输入副标题..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">按钮文字（可选）</label>
                    <input
                      type="text"
                      value={formData.buttonTexts[activeLocaleTab] || ''}
                      onChange={(e) =>
                        updateLocalizedField('buttonTexts', activeLocaleTab, e.target.value)
                      }
                      placeholder="如：立即体验"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* 排序和状态 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">排序</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, sortOrder: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">数字越小越靠前</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">启用此 Banner</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 模态框底部 */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowModal(false)}
                disabled={saving}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
