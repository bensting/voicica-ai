'use client';

import { useLanguage } from '@/contexts/LanguageContext';

interface GameResultProps {
  status: 'cashed_out' | 'crashed' | 'expired';
  betAmount: number;
  crashPoint: number;
  cashOutMultiplier?: number;
  profit: number;
  onPlayAgain: () => void;
  onShowFairness: () => void;
}

/**
 * 游戏结果展示 — Provably Fair 改为底部弹出面板
 */
export default function GameResult({
  status,
  betAmount,
  crashPoint,
  cashOutMultiplier,
  profit,
  onPlayAgain,
  onShowFairness,
}: GameResultProps) {
  const { t } = useLanguage();
  const isWin = status === 'cashed_out';

  return (
    <div className="px-4 pb-4 space-y-3">
      {/* Result banner */}
      <div className={`rounded-2xl p-5 text-center ${
        isWin
          ? 'bg-green-500/10 border border-green-500/30'
          : 'bg-red-500/10 border border-red-500/30'
      }`}>
        <div className={`text-2xl font-black ${isWin ? 'text-green-400' : 'text-red-400'}`}>
          {isWin ? t('native.crashGame.youWon') : t('native.crashGame.crashed')}
        </div>
        <div className={`text-3xl font-black mt-1 ${isWin ? 'text-green-300' : 'text-red-300'}`}>
          {profit >= 0 ? '+' : ''}{profit.toFixed(2)}
        </div>
        <div className={`mt-3 grid ${cashOutMultiplier ? 'grid-cols-[1fr_auto_1fr_auto_1fr]' : 'grid-cols-[1fr_auto_1fr]'} items-center text-white/60`}>
          <div className="text-center">
            <div className="text-xs">{t('native.crashGame.bet')}</div>
            <div className="text-sm font-medium">{betAmount}</div>
          </div>
          <span className="text-white/30 px-1">·</span>
          <div className="text-center">
            <div className="text-xs">Crash</div>
            <div className="text-sm font-medium">{crashPoint.toFixed(2)}x</div>
          </div>
          {cashOutMultiplier && (
            <>
              <span className="text-white/30 px-1">·</span>
              <div className="text-center">
                <div className="text-xs">Out</div>
                <div className="text-sm font-medium">{cashOutMultiplier.toFixed(2)}x</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Play again */}
      <button
        onClick={onPlayAgain}
        className={`w-full rounded-2xl py-3.5 font-bold text-lg active:scale-[0.98] transition-all ${
          isWin
            ? 'bg-green-500/15 border border-green-500/30 text-green-400'
            : 'bg-white/10 border border-white/10 text-white/80'
        }`}
      >
        {t('native.crashGame.playAgain')}
      </button>

      {/* Provably Fair — opens bottom sheet */}
      <button
        onClick={onShowFairness}
        className="w-full text-center text-xs text-white/40 hover:text-white/60 transition-colors"
      >
        {t('native.crashGame.provablyFair')} ▶
      </button>
    </div>
  );
}
