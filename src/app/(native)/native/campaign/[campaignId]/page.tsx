'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useNativeBack } from '@/hooks/useNativeBack';
import { activeCampaign } from '@/config/native/campaignConfig';
import GradientButton from '@/components/native/common/GradientButton';

/* ─── Mock data ─── */
const MOCK_SOLD = 1847;

const RECENT_JOINERS = [
  'Adit', 'Sanjay', 'Priya', 'Rizky', 'Maria',
  'Ahmed', 'Yuki', 'Carlos', 'Fatima', 'Davi',
];

const MOCK_WINNERS = [
  { id: 1, name: 'Sanj**', avatar: 'S', prize: 'AirPods Pro', date: '2026-02-10', txHash: '0xa1b2...c3d4' },
  { id: 2, name: 'Pri**', avatar: 'P', prize: 'iPad Mini', date: '2026-01-28', txHash: '0xe5f6...7890' },
  { id: 3, name: 'Ahm**', avatar: 'A', prize: 'iPhone 16', date: '2026-01-15', txHash: '0x1234...abcd' },
];

/* ─── Countdown (6h rolling cycle) ─── */
function getCountdown() {
  const now = Date.now();
  const cycle = 6 * 60 * 60 * 1000;
  const remaining = cycle - (now % cycle);
  const h = Math.floor(remaining / 3_600_000);
  const m = Math.floor((remaining % 3_600_000) / 60_000);
  const s = Math.floor((remaining % 60_000) / 1_000);
  return { h, m, s };
}

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

  // Countdown
  const [countdown, setCountdown] = useState<{ h: number; m: number; s: number } | null>(null);
  useEffect(() => {
    setCountdown(getCountdown());
    const timer = setInterval(() => setCountdown(getCountdown()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Rolling ticker
  const [joinerIdx, setJoinerIdx] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setJoinerIdx((i) => (i + 1) % RECENT_JOINERS.length), 2500);
    return () => clearInterval(timer);
  }, []);

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 2000);
    return () => clearTimeout(t);
  }, [toastMsg]);

  // Bottom sheet
  const [sheetOpen, setSheetOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [payMethod, setPayMethod] = useState<'crypto' | 'stripe'>('crypto');

  const clampQty = useCallback((n: number) => Math.max(1, Math.min(n, REMAINING_SLOTS)), []);

  const winProbability = ((qty / totalSlots) * 100).toFixed(2);
  const totalCredits = qty * creditsPerPurchase;

  const pad = (n: number) => String(n).padStart(2, '0');
  const shortAddr = `${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0a0a1a] flex flex-col overflow-auto">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 via-transparent to-transparent pointer-events-none" />

      {/* ─── A. Top Bar ─── */}
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

        {/* ─── B. Hero ─── */}
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

          {/* Countdown */}
          <div className="flex items-center justify-center gap-1.5 mt-4 text-sm font-mono">
            <span className="text-purple-300/60 text-xs mr-1">Next draw in</span>
            {['h', 'm', 's'].map((unit, i) => (
              <span key={unit} className="contents">
                {i > 0 && <span className="text-fuchsia-400">:</span>}
                <span className="bg-white/10 backdrop-blur-sm text-white font-bold px-2 py-1 rounded">
                  {countdown ? pad(countdown[unit as 'h' | 'm' | 's']) : '--'}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* ─── C. Progress + Social Proof ─── */}
        <div className="px-4 mb-6">
          <div className="bg-white/5 rounded-2xl p-4">
            {/* Progress bar */}
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-purple-200/80">
                <span className="text-white font-bold">{MOCK_SOLD.toLocaleString()}</span> / {totalSlots.toLocaleString()} slots
              </span>
              <span className="text-amber-400 font-semibold">
                {Math.round(progressPct)}% SOLD
              </span>
            </div>
            <div className="h-3 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 shadow-[0_0_14px_rgba(245,158,11,0.5)] transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* Social ticker */}
            <div className="mt-3 flex items-center gap-2">
              <div className="flex -space-x-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full border border-purple-500/50 bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-[9px] text-white font-bold"
                  >
                    {RECENT_JOINERS[(joinerIdx + i) % RECENT_JOINERS.length][0]}
                  </div>
                ))}
              </div>
              <p className="text-xs text-purple-300/70">
                <span className="text-fuchsia-300 font-medium">
                  {RECENT_JOINERS[joinerIdx]}
                </span>{' '}
                just joined!
              </p>
              <span className="ml-auto text-[10px] text-purple-400/50">{MOCK_SOLD.toLocaleString()} participants</span>
            </div>
          </div>
        </div>

        {/* ─── D. On-chain Fairness ─── */}
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

            {/* Rules */}
            <div className="space-y-2 text-xs text-gray-400 leading-relaxed">
              <p>1. Draw triggers when {totalSlots.toLocaleString()} entries are sold.</p>
              <p>2. Winner = <span className="text-white font-mono">blockHash % {totalSlots.toLocaleString()}</span> at the trigger block.</p>
              <p>3. Result is recorded on-chain — anyone can verify.</p>
            </div>
          </div>
        </div>

        {/* ─── E. Past Winners ─── */}
        <div className="px-4 mb-6">
          <h3 className="text-white font-semibold text-sm mb-3">Past Winners</h3>
          <div className="space-y-2">
            {MOCK_WINNERS.map((w) => (
              <div key={w.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {w.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium">{w.name}</span>
                    <span className="text-amber-400 text-xs">{w.prize}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-gray-500 text-[11px]">{w.date}</span>
                    <span className="text-purple-400/60 text-[11px] font-mono">{w.txHash}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── F. Rules ─── */}
        <div className="px-4 mb-6">
          <div className="text-[11px] text-gray-500 leading-relaxed space-y-1">
            <p className="text-gray-400 font-medium mb-1">Rules & Terms</p>
            <p>Each entry costs ${cryptoPriceUsd.toFixed(2)} (crypto) or ${stripePriceUsd.toFixed(2)} (card) and includes {creditsPerPurchase} AI credits.</p>
            <p>Draw date announced when {totalSlots.toLocaleString()} entries are sold.</p>
            <p>Winner will be contacted via registered email within 48 hours.</p>
            <p>Prize is non-transferable and cannot be exchanged for cash.</p>
          </div>
        </div>
      </div>

      {/* ─── G. Bottom CTA ─── */}
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
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm"
            onClick={() => setSheetOpen(false)}
          />

          {/* Sheet */}
          <div
            className="fixed bottom-0 left-0 right-0 z-[10001] bg-[#111127] rounded-t-3xl animate-slide-up"
            style={{ paddingBottom: 'calc(var(--safe-area-inset-bottom, 0px) + 16px)' }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-gray-600" />
            </div>

            <div className="px-5 pb-4">
              {/* Header */}
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
                {/* USDT */}
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

                {/* Stripe */}
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

              {/* Confirm button */}
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

      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[10002] bg-gray-800 text-white text-sm px-4 py-2 rounded-lg shadow-lg animate-fade-in">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
