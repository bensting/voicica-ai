'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import type { CrashHistoryItem } from '@/actions/crash-game';

interface GameHistoryProps {
  history: CrashHistoryItem[];
  loading: boolean;
}

/**
 * 最近游戏记录列表
 */
export default function GameHistory({ history, loading }: GameHistoryProps) {
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="px-4 py-6">
        <div className="h-4 w-32 bg-white/10 rounded animate-pulse mb-3" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 bg-white/5 rounded-lg mb-2 animate-pulse" />
        ))}
      </div>
    );
  }

  if (history.length === 0) return null;

  return (
    <div className="px-4 pb-6">
      <h3 className="text-sm font-semibold text-white/60 mb-2">
        {t('native.crashGame.recentGames')}
      </h3>
      <div className="space-y-1.5">
        {history.map((item) => {
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
                  {item.betAmount} $V
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
