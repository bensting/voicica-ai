'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getAdminLuckyDraws,
  createLuckyDraw,
  updateLuckyDraw,
  deleteLuckyDraw,
  toggleLuckyDrawEnabled,
  type AdminLuckyDraw,
  type CreateLuckyDrawInput,
} from '@/actions/admin/lucky-draws';
import { luckyDrawProducts } from '@/config/native/luckyDrawConfig';

/**
 * Admin 抽奖管理页面
 * 表格列表 + 模态框表单
 */

const emptyFormData: CreateLuckyDrawInput = {
  productId: luckyDrawProducts[0]?.productId ?? '',
  title: '',
  enabled: false,
};

const statusConfig: Record<string, { label: string; className: string }> = {
  selling: { label: 'Selling', className: 'bg-blue-100 text-blue-700' },
  drawing: { label: 'Drawing', className: 'bg-yellow-100 text-yellow-700' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-700' },
};

export default function LuckyDrawsPage() {
  const [draws, setDraws] = useState<AdminLuckyDraw[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDraw, setEditingDraw] = useState<AdminLuckyDraw | null>(null);
  const [formData, setFormData] = useState<CreateLuckyDrawInput>(emptyFormData);
  const [saving, setSaving] = useState(false);

  const loadDraws = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminLuckyDraws();
      setDraws(data);
    } catch (error) {
      console.error('加载抽奖列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDraws();
  }, [loadDraws]);

  const handleAdd = () => {
    setEditingDraw(null);
    setFormData(emptyFormData);
    setShowModal(true);
  };

  const handleEdit = (draw: AdminLuckyDraw) => {
    setEditingDraw(draw);
    setFormData({
      productId: draw.productId,
      title: draw.title ?? '',
      enabled: draw.enabled,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.productId) {
      alert('请选择产品');
      return;
    }

    setSaving(true);
    try {
      const result = editingDraw
        ? await updateLuckyDraw(editingDraw.id, formData)
        : await createLuckyDraw(formData);

      if (result.success) {
        setShowModal(false);
        loadDraws();
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

  const handleToggleEnabled = async (draw: AdminLuckyDraw) => {
    const result = await toggleLuckyDrawEnabled(draw.id);
    if (result.success) {
      setDraws((prev) =>
        prev.map((d) => (d.id === draw.id ? { ...d, enabled: !d.enabled } : d)),
      );
    } else {
      alert(result.message);
    }
  };

  const handleDelete = async (draw: AdminLuckyDraw) => {
    if (!confirm(`确定要删除抽奖 ${draw.drawId} 吗？`)) return;

    const result = await deleteLuckyDraw(draw.id);
    if (result.success) {
      loadDraws();
    } else {
      alert(result.message);
    }
  };

  const getProductPrize = (productId: string): string => {
    const product = luckyDrawProducts.find((p) => p.productId === productId);
    return product?.prize ?? productId;
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">抽奖管理</h1>
          <p className="text-gray-600 mt-1">管理 Lucky Draw 抽奖实例</p>
        </div>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          新建抽奖
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Draw ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">产品</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">标题</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">状态</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">进度</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">价格</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">启用</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">操作</th>
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
              ) : draws.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    暂无抽奖
                  </td>
                </tr>
              ) : (
                draws.map((draw) => {
                  const status = statusConfig[draw.status] ?? {
                    label: draw.status,
                    className: 'bg-gray-100 text-gray-600',
                  };
                  const progress =
                    draw.totalSlots > 0
                      ? Math.round((draw.soldSlots / draw.totalSlots) * 100)
                      : 0;

                  return (
                    <tr key={draw.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                          {draw.drawId}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {getProductPrize(draw.productId)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {draw.title || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-600 rounded-full transition-all"
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {draw.soldSlots}/{draw.totalSlots}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        ${(draw.stripePriceCents / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleEnabled(draw)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            draw.enabled ? 'bg-purple-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                              draw.enabled ? 'translate-x-[18px]' : 'translate-x-[3px]'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(draw)}
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDelete(draw)}
                            disabled={draw.soldSlots > 0}
                            className={`text-sm ${
                              draw.soldSlots > 0
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-red-600 hover:text-red-700'
                            }`}
                            title={draw.soldSlots > 0 ? '有购买记录，无法删除' : '删除'}
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingDraw ? '编辑抽奖' : '新建抽奖'}
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

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Product select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  产品 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  disabled={!!editingDraw}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                >
                  {luckyDrawProducts.map((p) => (
                    <option key={p.productId} value={p.productId}>
                      {p.prize} ({p.productId})
                    </option>
                  ))}
                </select>
                {/* 显示选中产品的配置参数 */}
                {(() => {
                  const p = luckyDrawProducts.find((x) => x.productId === formData.productId);
                  if (!p) return null;
                  return (
                    <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                      <span>Slots: {p.totalSlots}</span>
                      <span>积分/包: {p.creditsPerPurchase}</span>
                      <span>Stripe: ${(p.stripePriceCents / 100).toFixed(2)}</span>
                      <span>Crypto: ${(p.cryptoPriceCents / 100).toFixed(2)}</span>
                      <span>Chain: {p.chainName}</span>
                    </div>
                  );
                })()}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
                <input
                  type="text"
                  value={formData.title ?? ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="可选，如：第1期"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Enabled */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">启用此抽奖</span>
                </label>
              </div>
            </div>

            {/* Footer */}
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
