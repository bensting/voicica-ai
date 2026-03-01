'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface GameResultProps {
  status: 'cashed_out' | 'crashed' | 'expired';
  betAmount: number;
  crashPoint: number;
  cashOutMultiplier?: number;
  profit: number;
  seed: string;
  seedHash: string;
  onPlayAgain: () => void;
}

/**
 * 游戏结果展示 + Provably Fair 验证
 */
export default function GameResult({
  status,
  betAmount,
  crashPoint,
  cashOutMultiplier,
  profit,
  seed,
  seedHash,
  onPlayAgain,
}: GameResultProps) {
  const { t } = useLanguage();
  const [showFairness, setShowFairness] = useState(false);
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
        <div className="mt-2 flex items-center justify-center gap-4 text-sm text-white/60">
          <span>{t('native.crashGame.bet')}: {betAmount} $VOICICA</span>
          <span>Crash: {crashPoint.toFixed(2)}x</span>
          {cashOutMultiplier && <span>Out: {cashOutMultiplier.toFixed(2)}x</span>}
        </div>
      </div>

      {/* Play again */}
      <button
        onClick={onPlayAgain}
        className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 py-3 text-white font-bold text-lg shadow-lg active:scale-[0.98] transition-transform"
      >
        {t('native.crashGame.playAgain')}
      </button>

      {/* Provably Fair */}
      <button
        onClick={() => setShowFairness(!showFairness)}
        className="w-full text-center text-xs text-white/40 hover:text-white/60 transition-colors"
      >
        {t('native.crashGame.provablyFair')} {showFairness ? '▲' : '▼'}
      </button>

      {showFairness && (
        <div className="rounded-xl bg-white/5 p-4 text-xs space-y-2 border border-white/10">
          <div>
            <span className="text-white/40">Seed:</span>
            <p className="text-white/70 font-mono break-all mt-0.5">{seed}</p>
          </div>
          <div>
            <span className="text-white/40">SHA-256 Hash:</span>
            <p className="text-white/70 font-mono break-all mt-0.5">{seedHash}</p>
          </div>
          <div>
            <span className="text-white/40">Crash Point:</span>
            <p className="text-white/70 font-mono mt-0.5">{crashPoint.toFixed(2)}x</p>
          </div>
          <p className="text-white/30 text-[10px]">
            {t('native.crashGame.fairnessNote')}
          </p>
        </div>
      )}
    </div>
  );
}
