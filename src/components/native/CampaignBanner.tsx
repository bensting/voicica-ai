'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { activeCampaign } from '@/config/native/campaignConfig';

/** Mock data — will be replaced by API later */
const MOCK_SOLD = 1847;

const RECENT_JOINERS = [
  'Adit', 'Sanjay', 'Priya', 'Rizky', 'Maria',
  'Ahmed', 'Yuki', 'Carlos', 'Fatima', 'Davi',
];

/** Countdown target: rolls forward so there's always urgency */
function getCountdown() {
  const now = Date.now();
  // Reset every 6 hours
  const cycle = 6 * 60 * 60 * 1000;
  const remaining = cycle - (now % cycle);
  const h = Math.floor(remaining / 3_600_000);
  const m = Math.floor((remaining % 3_600_000) / 60_000);
  const s = Math.floor((remaining % 60_000) / 1_000);
  return { h, m, s };
}

export default function CampaignBanner() {
  const { totalSlots, priceUsd, creditsPerPurchase, prize, href } = activeCampaign;
  const progressPct = Math.min((MOCK_SOLD / totalSlots) * 100, 100);

  // Live countdown — start with null to avoid hydration mismatch
  const [countdown, setCountdown] = useState<{ h: number; m: number; s: number } | null>(null);
  useEffect(() => {
    setCountdown(getCountdown());
    const timer = setInterval(() => setCountdown(getCountdown()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Rolling "just joined" ticker
  const [joinerIdx, setJoinerIdx] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setJoinerIdx((i) => (i + 1) % RECENT_JOINERS.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <Link href={href} className="block mx-4">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-[#05001a] via-[#120030] to-[#0a0025]">
        {/* Animated glow orbs */}
        <div className="absolute top-1/4 -right-10 w-52 h-52 rounded-full bg-fuchsia-600/25 blur-[90px] animate-pulse" />
        <div className="absolute -bottom-12 -left-12 w-60 h-60 rounded-full bg-violet-600/20 blur-[90px] animate-pulse [animation-delay:1s]" />
        <div className="absolute top-0 right-1/4 w-36 h-36 rounded-full bg-amber-500/10 blur-[70px] animate-pulse [animation-delay:2s]" />

        {/* Shimmer sweep */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-[shimmer_3s_ease-in-out_infinite]" />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-between p-5">

          {/* === Top: Countdown timer === */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-[0.2em] text-fuchsia-300/80 uppercase">
              🎰 LUCKY DRAW
            </span>
            <div className="flex items-center gap-1 text-xs font-mono">
              <span className="bg-white/10 backdrop-blur-sm text-white font-bold px-1.5 py-0.5 rounded">
                {countdown ? pad(countdown.h) : '--'}
              </span>
              <span className="text-fuchsia-300">:</span>
              <span className="bg-white/10 backdrop-blur-sm text-white font-bold px-1.5 py-0.5 rounded">
                {countdown ? pad(countdown.m) : '--'}
              </span>
              <span className="text-fuchsia-300">:</span>
              <span className="bg-white/10 backdrop-blur-sm text-white font-bold px-1.5 py-0.5 rounded">
                {countdown ? pad(countdown.s) : '--'}
              </span>
            </div>
          </div>

          {/* === Center: Hero — iPhone + headline === */}
          <div className="flex items-center gap-3 flex-1 py-2">
            {/* iPhone image */}
            <div className="relative flex-shrink-0 w-[140px]">
              <div className="relative">
                <Image
                  src="/images/campaign/iphone17pro.png"
                  alt={prize}
                  width={220}
                  height={440}
                  className="w-full h-auto drop-shadow-[0_0_30px_rgba(168,85,247,0.5)]"
                  priority
                />
              </div>
              {/* Glow under phone */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-5 bg-fuchsia-500/40 blur-xl rounded-full" />
            </div>

            {/* Headline */}
            <div className="flex-1 min-w-0">
              <p className="text-amber-400 text-xs font-bold tracking-wide">
                ONLY ${priceUsd} ENTRY
              </p>
              <h3 className="text-lg font-black text-white leading-[1.1] mt-1">
                <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
                  {prize}
                </span>
              </h3>
              <p className="text-purple-200/60 text-[11px] mt-1.5 leading-snug">
                + <span className="text-white font-semibold">{creditsPerPurchase} AI Credits</span> per entry
              </p>

              {/* Social proof ticker */}
              <div className="mt-2.5 flex items-center gap-1.5">
                <div className="flex -space-x-1.5">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-full border border-purple-500/50 bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-[8px] text-white font-bold"
                    >
                      {RECENT_JOINERS[(joinerIdx + i) % RECENT_JOINERS.length][0]}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-purple-300/70 truncate">
                  <span className="text-fuchsia-300 font-medium">
                    {RECENT_JOINERS[joinerIdx]}
                  </span>
                  {' '}just joined!
                </p>
              </div>
            </div>
          </div>

          {/* === Bottom: Progress + CTA === */}
          <div className="space-y-2.5">
            {/* Progress */}
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-purple-200/80">
                  🔥 <span className="text-white font-bold">{MOCK_SOLD.toLocaleString()}</span> / {totalSlots.toLocaleString()}
                </span>
                <span className="text-amber-400/90 font-semibold text-[10px]">
                  {Math.round(progressPct)}% SOLD
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 shadow-[0_0_14px_rgba(245,158,11,0.5)] transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* CTA Button */}
            <button className="w-full relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl blur-lg opacity-50 group-hover:opacity-70 animate-pulse" />
              <div className="relative bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-400 text-white font-extrabold text-[15px] py-3.5 rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 tracking-wide">
                <span>🍀</span>
                <span>TRY MY LUCK — ${priceUsd}</span>
              </div>
            </button>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-3 text-[9px] text-purple-400/50">
              <span>✅ Stripe Secured</span>
              <span>•</span>
              <span>✅ Transparent & Fair</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
