'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getAdminLuckyDraws,
  getAdminLuckyDrawDetail,
  createLuckyDraw,
  updateLuckyDraw,
  deleteLuckyDraw,
  toggleLuckyDrawEnabled,
  updateClaimShipped,
  updateClaimDelivered,
  adminTriggerDraw,
  type AdminLuckyDraw,
  type AdminLuckyDrawDetail,
  type CreateLuckyDrawInput,
  type ShipClaimInput,
} from '@/actions/admin/lucky-draws';
import { luckyDrawProducts, getLuckyDrawProduct } from '@/config/native/luckyDrawConfig';

/**
 * Admin 抽奖管理页面
 * 表格列表 + 模态框表单
 */

const firstProduct = luckyDrawProducts[0];

const emptyFormData: CreateLuckyDrawInput = {
  productId: firstProduct?.productId ?? '',
  prizeType: firstProduct?.prizeType ?? 'product',
  title: '',
  enabled: false,
  status: 'selling',
  totalSlots: firstProduct?.totalSlots ?? 1500,
  creditsPerPurchase: firstProduct?.creditsPerPurchase ?? 100,
  stripePriceCents: firstProduct?.stripePriceCents ?? 100,
  cryptoPriceCents: firstProduct?.cryptoPriceCents ?? 100,
  chainName: firstProduct?.chainName ?? 'Polygon',
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
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailDraw, setDetailDraw] = useState<AdminLuckyDraw | null>(null);
  const [detailData, setDetailData] = useState<AdminLuckyDrawDetail | null>(null);
  const [shipForm, setShipForm] = useState<ShipClaimInput>({ carrier: '', trackingNumber: '', trackingUrl: '' });
  const [claimActionLoading, setClaimActionLoading] = useState(false);

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
      prizeType: draw.prizeType ?? getLuckyDrawProduct(draw.productId)?.prizeType ?? 'product',
      title: draw.title ?? '',
      enabled: draw.enabled,
      status: draw.status,
      totalSlots: draw.totalSlots,
      creditsPerPurchase: draw.creditsPerPurchase,
      stripePriceCents: draw.stripePriceCents,
      cryptoPriceCents: draw.cryptoPriceCents,
      chainName: draw.chainName ?? 'Polygon',
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

  const handleDetail = async (draw: AdminLuckyDraw) => {
    setDetailDraw(draw);
    setDetailData(null);
    setShipForm({ carrier: '', trackingNumber: '', trackingUrl: '' });
    setShowDetailModal(true);
    setDetailLoading(true);
    try {
      const data = await getAdminLuckyDrawDetail(draw.drawId);
      setDetailData(data);
      // Pre-fill carrier with wallet network for cash claims
      if (data.claim?.walletNetwork) {
        setShipForm((prev) => ({ ...prev, carrier: data.claim!.walletNetwork! }));
      }
    } catch (error) {
      console.error('加载详情失败:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleTriggerDraw = async (draw: AdminLuckyDraw) => {
    if (!confirm(`确定要手动开奖 ${draw.drawId} 吗？`)) return;
    try {
      const result = await adminTriggerDraw(draw.drawId);
      if (result.success) {
        alert(result.message);
        loadDraws();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('手动开奖失败:', error);
      alert('手动开奖失败');
    }
  };

  const refreshDetail = async (drawId: string) => {
    try {
      const data = await getAdminLuckyDrawDetail(drawId);
      setDetailData(data);
    } catch (error) {
      console.error('刷新详情失败:', error);
    }
  };

  const handleShipClaim = async () => {
    if (!detailDraw) return;
    if (!shipForm.carrier.trim() || !shipForm.trackingNumber.trim()) {
      const isCash = !!detailData?.claim?.walletAddress;
      alert(isCash ? '请填写转账网络和 Tx Hash' : '请填写快递公司和快递单号');
      return;
    }
    setClaimActionLoading(true);
    try {
      const result = await updateClaimShipped(detailDraw.drawId, shipForm);
      if (result.success) {
        setShipForm({ carrier: '', trackingNumber: '', trackingUrl: '' });
        await refreshDetail(detailDraw.drawId);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('标记发货失败:', error);
      alert('标记发货失败');
    } finally {
      setClaimActionLoading(false);
    }
  };

  const handleDeliverClaim = async () => {
    if (!detailDraw) return;
    if (!confirm('确定标记为已签收？')) return;
    setClaimActionLoading(true);
    try {
      const result = await updateClaimDelivered(detailDraw.drawId);
      if (result.success) {
        await refreshDetail(detailDraw.drawId);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('标记签收失败:', error);
      alert('标记签收失败');
    } finally {
      setClaimActionLoading(false);
    }
  };

  const maskUserId = (uid: string) => {
    if (uid.length <= 8) return uid;
    return uid.slice(0, 4) + '...' + uid.slice(-4);
  };

  const getExplorerBase = (chainName: string | null): string | null => {
    switch (chainName?.toLowerCase()) {
      case 'polygon': return 'https://polygonscan.com';
      case 'ethereum': return 'https://etherscan.io';
      case 'bsc': return 'https://bscscan.com';
      default: return null;
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
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">类型</th>
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
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                      加载中...
                    </div>
                  </td>
                </tr>
              ) : draws.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
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
                        {draw.prizeType === 'cash' ? '💰 Cash' : draw.prizeType === 'product' ? '📦 Product' : '-'}
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
                            onClick={() => handleDetail(draw)}
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            详情
                          </button>
                          {draw.status !== 'completed' && draw.soldSlots >= draw.totalSlots && (
                            <button
                              onClick={() => handleTriggerDraw(draw)}
                              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                            >
                              开奖
                            </button>
                          )}
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
                  onChange={(e) => {
                    const p = luckyDrawProducts.find((x) => x.productId === e.target.value);
                    setFormData({
                      ...formData,
                      productId: e.target.value,
                      ...(p && {
                        prizeType: p.prizeType,
                      }),
                      ...(p && !editingDraw && {
                        totalSlots: p.totalSlots,
                        creditsPerPurchase: p.creditsPerPurchase,
                        stripePriceCents: p.stripePriceCents,
                        cryptoPriceCents: p.cryptoPriceCents,
                        chainName: p.chainName,
                      }),
                    });
                  }}
                  disabled={!!editingDraw}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                >
                  {luckyDrawProducts.map((p) => (
                    <option key={p.productId} value={p.productId}>
                      {p.prize} ({p.productId})
                    </option>
                  ))}
                </select>
              </div>

              {/* Prize Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">奖品类型</label>
                <select
                  value={formData.prizeType ?? 'product'}
                  onChange={(e) => setFormData({ ...formData, prizeType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="product">📦 Product（实物奖品）</option>
                  <option value="cash">💰 Cash（现金/加密货币）</option>
                </select>
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

              {/* Status (only for editing) */}
              {editingDraw && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="selling">Selling</option>
                    <option value="drawing">Drawing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              )}

              {/* Numeric fields — 2-column grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    总 Slots <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.totalSlots}
                    onChange={(e) => setFormData({ ...formData, totalSlots: Number(e.target.value) })}
                    min={1}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    积分/包 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.creditsPerPurchase}
                    onChange={(e) => setFormData({ ...formData, creditsPerPurchase: Number(e.target.value) })}
                    min={1}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stripe 价格 (美分) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.stripePriceCents}
                    onChange={(e) => setFormData({ ...formData, stripePriceCents: Number(e.target.value) })}
                    min={1}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-400 mt-1">${(formData.stripePriceCents / 100).toFixed(2)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Crypto 价格 (美分) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.cryptoPriceCents}
                    onChange={(e) => setFormData({ ...formData, cryptoPriceCents: Number(e.target.value) })}
                    min={1}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-400 mt-1">${(formData.cryptoPriceCents / 100).toFixed(2)}</p>
                </div>
              </div>

              {/* Chain Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chain Name</label>
                <input
                  type="text"
                  value={formData.chainName}
                  onChange={(e) => setFormData({ ...formData, chainName: e.target.value })}
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

      {/* Detail Modal */}
      {showDetailModal && detailDraw && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl m-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">抽奖详情</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">
                    {detailDraw.drawId}
                  </code>
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {detailLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                  <span className="ml-2 text-gray-500">加载中...</span>
                </div>
              ) : detailData ? (
                <>
                  {/* Entries Table */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                      购买记录 ({detailData.entries.length})
                    </h3>
                    {detailData.entries.length === 0 ? (
                      <p className="text-sm text-gray-500 py-4 text-center">暂无购买记录</p>
                    ) : (
                      <div className="overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium text-gray-700">Slot#</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-700">User ID</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-700">Status</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-700">Packs</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-700">Credits</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-700">Payment</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-700">时间</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {detailData.entries.map((entry) => (
                              <tr key={entry.id} className="hover:bg-gray-50">
                                <td className="px-3 py-2 font-mono text-xs">{entry.slotNumber}</td>
                                <td className="px-3 py-2 font-mono text-xs" title={entry.userId}>
                                  {maskUserId(entry.userId)}
                                </td>
                                <td className="px-3 py-2">
                                  <span className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded ${
                                    entry.status === 'paid'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {entry.status}
                                  </span>
                                </td>
                                <td className="px-3 py-2">{entry.packs}</td>
                                <td className="px-3 py-2">{entry.creditsAwarded}</td>
                                <td className="px-3 py-2 text-xs">
                                  {entry.paymentPlatform}
                                  {entry.amountPaid != null && (
                                    <span className="text-gray-400 ml-1">
                                      (${(entry.amountPaid / 100).toFixed(2)})
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-xs text-gray-500">
                                  {new Date(entry.createdAt).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Draw Result */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">开奖结果</h3>
                    {detailData.result ? (
                      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-2 text-sm">
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                          <div>
                            <span className="text-gray-500">中奖 Slot：</span>
                            <span className="font-medium">{detailData.result.winnerSlot}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">中奖用户：</span>
                            <span className="font-mono text-xs" title={detailData.result.winnerUserId}>
                              {maskUserId(detailData.result.winnerUserId)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">总 Slots：</span>
                            <span className="font-medium">{detailData.result.totalSlots}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">开奖时间：</span>
                            <span>{new Date(detailData.result.createdAt).toLocaleString()}</span>
                          </div>
                          {(() => {
                            const explorer = detailDraw.blockExplorerUrl
                              ? detailDraw.blockExplorerUrl.replace(/\/$/, '')
                              : getExplorerBase(detailDraw.chainName);
                            return (
                              <>
                                {detailData.result.blockNumber != null && (
                                  <div>
                                    <span className="text-gray-500">Block#：</span>
                                    {explorer ? (
                                      <a
                                        href={`${explorer}/block/${detailData.result.blockNumber}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-mono text-xs text-blue-600 hover:text-blue-700 underline"
                                      >
                                        {detailData.result.blockNumber}
                                      </a>
                                    ) : (
                                      <span className="font-mono text-xs">{detailData.result.blockNumber}</span>
                                    )}
                                  </div>
                                )}
                                {detailData.result.blockHash && (
                                  <div className="col-span-2">
                                    <span className="text-gray-500">Block Hash：</span>
                                    <span className="font-mono text-xs break-all">{detailData.result.blockHash}</span>
                                  </div>
                                )}
                                {detailData.result.txHash && (
                                  <div className="col-span-2">
                                    <span className="text-gray-500">Tx Hash：</span>
                                    {explorer ? (
                                      <a
                                        href={`${explorer}/tx/${detailData.result.txHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-mono text-xs text-blue-600 hover:text-blue-700 underline break-all"
                                      >
                                        {detailData.result.txHash}
                                      </a>
                                    ) : (
                                      <span className="font-mono text-xs break-all">{detailData.result.txHash}</span>
                                    )}
                                  </div>
                                )}
                                {detailDraw.chainName && (
                                  <div>
                                    <span className="text-gray-500">Chain：</span>
                                    <span className="font-medium">{detailDraw.chainName}</span>
                                  </div>
                                )}
                                {detailDraw.contractAddress && (
                                  <div className="col-span-2">
                                    <span className="text-gray-500">合约地址：</span>
                                    {explorer ? (
                                      <a
                                        href={`${explorer}/address/${detailDraw.contractAddress}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-mono text-xs text-blue-600 hover:text-blue-700 underline break-all"
                                      >
                                        {detailDraw.contractAddress}
                                      </a>
                                    ) : (
                                      <span className="font-mono text-xs break-all">{detailDraw.contractAddress}</span>
                                    )}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>

                        {/* Claim info */}
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          {(() => {
                            const isCashClaim = !!detailData.claim?.walletAddress;
                            return (
                              <>
                          <h4 className="text-xs font-semibold text-gray-700 mb-2">
                            {isCashClaim ? '领奖信息（钱包）' : '领奖信息（收货）'}
                          </h4>

                          {!detailData.claim ? (
                            <p className="text-sm text-gray-500 py-2">等待用户提交信息</p>
                          ) : (
                            <div className="space-y-3">
                              {/* Status badge */}
                              <div className="text-sm">
                                <span className="text-gray-500">状态：</span>
                                <span className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded ${
                                  detailData.claim.status === 'delivered'
                                    ? 'bg-green-100 text-green-700'
                                    : detailData.claim.status === 'shipped'
                                      ? 'bg-blue-100 text-blue-700'
                                      : detailData.claim.status === 'info_submitted'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {detailData.claim.status === 'shipped' && isCashClaim ? 'transferred' : detailData.claim.status === 'delivered' && isCashClaim ? 'confirmed' : detailData.claim.status}
                                </span>
                              </div>

                              {/* Info (shown for info_submitted / shipped / delivered) */}
                              {detailData.claim.status !== 'unclaimed' && (
                                isCashClaim ? (
                                  /* 钱包信息 */
                                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                                    {detailData.claim.walletNetwork && (
                                      <div>
                                        <span className="text-gray-500">网络：</span>
                                        <span className="font-medium">{detailData.claim.walletNetwork}</span>
                                      </div>
                                    )}
                                    {detailData.claim.email && (
                                      <div>
                                        <span className="text-gray-500">邮箱：</span>
                                        <span>{detailData.claim.email}</span>
                                      </div>
                                    )}
                                    {detailData.claim.walletAddress && (
                                      <div className="col-span-2">
                                        <span className="text-gray-500">钱包地址：</span>
                                        <span className="font-mono text-xs break-all">{detailData.claim.walletAddress}</span>
                                      </div>
                                    )}
                                    {detailData.claim.telegram && (
                                      <div>
                                        <span className="text-gray-500">Telegram：</span>
                                        <span>{detailData.claim.telegram}</span>
                                      </div>
                                    )}
                                    <div>
                                      <span className="text-gray-500">提交时间：</span>
                                      <span>{new Date(detailData.claim.createdAt).toLocaleString()}</span>
                                    </div>
                                  </div>
                                ) : (
                                  /* 收货信息 */
                                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                                    {detailData.claim.fullName && (
                                      <div>
                                        <span className="text-gray-500">姓名：</span>
                                        <span>{detailData.claim.fullName}</span>
                                      </div>
                                    )}
                                    {detailData.claim.email && (
                                      <div>
                                        <span className="text-gray-500">邮箱：</span>
                                        <span>{detailData.claim.email}</span>
                                      </div>
                                    )}
                                    {detailData.claim.phone && (
                                      <div>
                                        <span className="text-gray-500">电话：</span>
                                        <span>{detailData.claim.phone}</span>
                                      </div>
                                    )}
                                    {detailData.claim.telegram && (
                                      <div>
                                        <span className="text-gray-500">Telegram：</span>
                                        <span>{detailData.claim.telegram}</span>
                                      </div>
                                    )}
                                    {detailData.claim.country && (
                                      <div>
                                        <span className="text-gray-500">国家：</span>
                                        <span>{detailData.claim.country}</span>
                                      </div>
                                    )}
                                    {detailData.claim.zipCode && (
                                      <div>
                                        <span className="text-gray-500">邮编：</span>
                                        <span>{detailData.claim.zipCode}</span>
                                      </div>
                                    )}
                                    {detailData.claim.address && (
                                      <div className="col-span-2">
                                        <span className="text-gray-500">地址：</span>
                                        <span>{detailData.claim.address}</span>
                                      </div>
                                    )}
                                    <div>
                                      <span className="text-gray-500">提交时间：</span>
                                      <span>{new Date(detailData.claim.createdAt).toLocaleString()}</span>
                                    </div>
                                  </div>
                                )
                              )}

                              {/* Tracking / Transfer info (shown for shipped / delivered) */}
                              {(detailData.claim.status === 'shipped' || detailData.claim.status === 'delivered') && (
                                <div className={`grid grid-cols-2 gap-x-6 gap-y-1 text-sm rounded-lg p-3 ${isCashClaim ? 'bg-emerald-50' : 'bg-blue-50'}`}>
                                  {detailData.claim.carrier && (
                                    <div>
                                      <span className="text-gray-500">{isCashClaim ? '转账网络：' : '快递公司：'}</span>
                                      <span>{detailData.claim.carrier}</span>
                                    </div>
                                  )}
                                  {detailData.claim.trackingNumber && (
                                    <div className={isCashClaim ? 'col-span-2' : ''}>
                                      <span className="text-gray-500">{isCashClaim ? 'Tx Hash：' : '快递单号：'}</span>
                                      <span className="font-mono text-xs break-all">{detailData.claim.trackingNumber}</span>
                                    </div>
                                  )}
                                  {detailData.claim.trackingUrl && (
                                    <div className="col-span-2">
                                      <span className="text-gray-500">{isCashClaim ? '区块链浏览器：' : '物流链接：'}</span>
                                      <a
                                        href={detailData.claim.trackingUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-700 underline text-xs break-all"
                                      >
                                        {detailData.claim.trackingUrl}
                                      </a>
                                    </div>
                                  )}
                                  {detailData.claim.shippedAt && (
                                    <div>
                                      <span className="text-gray-500">{isCashClaim ? '转账时间：' : '发货时间：'}</span>
                                      <span>{new Date(detailData.claim.shippedAt).toLocaleString()}</span>
                                    </div>
                                  )}
                                  {detailData.claim.deliveredAt && (
                                    <div>
                                      <span className="text-gray-500">{isCashClaim ? '确认时间：' : '签收时间：'}</span>
                                      <span>{new Date(detailData.claim.deliveredAt).toLocaleString()}</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Action: Ship/Transfer form (info_submitted) */}
                              {detailData.claim.status === 'info_submitted' && (
                                <div className={`border rounded-lg p-3 space-y-3 ${isCashClaim ? 'border-emerald-200 bg-emerald-50' : 'border-orange-200 bg-orange-50'}`}>
                                  <h5 className={`text-xs font-semibold ${isCashClaim ? 'text-emerald-700' : 'text-orange-700'}`}>
                                    {isCashClaim ? '转账操作' : '发货操作'}
                                  </h5>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-xs text-gray-600 mb-1">
                                        {isCashClaim ? '转账网络 *' : '快递公司 *'}
                                      </label>
                                      <input
                                        type="text"
                                        value={shipForm.carrier}
                                        onChange={(e) => { const v = e.target.value; setShipForm((p) => ({ ...p, carrier: v })); }}
                                        placeholder={isCashClaim ? (detailData.claim.walletNetwork ?? 'TRC-20') : '如：FedEx、DHL'}
                                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs text-gray-600 mb-1">
                                        {isCashClaim ? 'Tx Hash *' : '快递单号 *'}
                                      </label>
                                      <input
                                        type="text"
                                        value={shipForm.trackingNumber}
                                        onChange={(e) => { const v = e.target.value; setShipForm((p) => ({ ...p, trackingNumber: v })); }}
                                        placeholder={isCashClaim ? '0x...' : '快递单号'}
                                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">
                                      {isCashClaim ? '区块链浏览器链接（可选）' : '物流链接（可选）'}
                                    </label>
                                    <input
                                      type="text"
                                      value={shipForm.trackingUrl}
                                      onChange={(e) => { const v = e.target.value; setShipForm((p) => ({ ...p, trackingUrl: v })); }}
                                      placeholder="https://..."
                                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                  </div>
                                  <button
                                    onClick={handleShipClaim}
                                    disabled={claimActionLoading}
                                    className={`px-4 py-1.5 text-sm text-white rounded-lg transition-colors disabled:opacity-50 ${
                                      isCashClaim ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-orange-600 hover:bg-orange-700'
                                    }`}
                                  >
                                    {claimActionLoading ? '处理中...' : isCashClaim ? '标记已转账' : '标记发货'}
                                  </button>
                                </div>
                              )}

                              {/* Action: Deliver/Confirm button (shipped) */}
                              {detailData.claim.status === 'shipped' && (
                                <button
                                  onClick={handleDeliverClaim}
                                  disabled={claimActionLoading}
                                  className="px-4 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                >
                                  {claimActionLoading ? '处理中...' : isCashClaim ? '标记已确认' : '标记签收'}
                                </button>
                              )}
                            </div>
                          )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 py-4 text-center bg-gray-50 rounded-lg border border-gray-200">
                        尚未开奖
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-red-500 py-4 text-center">加载失败</p>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end sticky bottom-0 bg-white">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
