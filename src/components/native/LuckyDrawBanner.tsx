'use client';

import Link from 'next/link';
import Image from 'next/image';
import { activeLuckyDraw } from '@/config/native/luckyDrawConfig';

/** Mock data — will be replaced by API later */
const MOCK_SOLD = 1847;

export default function LuckyDrawBanner() {
  const { totalSlots, creditsPerPurchase, prize, href } = activeLuckyDraw;
  const progressPct = Math.min((MOCK_SOLD / totalSlots) * 100, 100);
  const remaining = totalSlots - MOCK_SOLD;

  return (
    <Link href={href} className="block mx-4">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#05001a] via-[#120030] to-[#0a0025]">
        {/* Animated glow orbs */}
        <div className="absolute top-1/4 -right-10 w-52 h-52 rounded-full bg-fuchsia-600/25 blur-[90px] animate-pulse" />
        <div className="absolute -bottom-12 -left-12 w-60 h-60 rounded-full bg-violet-600/20 blur-[90px] animate-pulse [animation-delay:1s]" />
        <div className="absolute top-0 right-1/4 w-36 h-36 rounded-full bg-amber-500/10 blur-[70px] animate-pulse [animation-delay:2s]" />

        {/* Shimmer sweep */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-[shimmer_3s_ease-in-out_infinite]" />

        {/* Content */}
        <div className="relative z-10 flex flex-col gap-4 p-5">

          {/* === Top: Tag + Remaining === */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-[0.2em] text-fuchsia-300/80 uppercase">
              FREE LUCKY DRAW
            </span>
            <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full">
              {remaining.toLocaleString()} left
            </span>
          </div>

          {/* === Center: Hero — iPhone + headline === */}
          <div className="flex items-center gap-3">
            {/* iPhone image */}
            <div className="relative flex-shrink-0 w-[140px]">
              <Image
                src="/images/campaign/iphone17pro.png"
                alt={prize}
                width={220}
                height={440}
                className="w-full h-auto drop-shadow-[0_0_30px_rgba(168,85,247,0.5)]"
                priority
              />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-5 bg-fuchsia-500/40 blur-xl rounded-full" />
            </div>

            {/* Headline */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-black text-white leading-[1.1]">
                <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
                  {prize}
                </span>
              </h3>
              <div className="mt-2 space-y-1">
                <p className="text-white text-xs font-semibold">
                  {creditsPerPurchase} AI Credits
                  <span className="text-purple-200/50 font-normal"> — $1</span>
                </p>
                <p className="text-emerald-400 text-[11px] font-medium">
                  + FREE Draw Entry
                </p>
              </div>
            </div>
          </div>

          {/* === Bottom: Progress + CTA === */}
          <div className="space-y-2">
            {/* Progress */}
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-purple-200/80">
                  <span className="text-white font-bold">{MOCK_SOLD.toLocaleString()}</span> / {totalSlots.toLocaleString()}
                </span>
                <span className="text-amber-400/90 font-semibold text-[10px]">
                  {Math.round(progressPct)}%
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
                <span>TRY MY LUCK — Free</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
