'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import GradientButton from '@/components/native/common/GradientButton';
import { getLuckyDrawStatus, createLuckyDrawCheckout, type LuckyDrawStatusResult } from '@/actions/lucky-draw';

/* ─── Confetti particle generator ─── */
const CONFETTI_COLORS = ['#a855f7', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#f43f5e', '#facc15', '#22d3ee'];

interface ConfettiParticle {
  id: number;
  x: number;
  color: string;
  delay: number;
  duration: number;
  size: number;
  drift: number;
}

function generateConfetti(count: number): ConfettiParticle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    delay: Math.random() * 0.5,
    duration: 1.5 + Math.random() * 1.5,
    size: 4 + Math.random() * 6,
    drift: (Math.random() - 0.5) * 60,
  }));
}

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

const TrophyIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M6 9H4a2 2 0 01-2-2V5a2 2 0 012-2h2M18 9h2a2 2 0 002-2V5a2 2 0 00-2-2h-2M6 3h12v6a6 6 0 01-12 0V3zM9 21h6M12 15v6" />
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

export default function LuckyDrawDetailPage() {
  const router = useRouter();
  const goBack = useCallback(() => router.push('/native'), [router]);
  const params = useParams();
  const drawId = params.drawId as string;

  // Server data
  const [drawStatus, setDrawStatus] = useState<LuckyDrawStatusResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

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
  const [payMethod, setPayMethod] = useState<'crypto' | 'stripe'>('stripe');

  // Rules bottom sheet
  const [rulesOpen, setRulesOpen] = useState(false);

  // Success modal
  const [successInfo, setSuccessInfo] = useState<{ credits: number; draws: number } | null>(null);
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([]);
  const confettiTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showSuccess = useCallback((credits: number, draws: number) => {
    setSuccessInfo({ credits, draws });
    setConfetti(generateConfetti(60));
    confettiTimerRef.current = setTimeout(() => setConfetti([]), 3500);
  }, []);

  const closeSuccess = useCallback(() => {
    setSuccessInfo(null);
    setConfetti([]);
    if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current);
  }, []);

  // Fetch status
  const fetchStatus = useCallback(async () => {
    try {
      const status = await getLuckyDrawStatus(drawId);
      setDrawStatus(status);
    } catch (error) {
      console.error('Failed to fetch draw status:', error);
    } finally {
      setLoading(false);
    }
  }, [drawId]);

  useEffect(() => {
    fetchStatus();
    // Poll every 30 seconds when selling
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Hooks must be before early returns
  const remainingSlots = drawStatus ? drawStatus.totalSlots - drawStatus.soldSlots : 0;
  const clampQty = useCallback((n: number) => Math.max(1, Math.min(n, remainingSlots)), [remainingSlots]);

  // Handle purchase
  const handlePurchase = async () => {
    if (payMethod === 'crypto') {
      setToastMsg('Crypto payment coming soon!');
      return;
    }

    setPurchasing(true);
    try {
      const returnUrl = `/native/lucky-draw/${drawId}`;
      const result = await createLuckyDrawCheckout(
        drawId,
        qty,
        `${window.location.origin}/native/payment/success?return_url=${encodeURIComponent(returnUrl)}`,
        `${window.location.origin}${returnUrl}`,
      );
      window.location.href = result.checkout_url;
    } catch (error) {
      console.error('Checkout failed:', error);
      setToastMsg(error instanceof Error ? error.message : 'Purchase failed');
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#0a0a1a] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!drawStatus) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#0a0a1a] flex items-center justify-center">
        <p className="text-gray-400">Lucky Draw not found</p>
      </div>
    );
  }

  // All data from server
  const {
    prize,
    prizeImageUrl,
    totalSlots,
    creditsPerPurchase,
    stripePriceCents,
    cryptoPriceCents,
    contractAddress,
    chainName,
    blockExplorerUrl,
    soldSlots,
    myEntries,
    status: currentStatus,
    drawResult,
  } = drawStatus;

  const stripePriceUsd = stripePriceCents / 100;
  const cryptoPriceUsd = cryptoPriceCents / 100;
  const progressPct = Math.min((soldSlots / totalSlots) * 100, 100);
  const myEntryCount = myEntries.length;
  const mySlots = myEntries.map((e) => e.slotNumber);
  const shortAddr = contractAddress ? `${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}` : '';
  const winProbability = ((qty / totalSlots) * 100).toFixed(2);
  const totalCredits = qty * creditsPerPurchase;

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

        {currentStatus === 'drawing' ? (
          /* ═══════════ DRAWING STATE ═══════════ */
          <>
            <div className="px-6 pt-8 pb-6 text-center">
              <div className="relative inline-block">
                <Image
                  src={prizeImageUrl}
                  alt={prize}
                  width={220}
                  height={440}
                  className="w-[140px] h-auto drop-shadow-[0_0_40px_rgba(168,85,247,0.5)] opacity-80"
                />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-fuchsia-500/40 blur-xl rounded-full" />
              </div>

              <h2 className="mt-5 text-2xl font-black text-white">{prize}</h2>

              {/* Animated drawing indicator */}
              <div className="mt-6 flex flex-col items-center gap-3">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-[3px] border-amber-500/20" />
                  <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-amber-400 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-6 h-6 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                </div>
                <p className="text-amber-400 font-bold text-lg">Drawing...</p>
                <p className="text-purple-200/50 text-xs max-w-[240px]">
                  All {totalSlots.toLocaleString()} slots are sold. The winner is being determined on-chain.
                </p>
              </div>
            </div>

            {/* Sold-out progress bar */}
            <div className="px-4 mb-4">
              <div className="bg-white/5 rounded-2xl p-4">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-purple-200/80">
                    <span className="text-white font-bold">{totalSlots.toLocaleString()}</span> / {totalSlots.toLocaleString()} slots
                  </span>
                  <span className="text-amber-400 font-semibold">SOLD OUT</span>
                </div>
                <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 shadow-[0_0_14px_rgba(245,158,11,0.5)]"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>

            {/* My entries */}
            {myEntryCount > 0 && (
              <div className="px-4 mb-4">
                <div className="bg-gradient-to-r from-purple-900/40 to-fuchsia-900/30 border border-purple-500/20 rounded-2xl p-4">
                  <h3 className="text-white font-semibold text-sm mb-2">Your Slots</h3>
                  <div className="flex flex-wrap gap-2">
                    {mySlots.map((slot) => (
                      <span key={slot} className="text-purple-300 text-xs font-mono bg-purple-500/10 px-2.5 py-1 rounded-lg">
                        #{slot.toLocaleString()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Provably Fair */}
            <div className="px-4 mb-6">
              <div className="bg-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldIcon />
                  <h3 className="text-white font-semibold text-sm">Provably Fair</h3>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">{chainName}</span>
                </div>
                <div className="space-y-1.5 text-xs text-gray-400 leading-relaxed">
                  <p>Winner = <span className="text-white font-mono">blockHash % {totalSlots.toLocaleString()}</span> at the trigger block.</p>
                  <p>Result is recorded on-chain — anyone can verify.</p>
                </div>
              </div>
            </div>
          </>

        ) : currentStatus === 'completed' && drawResult ? (
          /* ═══════════ COMPLETED STATE ═══════════ */
          <>
            {/* ─── Result Hero ─── */}
            <div className="px-6 pt-4 pb-6 text-center">
              {drawResult.isMe ? (
                <>
                  <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                    <TrophyIcon />
                  </div>
                  <h2 className="text-3xl font-black bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
                    YOU WON!
                  </h2>
                  <div className="relative inline-block mt-4">
                    <Image
                      src={prizeImageUrl}
                      alt={prize}
                      width={220}
                      height={440}
                      className="w-[160px] h-auto drop-shadow-[0_0_40px_rgba(168,85,247,0.5)]"
                    />
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-fuchsia-500/40 blur-xl rounded-full" />
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-white">{prize}</h3>
                  <p className="text-purple-200/60 text-sm mt-2">
                    We&apos;ll contact you via email within 48 hours
                  </p>
                </>
              ) : (
                <>
                  <div className="flex justify-center mb-3">
                    <span className="text-gray-300 text-xs font-medium bg-white/10 px-3 py-1.5 rounded-full">Draw Complete</span>
                  </div>
                  <Image
                    src={prizeImageUrl}
                    alt={prize}
                    width={220}
                    height={440}
                    className="w-[100px] h-auto opacity-50 mx-auto"
                  />
                  <h2 className="mt-3 text-xl font-black text-white">{prize}</h2>
                </>
              )}
            </div>

            {/* ─── Winner Card ─── */}
            <div className="px-4 mb-4">
              <div className={`rounded-2xl p-4 ${drawResult.isMe
                ? 'bg-gradient-to-r from-amber-900/40 to-yellow-900/30 border border-amber-500/30'
                : 'bg-white/5'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                    W
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold">
                      {drawResult.isMe ? 'You' : `User ***${drawResult.winnerUserId.slice(-4)}`}
                      <span className="text-amber-400 text-xs ml-2">Winner</span>
                    </p>
                    <p className="text-gray-400 text-xs">
                      Slot #{drawResult.winnerSlot.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-500 font-mono bg-black/20 rounded-lg p-2.5">
                  blockHash % {totalSlots.toLocaleString()} = {drawResult.winnerSlot.toLocaleString()}
                </div>
              </div>
            </div>

            {/* ─── My Slots (if participated but didn't win) ─── */}
            {!drawResult.isMe && myEntryCount > 0 && (
              <div className="px-4 mb-4">
                <div className="bg-white/5 rounded-2xl p-4">
                  <h3 className="text-white font-semibold text-sm mb-2">Your Slots</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {mySlots.map((slot) => (
                      <span key={slot} className="text-purple-300 text-xs font-mono bg-purple-500/10 px-2.5 py-1 rounded-lg">
                        #{slot.toLocaleString()}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                    <p className="text-gray-400 text-xs">
                      Your <span className="text-white font-semibold">{myEntryCount * creditsPerPurchase}</span> AI credits are still in your account
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ─── Verification ─── */}
            <div className="px-4 mb-4">
              <div className="bg-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldIcon />
                  <h3 className="text-white font-semibold text-sm">Verification</h3>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">{chainName}</span>
                </div>
                <div className="space-y-2.5 text-xs">
                  {drawResult.blockNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Block</span>
                      <span className="text-white font-mono">#{drawResult.blockNumber.toLocaleString()}</span>
                    </div>
                  )}
                  {drawResult.blockHash && (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-gray-400 flex-shrink-0">Hash</span>
                      <span className="text-purple-400 font-mono truncate">
                        {drawResult.blockHash.slice(0, 10)}...{drawResult.blockHash.slice(-8)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Winner Slot</span>
                    <span className="text-amber-400 font-mono font-bold">#{drawResult.winnerSlot.toLocaleString()}</span>
                  </div>
                  {blockExplorerUrl && (
                    <a
                      href={blockExplorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 mt-2 pt-2.5 border-t border-white/5 text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      <span>View on Polygonscan</span>
                      <ExternalLinkIcon />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* ─── Rules & Terms link ─── */}
            <div className="px-4 mb-6">
              <button
                onClick={() => setRulesOpen(true)}
                className="flex items-center gap-1.5 text-purple-400/50 text-xs hover:text-purple-300 transition-colors mx-auto"
              >
                <span>Rules & Terms</span>
                <InfoIcon />
              </button>
            </div>
          </>
        ) : (
          /* ═══════════ SELLING STATE ═══════════ */
          <>
            {/* ─── Hero ─── */}
            <div className="px-6 pt-4 pb-6 text-center">
              <div className="relative inline-block">
                <Image
                  src={prizeImageUrl}
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
              <p className="text-white text-sm mt-1 font-semibold">
                {creditsPerPurchase} AI Credits
                <span className="text-purple-200/50 font-normal"> — $1</span>
              </p>
              <p className="text-emerald-400 text-xs mt-1 font-medium">+ FREE Draw Entry</p>

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
                    <span className="text-white font-bold">{soldSlots.toLocaleString()}</span> / {totalSlots.toLocaleString()} slots
                  </span>
                  <span className="text-amber-400 font-semibold">
                    {remainingSlots.toLocaleString()} left
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
            {myEntryCount > 0 && (
              <div className="px-4 mb-4">
                <div className="bg-gradient-to-r from-purple-900/40 to-fuchsia-900/30 border border-purple-500/20 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300">
                      <TicketIcon />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-lg">{myEntryCount}</span>
                        <span className="text-purple-200/70 text-sm">{myEntryCount === 1 ? 'pack' : 'packs'} purchased</span>
                      </div>
                      <p className="text-purple-300/60 text-xs">
                        {myEntryCount * creditsPerPurchase} credits + <span className="text-emerald-400 font-semibold">{myEntryCount} free draws</span>
                      </p>
                    </div>
                    <button
                      onClick={() => { setQty(1); setSheetOpen(true); }}
                      className="px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-full hover:bg-purple-500 transition-colors"
                    >
                      + Buy More
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ─── Provably Fair + Rules & Terms link ─── */}
            <div className="px-4 mb-6">
              <div className="bg-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldIcon />
                  <h3 className="text-white font-semibold text-sm">Provably Fair</h3>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">{chainName}</span>
                </div>

                {/* Contract address */}
                {blockExplorerUrl && (
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
                )}

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
          </>
        )}
      </div>

      {/* ─── Bottom CTA ─── */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 px-4 py-4 bg-gradient-to-t from-[#0a0a1a] via-[#0a0a1a] to-transparent"
        style={{ paddingBottom: 'calc(var(--safe-area-inset-bottom, 0px) + 16px)' }}
      >
        {currentStatus === 'completed' ? (
          <GradientButton onClick={goBack}>
            {drawResult?.isMe ? 'Claim Prize' : 'Join Next Round'}
          </GradientButton>
        ) : currentStatus === 'drawing' ? (
          <GradientButton disabled>
            Drawing in Progress...
          </GradientButton>
        ) : (
          <GradientButton onClick={() => { setQty(1); setSheetOpen(true); }}>
            TRY MY LUCK — Free
          </GradientButton>
        )}
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
                <h3 className="text-white font-bold text-lg">Get Credit Packs</h3>
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
                  disabled={qty >= remainingSlots}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white disabled:opacity-30 transition-opacity"
                >
                  <PlusIcon />
                </button>
              </div>

              {/* Quick-pick buttons */}
              <div className="flex items-center justify-center gap-2 mb-4">
                {QUICK_PICKS.filter((n) => n <= remainingSlots).map((n) => (
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

              {/* Credits + Draw info */}
              <div className="bg-white/5 rounded-xl p-3 mb-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">AI Credits</span>
                  <span className="text-white font-bold text-lg">{totalCredits.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Free draw entries</span>
                  <span className="text-emerald-400 font-bold">{qty}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <span className="text-gray-400 text-sm">Win probability</span>
                  <span className="text-amber-400 font-bold">{winProbability}%</span>
                </div>
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
                  <span className="absolute -top-2 bg-gray-500 text-white text-[9px] font-bold px-2 py-0.5 rounded">
                    Coming Soon
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
                onClick={handlePurchase}
                disabled={purchasing}
              >
                {purchasing
                  ? 'Processing...'
                  : `GET ${totalCredits.toLocaleString()} CREDITS — $${(payMethod === 'crypto' ? cryptoPriceUsd * qty : stripePriceUsd * qty).toFixed(2)}`
                }
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
                {/* Credit Packs */}
                <div>
                  <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-2">Credit Packs</h4>
                  <ul className="space-y-1.5 text-gray-400 text-xs">
                    <li>Each credit pack contains {creditsPerPurchase} AI credits, priced at ${cryptoPriceUsd.toFixed(2)} (crypto) or ${stripePriceUsd.toFixed(2)} (card).</li>
                    <li>Every pack purchase includes a FREE lucky draw entry.</li>
                    <li>Maximum {totalSlots.toLocaleString()} packs per draw round.</li>
                    <li>No limit per user — more packs, more credits, higher win probability.</li>
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

      {/* ═══════════ Success Modal + Confetti ═══════════ */}
      {successInfo && (
        <>
          <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm" />

          {/* Confetti layer */}
          <div className="fixed inset-0 z-[10002] pointer-events-none overflow-hidden">
            {confetti.map((p) => (
              <div
                key={p.id}
                className="absolute top-0 animate-[confettiFall_var(--dur)_ease-out_var(--delay)_forwards]"
                style={{
                  left: `${p.x}%`,
                  '--delay': `${p.delay}s`,
                  '--dur': `${p.duration}s`,
                  '--drift': `${p.drift}px`,
                } as React.CSSProperties}
              >
                <div
                  className="rounded-sm animate-[confettiSpin_0.6s_linear_infinite]"
                  style={{
                    width: p.size,
                    height: p.size * 0.6,
                    backgroundColor: p.color,
                  }}
                />
              </div>
            ))}
          </div>

          {/* Modal card */}
          <div className="fixed inset-0 z-[10001] flex items-center justify-center px-8">
            <div className="bg-[#111127] rounded-3xl p-6 w-full max-w-sm text-center animate-[successPop_0.4s_ease-out]">
              {/* Success icon */}
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>

              <h3 className="text-white font-bold text-xl mb-1">Purchase Complete!</h3>
              <p className="text-gray-400 text-sm mb-5">Your credits and draw entries are ready</p>

              {/* Details */}
              <div className="bg-white/5 rounded-2xl p-4 mb-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">AI Credits</span>
                  <span className="text-white font-bold text-lg">+{successInfo.credits.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Free Draw Entries</span>
                  <span className="text-emerald-400 font-bold text-lg">+{successInfo.draws}</span>
                </div>
              </div>

              <button
                onClick={closeSuccess}
                className="w-full py-3.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-500 transition-colors"
              >
                Continue
              </button>
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
