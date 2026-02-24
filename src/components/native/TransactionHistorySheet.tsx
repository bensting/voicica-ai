/**
 * Transaction History Sheet
 * 全页底部 Sheet — Convert / Withdraw 两个 tab 切换查看交易历史
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  getConversionHistory,
  getWithdrawalHistory,
  type ConversionItem,
  type WithdrawalItem,
} from '@/actions/transactionHistory';

interface TransactionHistorySheetProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'convert' | 'withdraw';

export default function TransactionHistorySheet({ isOpen, onClose }: TransactionHistorySheetProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('convert');

  // Convert state
  const [convertItems, setConvertItems] = useState<ConversionItem[]>([]);
  const [convertPage, setConvertPage] = useState(1);
  const [convertHasMore, setConvertHasMore] = useState(false);
  const [convertLoading, setConvertLoading] = useState(false);
  const [convertLoaded, setConvertLoaded] = useState(false);

  // Withdraw state
  const [withdrawItems, setWithdrawItems] = useState<WithdrawalItem[]>([]);
  const [withdrawPage, setWithdrawPage] = useState(1);
  const [withdrawHasMore, setWithdrawHasMore] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawLoaded, setWithdrawLoaded] = useState(false);

  const loadConversions = useCallback(async (page: number, append = false) => {
    setConvertLoading(true);
    try {
      const res = await getConversionHistory(page, 20);
      setConvertItems(prev => append ? [...prev, ...res.items] : res.items);
      setConvertPage(res.page);
      setConvertHasMore(res.hasMore);
      setConvertLoaded(true);
    } catch {
      // silently fail
    } finally {
      setConvertLoading(false);
    }
  }, []);

  const loadWithdrawals = useCallback(async (page: number, append = false) => {
    setWithdrawLoading(true);
    try {
      const res = await getWithdrawalHistory(page, 20);
      setWithdrawItems(prev => append ? [...prev, ...res.items] : res.items);
      setWithdrawPage(res.page);
      setWithdrawHasMore(res.hasMore);
      setWithdrawLoaded(true);
    } catch {
      // silently fail
    } finally {
      setWithdrawLoading(false);
    }
  }, []);

  // Load data when sheet opens
  useEffect(() => {
    if (isOpen) {
      setConvertLoaded(false);
      setWithdrawLoaded(false);
      setConvertItems([]);
      setWithdrawItems([]);
      setConvertPage(1);
      setWithdrawPage(1);
      setActiveTab('convert');
      loadConversions(1);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, loadConversions]);

  // Load withdraw data when switching to withdraw tab for the first time
  useEffect(() => {
    if (isOpen && activeTab === 'withdraw' && !withdrawLoaded) {
      loadWithdrawals(1);
    }
  }, [isOpen, activeTab, withdrawLoaded, loadWithdrawals]);

  // Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const truncateAddress = (addr: string) => {
    if (addr.length <= 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/15 text-emerald-400';
      case 'rejected': return 'bg-red-500/15 text-red-400';
      default: return 'bg-amber-500/15 text-amber-400'; // pending
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'completed': return t('native.history.status.completed');
      case 'rejected': return t('native.history.status.rejected');
      default: return t('native.history.status.pending');
    }
  };

  const sheetContent = (
    <div
      className="fixed inset-0 z-[10000] flex items-end justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]" />

      {/* Sheet */}
      <div
        className="relative w-full max-w-lg bg-gradient-to-b from-[#2a2a4a] to-[#1a1a3a] rounded-t-3xl shadow-2xl animate-[slideUp_0.3s_ease-out] h-[70vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Title */}
        <div className="px-5 pb-3 flex-shrink-0 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">
            {t('native.history.title')}
          </h3>
          <button onClick={onClose} className="text-gray-400 p-1">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab bar */}
        <div className="px-5 flex-shrink-0">
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab('convert')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors relative ${
                activeTab === 'convert' ? 'text-purple-400' : 'text-gray-400'
              }`}
            >
              {t('native.history.convertTab')}
              {activeTab === 'convert' && (
                <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-purple-400 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('withdraw')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors relative ${
                activeTab === 'withdraw' ? 'text-purple-400' : 'text-gray-400'
              }`}
            >
              {t('native.history.withdrawTab')}
              {activeTab === 'withdraw' && (
                <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-purple-400 rounded-full" />
              )}
            </button>
          </div>
        </div>

        {/* List area */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-3">
          {activeTab === 'convert' ? (
            /* Convert list */
            convertLoading && !convertLoaded ? (
              <div className="py-12 text-center text-gray-500 text-sm">
                {t('native.common.loading')}
              </div>
            ) : convertItems.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-sm">
                {t('native.history.noRecords')}
              </div>
            ) : (
              <div className="space-y-3">
                {convertItems.map((item) => (
                  <div key={item.id} className="rounded-xl bg-white/5 border border-white/10 p-3.5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-500 text-xs">{formatDate(item.createdAt)}</span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 text-[10px] font-medium">
                        {t('native.history.converted')}
                      </span>
                    </div>
                    <div className="text-white text-sm font-medium">
                      -{Number(item.voicicaAmount).toLocaleString()} $VOICICA
                      <span className="text-gray-500 mx-1.5">&rarr;</span>
                      <span className="text-emerald-400">+{Number(item.usdtAmount).toFixed(4)} USDT</span>
                    </div>
                    <div className="text-gray-500 text-xs mt-1">
                      {t('native.history.rate')}: 1 $VOICICA = ${Number(item.rate).toFixed(6)} USDT
                    </div>
                  </div>
                ))}

                {/* Load more / all loaded */}
                {convertHasMore ? (
                  <button
                    onClick={() => loadConversions(convertPage + 1, true)}
                    disabled={convertLoading}
                    className="w-full py-2.5 text-center text-purple-400 text-sm font-medium"
                  >
                    {convertLoading ? t('native.common.loading') : t('native.history.loadMore')}
                  </button>
                ) : convertItems.length > 0 ? (
                  <p className="text-center text-gray-600 text-xs py-2">{t('native.history.allLoaded')}</p>
                ) : null}
              </div>
            )
          ) : (
            /* Withdraw list */
            withdrawLoading && !withdrawLoaded ? (
              <div className="py-12 text-center text-gray-500 text-sm">
                {t('native.common.loading')}
              </div>
            ) : withdrawItems.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-sm">
                {t('native.history.noRecords')}
              </div>
            ) : (
              <div className="space-y-3">
                {withdrawItems.map((item) => (
                  <div key={item.id} className="rounded-xl bg-white/5 border border-white/10 p-3.5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-500 text-xs">{formatDate(item.createdAt)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColor(item.status)}`}>
                        {statusLabel(item.status)}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">{t('native.history.amount')}</span>
                        <span className="text-white font-medium">{Number(item.amount).toFixed(4)} USDT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">{t('native.history.fee')}</span>
                        <span className="text-amber-400">-{Number(item.fee).toFixed(4)} USDT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">{t('native.history.netAmount')}</span>
                        <span className="text-emerald-400 font-medium">{Number(item.netAmount).toFixed(4)} USDT</span>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                      <span className="text-gray-500">
                        {t('native.history.network')}: <span className="text-gray-400">{item.network}</span>
                      </span>
                      <span className="text-gray-500">
                        {t('native.history.wallet')}: <span className="text-gray-400 font-mono">{truncateAddress(item.walletAddress)}</span>
                      </span>
                    </div>
                  </div>
                ))}

                {/* Load more / all loaded */}
                {withdrawHasMore ? (
                  <button
                    onClick={() => loadWithdrawals(withdrawPage + 1, true)}
                    disabled={withdrawLoading}
                    className="w-full py-2.5 text-center text-purple-400 text-sm font-medium"
                  >
                    {withdrawLoading ? t('native.common.loading') : t('native.history.loadMore')}
                  </button>
                ) : withdrawItems.length > 0 ? (
                  <p className="text-center text-gray-600 text-xs py-2">{t('native.history.allLoaded')}</p>
                ) : null}
              </div>
            )
          )}
        </div>

        {/* Bottom safe area */}
        <div className="flex-shrink-0 h-2" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }} />
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(sheetContent, document.body) : null;
}
