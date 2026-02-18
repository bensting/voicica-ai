'use client';

import Image from 'next/image';
import { ShieldIcon, ExternalLinkIcon, InfoIcon, TicketIcon } from './icons';

export interface SellingStateProps {
  prize: string;
  prizeImageUrl: string;
  totalSlots: number;
  soldSlots: number;
  creditsPerPurchase: number;
  cryptoPriceCents: number;
  stripePriceCents: number;
  chainName: string | null;
  contractAddress: string | null;
  blockExplorerUrl: string | null;
  myEntries: Array<{ slotNumber: number; packs: number; createdAt: string }>;
  recentEntries: Array<{ slotNumber: number; userId: string; createdAt: string }>;
  onBuyMore: () => void;
  onOpenRules: () => void;
}

export default function SellingState({
  prize,
  prizeImageUrl,
  totalSlots,
  soldSlots,
  creditsPerPurchase,
  chainName,
  contractAddress,
  blockExplorerUrl,
  myEntries,
  recentEntries,
  onBuyMore,
  onOpenRules,
}: SellingStateProps) {
  const remainingSlots = totalSlots - soldSlots;
  const progressPct = Math.min((soldSlots / totalSlots) * 100, 100);
  const myEntryCount = myEntries.length;
  const mySlots = myEntries.map((e) => e.slotNumber);
  const shortAddr = contractAddress ? `${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}` : '';

  return (
    <>
      {/* Hero */}
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

      {/* Progress */}
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

      {/* My Entries */}
      {myEntryCount > 0 && (
        <div className="px-4 mb-4">
          <div className="bg-gradient-to-r from-purple-900/40 to-fuchsia-900/30 border border-purple-500/20 rounded-2xl p-4">
            {/* Summary row */}
            <div className="flex items-center gap-3 mb-3">
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
                onClick={onBuyMore}
                className="px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-full hover:bg-purple-500 transition-colors"
              >
                + Buy More
              </button>
            </div>

            {/* Slot numbers */}
            <div className="pt-3 border-t border-purple-500/10">
              <h4 className="text-purple-200/60 text-xs font-medium mb-2">Your Slots</h4>
              <div className="flex flex-wrap gap-1.5">
                {mySlots.map((slot) => (
                  <span key={slot} className="text-purple-300 text-xs font-mono bg-purple-500/10 px-2 py-0.5 rounded-md">
                    #{slot.toLocaleString()}
                  </span>
                ))}
              </div>
            </div>

            {/* Purchase history */}
            <div className="pt-3 mt-3 border-t border-purple-500/10">
              <h4 className="text-purple-200/60 text-xs font-medium mb-2">Purchase History</h4>
              <div className="space-y-2">
                {myEntries.map((entry) => (
                  <div key={entry.slotNumber} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-purple-300 font-mono">#{entry.slotNumber.toLocaleString()}</span>
                      <span className="text-purple-200/40">·</span>
                      <span className="text-gray-400">{creditsPerPurchase} credits</span>
                    </div>
                    <span className="text-gray-500">
                      {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Purchases (all users) */}
      {recentEntries.length > 0 && (
        <div className="px-4 mb-4">
          <div className="bg-white/5 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-sm">Recent Purchases</h3>
              <span className="text-gray-500 text-xs">{soldSlots.toLocaleString()} total</span>
            </div>
            <div className="space-y-2.5 max-h-[240px] overflow-y-auto">
              {recentEntries.map((entry) => (
                <div key={entry.slotNumber} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-purple-500/15 flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-300 text-[10px] font-bold">U</span>
                    </div>
                    <span className="text-gray-300">User {entry.userId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-300 font-mono">#{entry.slotNumber.toLocaleString()}</span>
                    <span className="text-gray-600">
                      {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Provably Fair + Rules & Terms link */}
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

          {/* How it works */}
          <div className="space-y-1.5 text-xs text-gray-400 leading-relaxed">
            <p>Winner = <span className="text-white font-mono">blockHash % {totalSlots.toLocaleString()}</span> at the trigger block.</p>
            <p>Result is recorded on-chain — anyone can verify.</p>
          </div>

          {/* Rules & Terms link */}
          <div className="mt-3 pt-3 border-t border-white/5 flex justify-end">
            <button
              onClick={onOpenRules}
              className="flex items-center gap-1.5 text-purple-400/70 text-xs hover:text-purple-300 transition-colors"
            >
              <span>Rules & Terms</span>
              <InfoIcon />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
