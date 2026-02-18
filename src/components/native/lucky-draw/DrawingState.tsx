'use client';

import Image from 'next/image';
import { ShieldIcon } from './icons';

export interface DrawingStateProps {
  prize: string;
  prizeImageUrl: string;
  totalSlots: number;
  chainName: string | null;
  mySlots: number[];
}

export default function DrawingState({
  prize,
  prizeImageUrl,
  totalSlots,
  chainName,
  mySlots,
}: DrawingStateProps) {
  const myEntryCount = mySlots.length;

  return (
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
  );
}
