'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ClaimPrizeSheet, { type ClaimData, type ClaimStatus, type ShippingInfo } from '@/components/native/ClaimPrizeSheet';
import { getUserLuckyDrawHistory, submitPrizeClaim, type LuckyDrawHistoryRecord } from '@/actions/lucky-draw';

/** 状态标签配色 */
const statusStyle: Record<string, { bg: string; text: string; label: string }> = {
  selling: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'In Progress' },
  drawing: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Drawing...' },
  completed: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Completed' },
};

/** 领奖状态的显示文案 */
const claimStatusLabel: Record<ClaimStatus, string> = {
  unclaimed: 'Claim Prize',
  info_submitted: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
};

const claimStatusStyle: Record<ClaimStatus, string> = {
  unclaimed: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
  info_submitted: 'bg-amber-500/15 text-amber-400',
  shipped: 'bg-blue-500/15 text-blue-400',
  delivered: 'bg-emerald-500/15 text-emerald-400',
};

/** 奖品星星图标 */
function PrizeIcon() {
  return (
    <svg className="w-6 h-6 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

/** 奖杯图标（中奖用） */
function TrophyIcon() {
  return (
    <svg className="w-6 h-6 text-amber-300" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
    </svg>
  );
}

export default function LuckyDrawTab() {
  const [records, setRecords] = useState<LuckyDrawHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimDrawId, setClaimDrawId] = useState<string | null>(null);
  const [claimPrize, setClaimPrize] = useState<string>('');
  const [claimData, setClaimData] = useState<ClaimData | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const history = await getUserLuckyDrawHistory();
        setRecords(history);
      } catch (error) {
        console.error('Failed to fetch lucky draw history:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (records.length === 0) {
    return null; // 空状态由父组件处理
  }

  const handleClaimSubmit = async (info: ShippingInfo) => {
    if (!claimDrawId) return;

    try {
      await submitPrizeClaim(claimDrawId, {
        fullName: info.fullName,
        phone: info.phone,
        email: info.email,
        country: info.country,
        address: info.address,
        zipCode: info.zipCode,
        telegram: info.telegram,
      });

      // Update local state
      setRecords((prev) =>
        prev.map((r) =>
          r.drawId === claimDrawId && r.claim
            ? { ...r, claim: { ...r.claim, status: 'info_submitted', shippingInfo: info } }
            : r
        )
      );

      setClaimDrawId(null);
      setClaimData(null);
    } catch (error) {
      console.error('Failed to submit claim:', error);
    }
  };

  return (
    <>
      <div className="space-y-3 pt-2">
        {records.map((record) => {
          const isWinner = record.status === 'completed' && record.result?.won;
          const style = statusStyle[record.status] || statusStyle.selling;
          const claimStatus = record.claim?.status as ClaimStatus | undefined;

          return (
            <Link key={record.drawId} href={record.href} className="block">
              <div className={`relative overflow-hidden rounded-xl p-4 ${
                isWinner
                  ? 'bg-gradient-to-br from-[#1a0f00] via-[#1f1200] to-[#0f0a00] border border-amber-500/20'
                  : 'bg-gradient-to-br from-[#0d0025] via-[#150035] to-[#0a0020] border border-white/[0.06]'
              }`}>
                {/* 背景光效 */}
                {isWinner ? (
                  <>
                    <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-amber-500/15 blur-[70px]" />
                    <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-orange-500/10 blur-[60px]" />
                  </>
                ) : (
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-fuchsia-600/10 blur-[60px]" />
                )}

                {/* 顶部：奖品 + 状态 */}
                <div className="relative flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isWinner
                        ? 'bg-gradient-to-br from-amber-400/30 to-orange-500/30'
                        : 'bg-gradient-to-br from-amber-500/20 to-orange-500/20'
                    }`}>
                      {isWinner ? <TrophyIcon /> : <PrizeIcon />}
                    </div>
                    <div>
                      <h4 className={`font-semibold text-[15px] leading-tight ${
                        isWinner ? 'text-amber-200' : 'text-white'
                      }`}>{record.prize}</h4>
                      <p className={`text-xs mt-0.5 ${isWinner ? 'text-amber-400/50' : 'text-purple-300/60'}`}>{record.date}</p>
                    </div>
                  </div>
                  {isWinner ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                      YOU WON!
                    </span>
                  ) : (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${style.bg} ${style.text}`}>
                      {style.label}
                    </span>
                  )}
                </div>

                {/* 数据行 */}
                <div className="relative flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className={isWinner ? 'text-amber-400/40' : 'text-purple-300/50'}>Packs</span>
                    <span className={`font-semibold ${isWinner ? 'text-amber-200' : 'text-white'}`}>{record.packs}</span>
                  </div>
                  <div className={`w-px h-3 ${isWinner ? 'bg-amber-500/10' : 'bg-white/10'}`} />
                  <div className="flex items-center gap-1.5">
                    <span className={isWinner ? 'text-amber-400/40' : 'text-purple-300/50'}>Credits</span>
                    <span className={`font-semibold ${isWinner ? 'text-amber-200' : 'text-white'}`}>{record.totalCredits}</span>
                  </div>
                  <div className={`w-px h-3 ${isWinner ? 'bg-amber-500/10' : 'bg-white/10'}`} />
                  <div className="flex items-center gap-1.5">
                    <span className={isWinner ? 'text-amber-400/40' : 'text-purple-300/50'}>Slots</span>
                    <span className={`font-semibold ${isWinner ? 'text-amber-200' : 'text-white'}`}>{record.slots.length}</span>
                  </div>
                </div>

                {/* === 中奖结果行 === */}
                {isWinner && record.result && (
                  <div className="relative mt-3 pt-3 border-t border-amber-500/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-amber-300">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                        <span className="font-semibold">Slot #{record.result.winnerSlot}</span>
                      </div>
                      {/* Claim 按钮 — 阻止 Link 跳转，打开 sheet */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setClaimDrawId(record.drawId);
                          setClaimPrize(record.prize);
                          setClaimData(record.claim ? { status: record.claim.status as ClaimStatus, shippingInfo: record.claim.shippingInfo, tracking: record.claim.tracking } : { status: 'unclaimed' });
                        }}
                        className={`text-[11px] font-bold px-3 py-1 rounded-full ${
                          claimStatus ? claimStatusStyle[claimStatus] : claimStatusStyle.unclaimed
                        }`}
                      >
                        {claimStatus ? claimStatusLabel[claimStatus] : claimStatusLabel.unclaimed}
                      </button>
                    </div>
                  </div>
                )}

                {/* === 未中奖结果行 === */}
                {record.status === 'completed' && record.result && !record.result.won && (
                  <div className="relative mt-3 pt-3 border-t border-white/[0.06] flex items-center gap-2 text-xs text-gray-400">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M8 12h8" />
                    </svg>
                    <span>Draw complete &middot; Winner: Slot #{record.result.winnerSlot}</span>
                  </div>
                )}

                {/* 进行中的进度提示 */}
                {record.status === 'selling' && (
                  <div className="relative mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <span className="text-purple-300/50">Your slots: {record.slots.join(', ')}</span>
                    <span className="text-emerald-400 font-medium">View &rarr;</span>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Claim Prize Sheet */}
      {claimDrawId && claimData && (
        <ClaimPrizeSheet
          prize={claimPrize}
          claimData={claimData}
          onClose={() => { setClaimDrawId(null); setClaimData(null); }}
          onSubmit={handleClaimSubmit}
        />
      )}
    </>
  );
}
