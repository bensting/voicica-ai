'use client';

import Image from 'next/image';
import { ShieldIcon, ExternalLinkIcon, InfoIcon, TrophyIcon } from './icons';
import type { LuckyDrawStatusResult } from '@/actions/lucky-draw';

export interface CompletedStateProps {
  prize: string;
  prizeImageUrl: string;
  totalSlots: number;
  soldSlots: number;
  creditsPerPurchase: number;
  chainName: string | null;
  myEntryCount: number;
  mySlots: number[];
  drawResult: NonNullable<LuckyDrawStatusResult['drawResult']>;
  recentEntries: Array<{ slotNumber: number; userId: string; createdAt: string }>;
  onOpenRules: () => void;
}

export default function CompletedState({
  prize,
  prizeImageUrl,
  totalSlots,
  soldSlots,
  creditsPerPurchase,
  chainName,
  myEntryCount,
  mySlots,
  drawResult,
  recentEntries,
  onOpenRules,
}: CompletedStateProps) {
  return (
    <>
      {/* Result Hero */}
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

      {/* Winner Card */}
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

      {/* My Slots (if participated but didn't win) */}
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

      {/* Verification */}
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
            {drawResult.drawnAt && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Drawn At</span>
                <span className="text-gray-300">
                  {new Date(drawResult.drawnAt).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            )}
            {drawResult.blockNumber && (
              <a
                href={`https://polygonscan.com/block/${drawResult.blockNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 mt-2 pt-2.5 border-t border-white/5 text-purple-400 hover:text-purple-300 transition-colors"
              >
                <span>Verify on Polygonscan</span>
                <ExternalLinkIcon />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* All Purchases */}
      {recentEntries.length > 0 && (
        <div className="px-4 mb-4">
          <div className="bg-white/5 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-sm">All Purchases</h3>
              <span className="text-gray-500 text-xs">{soldSlots.toLocaleString()} slots</span>
            </div>
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
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

      {/* Rules & Terms link */}
      <div className="px-4 mb-6">
        <button
          onClick={onOpenRules}
          className="flex items-center gap-1.5 text-purple-400/50 text-xs hover:text-purple-300 transition-colors mx-auto"
        >
          <span>Rules & Terms</span>
          <InfoIcon />
        </button>
      </div>
    </>
  );
}
