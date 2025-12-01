'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  getAdminVoiceList,
  getAdminVoiceLocales,
  updateVoiceStatus,
  batchUpdateVoiceStatus,
  getAdminVoiceById,
  updateVoice,
} from '@/actions/admin/voices';

interface Voice {
  id: number;
  name: string;
  display_name: string;
  locale: string;
  country: string;
  gender: string;
  role: string;
  is_active: boolean;
  avatar_url: string;
  style_list: string[];
  voice_sample_url: Record<string, string>;
  created_at: Date | null;
}

interface EditingVoice {
  id: number;
  name: string;
  display_name: string;
  locale: string;
  country: string;
  gender: string;
  role: string;
  is_active: boolean;
  avatar_url: string;
  style_list: string[];
  tags: string[];
  sort_order: number;
}

/**
 * 语音管理页面
 */
export default function VoicesManagementPage() {
  // 状态
  const [voices, setVoices] = useState<Voice[]>([]);
  const [locales, setLocales] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 筛选条件
  const [localeFilter, setLocaleFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [styleCountFilter, setStyleCountFilter] = useState('');

  // 批量选择
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // 编辑模态框
  const [editingVoice, setEditingVoice] = useState<EditingVoice | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 解析风格数量筛选
  const getStyleCountParams = () => {
    if (!styleCountFilter) return {};
    switch (styleCountFilter) {
      case '1': return { styleCountMin: 1, styleCountMax: 1 };
      case '2-5': return { styleCountMin: 2, styleCountMax: 5 };
      case '6-10': return { styleCountMin: 6, styleCountMax: 10 };
      case '10+': return { styleCountMin: 11 };
      default: return {};
    }
  };

  // 加载语音列表
  const loadVoices = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAdminVoiceList({
        page,
        pageSize: 20,
        locale: localeFilter || undefined,
        gender: genderFilter || undefined,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
        search: searchQuery || undefined,
        ...getStyleCountParams(),
      });
      setVoices(result.voices);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('加载语音列表失败:', error);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, localeFilter, genderFilter, statusFilter, searchQuery, styleCountFilter]);

  // 加载 locale 列表
  const loadLocales = useCallback(async () => {
    try {
      const result = await getAdminVoiceLocales();
      setLocales(result);
    } catch (error) {
      console.error('加载 locale 列表失败:', error);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    loadLocales();
  }, [loadLocales]);

  // 筛选变化时重新加载
  useEffect(() => {
    loadVoices();
  }, [loadVoices]);

  // 切换语音状态
  const handleToggleStatus = async (voiceId: number, currentStatus: boolean) => {
    const result = await updateVoiceStatus(voiceId, !currentStatus);
    if (result.success) {
      setVoices((prev) =>
        prev.map((v) => (v.id === voiceId ? { ...v, is_active: !currentStatus } : v))
      );
    }
  };

  // 批量操作
  const handleBatchAction = async (action: 'enable' | 'disable') => {
    if (selectedIds.length === 0) return;

    const result = await batchUpdateVoiceStatus(selectedIds, action === 'enable');
    if (result.success) {
      loadVoices();
      setSelectedIds([]);
    }
  };

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectedIds.length === voices.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(voices.map((v) => v.id));
    }
  };

  // 单选
  const handleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // 重置筛选
  const handleResetFilters = () => {
    setLocaleFilter('');
    setGenderFilter('');
    setStatusFilter('all');
    setSearchQuery('');
    setStyleCountFilter('');
    setPage(1);
  };

  // 打开编辑模态框
  const handleEdit = async (voiceId: number) => {
    setEditLoading(true);
    try {
      const voice = await getAdminVoiceById(voiceId);
      if (voice) {
        setEditingVoice(voice);
      }
    } catch (error) {
      console.error('加载语音详情失败:', error);
    } finally {
      setEditLoading(false);
    }
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editingVoice) return;

    setSaving(true);
    try {
      const result = await updateVoice(editingVoice.id, {
        display_name: editingVoice.display_name,
        role: editingVoice.role,
        is_active: editingVoice.is_active,
        style_list: editingVoice.style_list,
        tags: editingVoice.tags,
        sort_order: editingVoice.sort_order,
      });

      if (result.success) {
        setEditingVoice(null);
        loadVoices();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 更新编辑中的语音字段
  const updateEditingField = <K extends keyof EditingVoice>(
    field: K,
    value: EditingVoice[K]
  ) => {
    if (!editingVoice) return;
    setEditingVoice({ ...editingVoice, [field]: value });
  };

  // 添加 style
  const handleAddStyle = () => {
    if (!editingVoice) return;
    const newStyle = prompt('输入新风格名称:');
    if (newStyle && !editingVoice.style_list.includes(newStyle)) {
      updateEditingField('style_list', [...editingVoice.style_list, newStyle]);
    }
  };

  // 删除 style
  const handleRemoveStyle = (style: string) => {
    if (!editingVoice) return;
    if (style === 'default') {
      alert('不能删除 default 风格');
      return;
    }
    updateEditingField(
      'style_list',
      editingVoice.style_list.filter((s) => s !== style)
    );
  };

  return (
    <div>
      {/* 页面标题 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">语音管理</h1>
          <p className="text-gray-600 mt-1">管理所有语音，启用或禁用语音</p>
        </div>
        <Link
          href="/admin/voices/sync"
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Azure 同步
        </Link>
      </div>

      {/* 筛选栏 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          {/* 搜索 */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="搜索语音名称..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Locale 筛选 */}
          <select
            value={localeFilter}
            onChange={(e) => {
              setLocaleFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">所有语言</option>
            {locales.map((locale) => (
              <option key={locale} value={locale}>
                {locale}
              </option>
            ))}
          </select>

          {/* 性别筛选 */}
          <select
            value={genderFilter}
            onChange={(e) => {
              setGenderFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">所有性别</option>
            <option value="male">男声</option>
            <option value="female">女声</option>
          </select>

          {/* 状态筛选 */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as 'all' | 'active' | 'inactive');
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">所有状态</option>
            <option value="active">已启用</option>
            <option value="inactive">已禁用</option>
          </select>

          {/* 风格数量筛选 */}
          <select
            value={styleCountFilter}
            onChange={(e) => {
              setStyleCountFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">所有风格数量</option>
            <option value="1">1 个风格</option>
            <option value="2-5">2-5 个风格</option>
            <option value="6-10">6-10 个风格</option>
            <option value="10+">10+ 个风格</option>
          </select>

          {/* 重置 */}
          <button
            onClick={handleResetFilters}
            className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            重置
          </button>
        </div>

        {/* 批量操作 */}
        {selectedIds.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-4">
            <span className="text-sm text-gray-600">
              已选择 {selectedIds.length} 个语音
            </span>
            <button
              onClick={() => handleBatchAction('enable')}
              className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
            >
              批量启用
            </button>
            <button
              onClick={() => handleBatchAction('disable')}
              className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              批量禁用
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
            >
              取消选择
            </button>
          </div>
        )}
      </div>

      {/* 统计信息 */}
      <div className="mb-4 text-sm text-gray-600">共 {total} 个语音</div>

      {/* 语音列表 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === voices.length && voices.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  语音
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  语言
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  性别
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  风格列表
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  语音样本
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  状态
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
              ) : voices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    没有找到语音
                  </td>
                </tr>
              ) : (
                voices.map((voice) => (
                  <tr key={voice.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(voice.id)}
                        onChange={() => handleSelect(voice.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {voice.avatar_url ? (
                          <Image
                            src={voice.avatar_url}
                            alt={voice.display_name}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-gray-400 text-xs">
                              {voice.gender === 'male' ? '♂' : '♀'}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">
                            {voice.display_name}
                          </div>
                          <div className="text-xs text-gray-500">{voice.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700">{voice.locale}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${
                          voice.gender === 'male'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-pink-100 text-pink-700'
                        }`}
                      >
                        {voice.gender === 'male' ? '男' : '女'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {voice.style_list.slice(0, 2).map((style) => (
                          <span
                            key={style}
                            className="inline-flex items-center px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                          >
                            {style}
                          </span>
                        ))}
                        {voice.style_list.length > 2 && (
                          <span className="text-xs text-gray-400">
                            +{voice.style_list.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const sampleCount = Object.keys(voice.voice_sample_url).length;
                        const styleCount = voice.style_list.length;
                        if (sampleCount === 0) {
                          return (
                            <span className="text-xs text-gray-400">无样本</span>
                          );
                        }
                        const isComplete = sampleCount >= styleCount;
                        return (
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {Object.entries(voice.voice_sample_url).slice(0, 2).map(([style, url]) => (
                              <a
                                key={style}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-teal-100 text-teal-700 rounded hover:bg-teal-200 transition-colors"
                                title={`播放 ${style} 样本`}
                              >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                </svg>
                                {style}
                              </a>
                            ))}
                            {sampleCount > 2 && (
                              <span className="text-xs text-gray-400">+{sampleCount - 2}</span>
                            )}
                            <span className={`text-xs ${isComplete ? 'text-green-600' : 'text-orange-500'}`}>
                              ({sampleCount}/{styleCount})
                            </span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${
                          voice.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {voice.is_active ? '已启用' : '已禁用'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(voice.id)}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleToggleStatus(voice.id, voice.is_active)}
                          className={`text-sm ${
                            voice.is_active
                              ? 'text-red-600 hover:text-red-700'
                              : 'text-green-600 hover:text-green-700'
                          }`}
                        >
                          {voice.is_active ? '禁用' : '启用'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              第 {page} / {totalPages} 页
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 编辑模态框 */}
      {(editingVoice || editLoading) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            {editLoading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                加载中...
              </div>
            ) : editingVoice ? (
              <>
                {/* 模态框头部 */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">编辑语音</h2>
                  <button
                    onClick={() => setEditingVoice(null)}
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
                <div className="p-6 space-y-6">
                  {/* 基本信息（只读） */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    {editingVoice.avatar_url ? (
                      <Image
                        src={editingVoice.avatar_url}
                        alt={editingVoice.display_name}
                        width={64}
                        height={64}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-400">
                          {editingVoice.gender === 'male' ? '♂' : '♀'}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-900">{editingVoice.name}</div>
                      <div className="text-sm text-gray-500">
                        {editingVoice.locale} · {editingVoice.gender === 'male' ? '男' : '女'}
                      </div>
                    </div>
                  </div>

                  {/* 显示名称 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      显示名称
                    </label>
                    <input
                      type="text"
                      value={editingVoice.display_name}
                      onChange={(e) => updateEditingField('display_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* 角色类型 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      角色类型
                    </label>
                    <input
                      type="text"
                      value={editingVoice.role}
                      onChange={(e) => updateEditingField('role', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* 排序 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      排序（数字越小越靠前）
                    </label>
                    <input
                      type="number"
                      value={editingVoice.sort_order}
                      onChange={(e) =>
                        updateEditingField('sort_order', parseInt(e.target.value) || 0)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* 状态 */}
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingVoice.is_active}
                        onChange={(e) => updateEditingField('is_active', e.target.checked)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">启用此语音</span>
                    </label>
                  </div>

                  {/* 风格列表 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      风格列表
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {editingVoice.style_list.map((style) => (
                        <span
                          key={style}
                          className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg"
                        >
                          {style}
                          {style !== 'default' && (
                            <button
                              onClick={() => handleRemoveStyle(style)}
                              className="text-purple-500 hover:text-purple-700"
                            >
                              <svg
                                className="w-4 h-4"
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
                          )}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={handleAddStyle}
                      className="text-sm text-purple-600 hover:text-purple-700"
                    >
                      + 添加风格
                    </button>
                  </div>

                  {/* 标签 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      标签（逗号分隔）
                    </label>
                    <input
                      type="text"
                      value={editingVoice.tags.join(', ')}
                      onChange={(e) =>
                        updateEditingField(
                          'tags',
                          e.target.value
                            .split(',')
                            .map((t) => t.trim())
                            .filter(Boolean)
                        )
                      }
                      placeholder="如: news, emotional, podcast"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* 模态框底部 */}
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                  <button
                    onClick={() => setEditingVoice(null)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? '保存中...' : '保存'}
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}