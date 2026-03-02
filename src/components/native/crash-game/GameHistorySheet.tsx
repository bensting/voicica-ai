'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getUserCrashHistory, type CrashHistoryItem } from '@/actions/crash-game';
import { useLanguage } from '@/contexts/LanguageContext';

const PAGE_SIZE = 10;

interface GameHistorySheetProps {
  isOpen: boolean;
  onClose: () => void;
  history: CrashHistoryItem[];
  loading: boolean;
}

export default function GameHistorySheet({ isOpen, onClose, history: initialHistory, loading: initialLoading }: GameHistorySheetProps) {
  const { t } = useLanguage();
  const [items, setItems] = useState<CrashHistoryItem[]>(initialHistory);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Sync when parent data changes
  useEffect(() => {
    setItems(initialHistory);
    setHasMore(initialHistory.length >= PAGE_SIZE);
  }, [initialHistory]);

  // Reset scroll when opened
  useEffect(() => {
    if (isOpen && listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  // Load more on scroll to bottom
  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el || loadingMore || !hasMore) return;
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

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-50"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
        <div className="mx-auto max-w-[430px] rounded-t-2xl bg-slate-900 border-t border-white/10 px-5 pt-4 pb-8 max-h-[70vh] flex flex-col">
          {/* Drag handle */}
          <div className="flex justify-center mb-3">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          <h2 className="text-lg font-bold text-white mb-3">{t('native.crashGame.gameHistory')}</h2>

          {/* Scrollable list */}
          <div
            ref={listRef}
            className="flex-1 overflow-y-auto min-h-0"
            onScroll={handleScroll}
          >
            {initialLoading && items.length === 0 ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="text-center text-white/20 text-sm py-8">{t('native.crashGame.noGamesYet')}</div>
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
                {!hasMore && items.length > 0 && (
                  <p className="text-center text-white/20 text-xs py-2">{t('native.crashGame.noMoreRecords')}</p>
                )}
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="mt-4 w-full rounded-xl bg-white/10 py-3 text-white font-medium text-sm hover:bg-white/15 transition shrink-0"
          >
            {t('native.crashGame.close')}
          </button>
        </div>
      </div>
    </>
  );
}
