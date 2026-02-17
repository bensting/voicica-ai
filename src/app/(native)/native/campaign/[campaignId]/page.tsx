'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useNativeBack } from '@/hooks/useNativeBack';
import { activeCampaign } from '@/config/native/campaignConfig';
import GradientButton from '@/components/native/common/GradientButton';

/* ─── Mock data ─── */
const MOCK_SOLD = 1847;
const MOCK_MY_ENTRIES = 3; // 0 = 未购买, >0 = 已购买 (mock)

const MOCK_RECENT_ENTRIES = [
  { id: 1, name: 'Adi**', qty: 5, timeAgo: '2min ago' },
  { id: 2, name: 'San**', qty: 1, timeAgo: '3min ago' },
  { id: 3, name: 'Pri**', qty: 10, timeAgo: '5min ago' },
  { id: 4, name: 'Riz**', qty: 2, timeAgo: '8min ago' },
  { id: 5, name: 'Mar**', qty: 20, timeAgo: '12min ago' },
  { id: 6, name: 'Ahm**', qty: 1, timeAgo: '15min ago' },
  { id: 7, name: 'Yuk**', qty: 3, timeAgo: '18min ago' },
  { id: 8, name: 'Car**', qty: 50, timeAgo: '22min ago' },
];

const REMAINING_SLOTS = activeCampaign.totalSlots - MOCK_SOLD;

/* ─── Icons ─── */
const CloseIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const CreditCardIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
  </svg>
);

const UsdtIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="11" fill="#26A17B" />
    <path d="M13.5 12.7c-.1 0-.6.1-1.5.1s-1.3 0-1.5-.1c-2.7-.1-4.7-.7-4.7-1.3s2-1.2 4.7-1.3V12c.2 0 .7.1 1.5.1s1.4 0 1.5-.1v-1.9c2.7.1 4.7.7 4.7 1.3s-2 1.2-4.7 1.3zm0-2.8v-1.7h4.2V6H6.3v2.2h4.2v1.7c-3 .2-5.3.9-5.3 1.8s2.3 1.7 5.3 1.8V18h3V13.5c3-.1 5.3-.9 5.3-1.8s-2.3-1.6-5.3-1.8z" fill="white" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);

const TicketIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M2 9a3 3 0 013-3h14a3 3 0 013 3v0a3 3 0 00-3 3v0a3 3 0 003 3v0a3 3 0 01-3 3H5a3 3 0 01-3-3v0a3 3 0 003-3v0a3 3 0 00-3-3z" />
  </svg>
);

const MinusIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M5 12h14" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

/* ─── Quick-pick presets ─── */
const QUICK_PICKS = [1, 5, 10, 20, 50];

export default function CampaignDetailPage() {
  const goBack = useNativeBack();

  const {
    prize,
    totalSlots,
    creditsPerPurchase,
    stripePriceUsd,
    cryptoPriceUsd,
    contractAddress,
    chainName,
    blockExplorerUrl,
  } = activeCampaign;

  const progressPct = Math.min((MOCK_SOLD / totalSlots) * 100, 100);
  const myWinProbability = ((MOCK_MY_ENTRIES / totalSlots) * 100).toFixed(2);

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 2000);
    return () => clearTimeout(t);
  }, [toastMsg]);

  // Payment bottom sheet
  const [sheetOpen, setSheetOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [payMethod, setPayMethod] = useState<'crypto' | 'stripe'>('crypto');

  // Rules bottom sheet
  const [rulesOpen, setRulesOpen] = useState(false);

  const clampQty = useCallback((n: number) => Math.max(1, Math.min(n, REMAINING_SLOTS)), []);

  const winProbability = ((qty / totalSlots) * 100).toFixed(2);
  const totalCredits = qty * creditsPerPurchase;

  const shortAddr = `${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0a0a1a] flex flex-col overflow-auto">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 via-transparent to-transparent pointer-events-none" />

      {/* ─── Top Bar ─── */}
      <div
        className="relative z-20 flex items-center px-4 py-2"
        style={{ marginTop: 'var(--safe-area-inset-top, 0px)' }}
      >
        <button
          onClick={goBack}
          className="w-10 h-10 flex items-center justify-center bg-gray-800/50 rounded-full text-gray-300 hover:text-white transition-colors"
        >
          <CloseIcon />
        </button>
        <h1 className="flex-1 text-center text-white font-bold text-lg pr-10">Lucky Draw</h1>
      </div>

      {/* ─── Scrollable Content ─── */}
      <div className="relative z-10 flex-1 overflow-y-auto pb-28">

        {/* ─── Hero ─── */}
        <div className="px-6 pt-4 pb-6 text-center">
          <div className="relative inline-block">
            <Image
              src="/images/campaign/iphone17pro.png"
              alt={prize}
              width={220}
              height={440}
              className="w-[180px] h-auto drop-shadow-[0_0_40px_rgba(168,85,247,0.5)]"
              priority
            />
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-fuchsia-500/40 blur-xl rounded-full" />
          </div>

          <h2 className="mt-4 text-2xl font-black">
            <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
              {prize}
            </span>
          </h2>
          <p className="text-purple-200/60 text-sm mt-1">
            + <span className="text-white font-semibold">{creditsPerPurchase} AI Credits</span> per entry
          </p>

          {/* Draw trigger hint */}
          <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-amber-500/10 rounded-full">
            <span className="text-amber-400 text-xs font-medium">
              Draw when all {totalSlots.toLocaleString()} slots sold
            </span>
          </div>
        </div>

        {/* ─── Progress ─── */}
        <div className="px-4 mb-4">
          <div className="bg-white/5 rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-purple-200/80">
                <span className="text-white font-bold">{MOCK_SOLD.toLocaleString()}</span> / {totalSlots.toLocaleString()} slots
              </span>
              <span className="text-amber-400 font-semibold">
                {REMAINING_SLOTS.toLocaleString()} left
              </span>
            </div>
            <div className="h-3 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 shadow-[0_0_14px_rgba(245,158,11,0.5)] transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* ─── My Entries (only when user has entries) ─── */}
        {MOCK_MY_ENTRIES > 0 && (
          <div className="px-4 mb-4">
            <div className="bg-gradient-to-r from-purple-900/40 to-fuchsia-900/30 border border-purple-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300">
                  <TicketIcon />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold text-lg">{MOCK_MY_ENTRIES}</span>
                    <span className="text-purple-200/70 text-sm">entries</span>
                  </div>
                  <p className="text-purple-300/60 text-xs">
                    Win probability: <span className="text-amber-400 font-semibold">{myWinProbability}%</span>
                  </p>
                </div>
                <button
                  onClick={() => { setQty(1); setSheetOpen(true); }}
                  className="px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-full hover:bg-purple-500 transition-colors"
                >
                  + Add More
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Recent Entries ─── */}
        <div className="px-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-sm">Recent Entries</h3>
            <span className="text-purple-400/50 text-xs">{MOCK_SOLD.toLocaleString()} total</span>
          </div>
          <div className="space-y-2">
            {MOCK_RECENT_ENTRIES.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {entry.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-white text-sm">{entry.name}</span>
                </div>
                <span className="text-purple-300 text-xs font-medium flex-shrink-0">
                  {entry.qty} {entry.qty === 1 ? 'entry' : 'entries'}
                </span>
                <span className="text-gray-500 text-[11px] flex-shrink-0 w-14 text-right">
                  {entry.timeAgo}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Provably Fair + Rules & Terms link ─── */}
        <div className="px-4 mb-6">
          <div className="bg-white/5 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <ShieldIcon />
              <h3 className="text-white font-semibold text-sm">Provably Fair</h3>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">{chainName}</span>
            </div>

            {/* Contract address */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-gray-400 text-xs">Contract:</span>
              <a
                href={blockExplorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 text-xs font-mono hover:text-purple-300 flex items-center gap-1"
              >
                {shortAddr}
                <ExternalLinkIcon />
              </a>
            </div>

            {/* How it works — short summary */}
            <div className="space-y-1.5 text-xs text-gray-400 leading-relaxed">
              <p>Winner = <span className="text-white font-mono">blockHash % {totalSlots.toLocaleString()}</span> at the trigger block.</p>
              <p>Result is recorded on-chain — anyone can verify.</p>
            </div>

            {/* Rules & Terms link */}
            <div className="mt-3 pt-3 border-t border-white/5 flex justify-end">
              <button
                onClick={() => setRulesOpen(true)}
                className="flex items-center gap-1.5 text-purple-400/70 text-xs hover:text-purple-300 transition-colors"
              >
                <span>Rules & Terms</span>
                <InfoIcon />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Bottom CTA ─── */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 px-4 py-4 bg-gradient-to-t from-[#0a0a1a] via-[#0a0a1a] to-transparent"
        style={{ paddingBottom: 'calc(var(--safe-area-inset-bottom, 0px) + 16px)' }}
      >
        <GradientButton onClick={() => { setQty(1); setSheetOpen(true); }}>
          TRY MY LUCK — from ${cryptoPriceUsd.toFixed(0)}
        </GradientButton>
      </div>

      {/* ═══════════ Payment Bottom Sheet ═══════════ */}
      {sheetOpen && (
        <>
          <div
            className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm"
            onClick={() => setSheetOpen(false)}
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-[10001] bg-[#111127] rounded-t-3xl animate-slide-up"
            style={{ paddingBottom: 'calc(var(--safe-area-inset-bottom, 0px) + 16px)' }}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-gray-600" />
            </div>

            <div className="px-5 pb-4">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-white font-bold text-lg">Choose Entries</h3>
                <button
                  onClick={() => setSheetOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-gray-400 hover:text-white"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Quantity selector */}
              <div className="flex items-center justify-center gap-4 mb-3">
                <button
                  onClick={() => setQty((q) => clampQty(q - 1))}
                  disabled={qty <= 1}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white disabled:opacity-30 transition-opacity"
                >
                  <MinusIcon />
                </button>
                <span className="text-white text-4xl font-black w-20 text-center tabular-nums">{qty}</span>
                <button
                  onClick={() => setQty((q) => clampQty(q + 1))}
                  disabled={qty >= REMAINING_SLOTS}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white disabled:opacity-30 transition-opacity"
                >
                  <PlusIcon />
                </button>
              </div>

              {/* Quick-pick buttons */}
              <div className="flex items-center justify-center gap-2 mb-4">
                {QUICK_PICKS.filter((n) => n <= REMAINING_SLOTS).map((n) => (
                  <button
                    key={n}
                    onClick={() => setQty(n)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      qty === n
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              {/* Probability + Credits info */}
              <div className="bg-white/5 rounded-xl p-3 mb-5">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Win probability</span>
                  <span className="text-amber-400 font-bold text-lg">{winProbability}%</span>
                </div>
                <p className="text-gray-500 text-[11px] mt-1">
                  +{totalCredits.toLocaleString()} AI credits included
                </p>
              </div>

              {/* Payment method selector */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => setPayMethod('crypto')}
                  className={`relative flex flex-col items-center gap-1.5 rounded-2xl py-4 px-3 transition-all active:scale-[0.97] ${
                    payMethod === 'crypto'
                      ? 'bg-gradient-to-br from-emerald-900/50 to-teal-900/40 border-2 border-emerald-500'
                      : 'bg-white/5 border-2 border-transparent'
                  }`}
                >
                  <span className="absolute -top-2 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded">
                    Best Value
                  </span>
                  <UsdtIcon />
                  <span className="text-white text-xl font-black">${(cryptoPriceUsd * qty).toFixed(2)}</span>
                  <span className="text-emerald-300/70 text-[11px]">USDT / USDC</span>
                </button>

                <button
                  onClick={() => setPayMethod('stripe')}
                  className={`relative flex flex-col items-center gap-1.5 rounded-2xl py-4 px-3 transition-all active:scale-[0.97] ${
                    payMethod === 'stripe'
                      ? 'bg-gradient-to-br from-indigo-900/50 to-purple-900/40 border-2 border-indigo-500'
                      : 'bg-white/5 border-2 border-transparent'
                  }`}
                >
                  <span className="absolute -top-2 bg-indigo-500 text-white text-[9px] font-bold px-2 py-0.5 rounded">
                    Instant
                  </span>
                  <CreditCardIcon />
                  <span className="text-white text-xl font-black">${(stripePriceUsd * qty).toFixed(2)}</span>
                  <span className="text-indigo-300/70 text-[11px]">Credit Card</span>
                </button>
              </div>

              <GradientButton
                onClick={() => {
                  setSheetOpen(false);
                  setToastMsg(payMethod === 'crypto' ? 'Crypto payment coming soon!' : 'Stripe payment coming soon!');
                }}
              >
                JOIN NOW — ${(payMethod === 'crypto' ? cryptoPriceUsd * qty : stripePriceUsd * qty).toFixed(2)}
              </GradientButton>
            </div>
          </div>
        </>
      )}

      {/* ═══════════ Rules & Terms Bottom Sheet ═══════════ */}
      {rulesOpen && (
        <>
          <div
            className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm"
            onClick={() => setRulesOpen(false)}
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-[10001] bg-[#111127] rounded-t-3xl animate-slide-up max-h-[70vh] flex flex-col"
            style={{ paddingBottom: 'calc(var(--safe-area-inset-bottom, 0px) + 16px)' }}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-gray-600" />
            </div>

            <div className="px-5 pb-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-lg">Rules & Terms</h3>
                <button
                  onClick={() => setRulesOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-gray-400 hover:text-white"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
                {/* Entry */}
                <div>
                  <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-2">Entry</h4>
                  <ul className="space-y-1.5 text-gray-400 text-xs">
                    <li>Each entry costs ${cryptoPriceUsd.toFixed(2)} (crypto) or ${stripePriceUsd.toFixed(2)} (card).</li>
                    <li>Every entry includes {creditsPerPurchase} AI credits for use on the platform.</li>
                    <li>Maximum {totalSlots.toLocaleString()} entries per draw round.</li>
                    <li>No limit on entries per user — more entries, higher win probability.</li>
                  </ul>
                </div>

                {/* Draw Mechanism */}
                <div>
                  <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-2">Draw Mechanism</h4>
                  <ul className="space-y-1.5 text-gray-400 text-xs">
                    <li>Draw triggers automatically when all {totalSlots.toLocaleString()} entries are sold.</li>
                    <li>Winner is determined by: <span className="text-white font-mono">blockHash % {totalSlots.toLocaleString()}</span></li>
                    <li>The result is recorded on-chain ({chainName}) and publicly verifiable.</li>
                    <li>No one — including the platform — can influence or predict the outcome.</li>
                  </ul>
                </div>

                {/* Prize */}
                <div>
                  <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-2">Prize</h4>
                  <ul className="space-y-1.5 text-gray-400 text-xs">
                    <li>Current prize: {prize}.</li>
                    <li>Winner will be contacted via registered email within 48 hours.</li>
                    <li>Prize is non-transferable and cannot be exchanged for cash.</li>
                    <li>Shipping is free worldwide.</li>
                  </ul>
                </div>

                {/* AI Credits */}
                <div>
                  <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-2">AI Credits</h4>
                  <ul className="space-y-1.5 text-gray-400 text-xs">
                    <li>Credits are delivered instantly to your account after purchase.</li>
                    <li>Credits can be used for all AI features: TTS, voice cloning, image, music, and video generation.</li>
                    <li>Credits do not expire.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[10002] bg-gray-800 text-white text-sm px-4 py-2 rounded-lg shadow-lg animate-fade-in">
          {toastMsg}
        </div>
      )}
    </div>
  );
}