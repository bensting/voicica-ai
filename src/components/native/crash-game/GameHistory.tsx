'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getUserCrashHistory, type CrashHistoryItem } from '@/actions/crash-game';

const PAGE_SIZE = 10;

interface GameHistoryProps {
  history: CrashHistoryItem[];
  loading: boolean;
  onRefresh?: () => void;
}

/**
 * 最近游戏记录：sticky header + 独立滚动列表 + 滚到底加载更多
 */
export default function GameHistory({ history: initialHistory, loading: initialLoading, onRefresh }: GameHistoryProps) {
  const { t } = useLanguage();
  const [showRules, setShowRules] = useState(false);
  const [items, setItems] = useState<CrashHistoryItem[]>(initialHistory);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Sync when parent refreshes
  useEffect(() => {
    setItems(initialHistory);
    setHasMore(initialHistory.length >= PAGE_SIZE);
  }, [initialHistory]);

  // Auto-refresh when section becomes visible
  useEffect(() => {
    if (!onRefresh || !sentinelRef.current) return;
    const el = sentinelRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) onRefresh(); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [onRefresh]);

  // Load more on scroll to bottom
  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el || loadingMore || !hasMore) return;
    // Near bottom: 40px threshold
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
      setLoadingMore(true);
      getUserCrashHistory(PAGE_SIZE, items.length)
        .then((more) => {
          if (more.length < PAGE_SIZE) setHasMore(false);
          setItems(prev => [...prev, ...more]);
        })
        .catch(() => setHasMore(false))
        .finally(() => setLoadingMore(false));
    }
  }, [items.length, loadingMore, hasMore]);

  return (
    <>
      <div className="flex flex-col h-full" ref={sentinelRef}>
        {/* Sticky header */}
        <div className="shrink-0 flex items-center justify-between px-4 pt-3 pb-2">
          <h3 className="text-sm font-semibold text-white/60">
            {t('native.crashGame.recentGames')}
          </h3>
          <button
            onClick={() => setShowRules(true)}
            className="flex items-center gap-1 text-xs text-white/40 hover:text-white/60 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Rules
          </button>
        </div>

        {/* Scrollable list */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto px-4 pb-4 min-h-0"
          onScroll={handleScroll}
        >
          {initialLoading && items.length === 0 ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center text-white/20 text-sm py-6">No games yet</div>
          ) : (
            <div className="space-y-1.5">
              {items.map((item) => {
                const isWin = item.status === 'cashed_out';
                return (
                  <div
                    key={item.roundId}
                    className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${isWin ? 'text-green-400' : 'text-red-400'}`}>
                        {isWin ? '✓' : '✗'}
                      </span>
                      <span className="text-sm font-medium text-white/80">
                        {item.crashPoint.toFixed(2)}x
                      </span>
                      {item.cashOutMultiplier && (
                        <span className="text-xs text-white/40">
                          @{item.cashOutMultiplier.toFixed(2)}x
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-semibold ${isWin ? 'text-green-400' : 'text-red-400'}`}>
                        {(item.profit ?? 0) >= 0 ? '+' : ''}{(item.profit ?? 0).toFixed(2)}
                      </span>
                      <span className="ml-2 text-xs text-white/30">
                        {item.betAmount} $VOICICA
                      </span>
                    </div>
                  </div>
                );
              })}
              {loadingMore && (
                <div className="flex justify-center py-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-400 border-t-transparent" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Rules Bottom Sheet */}
      {showRules && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-50"
            onClick={() => setShowRules(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
            <div className="mx-auto max-w-[430px] rounded-t-2xl bg-slate-900 border-t border-white/10 px-5 pt-4 pb-8 max-h-[70vh] overflow-y-auto">
              <div className="flex justify-center mb-4">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              <h2 className="text-lg font-bold text-white mb-4">Crash Game Rules</h2>

              <div className="space-y-4 text-sm text-white/70 leading-relaxed">
                <div>
                  <h3 className="text-white font-semibold mb-1">How to Play</h3>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Enter your bet amount in $VOICICA and tap Start</li>
                    <li>Watch the multiplier rise from 1.00x</li>
                    <li>Tap Cash Out before the crash to lock in your winnings</li>
                    <li>If you don&apos;t cash out in time, you lose your bet</li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-white font-semibold mb-1">Winnings</h3>
                  <p>Your payout = Bet Amount × Cash Out Multiplier</p>
                  <p className="text-white/40 text-xs mt-1">Example: Bet 100, cash out at 2.50x → receive 250 $VOICICA</p>
                </div>

                <div>
                  <h3 className="text-white font-semibold mb-1">Provably Fair</h3>
                  <p>Each round&apos;s crash point is determined before the game starts. A SHA-256 hash is shown during the game. After the round, the seed is revealed so you can verify:</p>
                  <p className="font-mono text-xs text-purple-400 mt-1">SHA-256(seed) = displayed hash</p>
                </div>

                <div>
                  <h3 className="text-white font-semibold mb-1">Limits</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>One active game at a time</li>
                    <li>Game auto-expires after the max duration</li>
                    <li>The crash point can be as low as 1.00x (instant crash)</li>
                  </ul>
                </div>
              </div>

              <button
                onClick={() => setShowRules(false)}
                className="mt-5 w-full rounded-xl bg-white/10 py-3 text-white font-medium text-sm hover:bg-white/15 transition"
              >
                Got it
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
