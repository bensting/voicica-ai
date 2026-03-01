'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { QUICK_BET_AMOUNTS } from '@/config/native/crashGameConfig';

interface BettingPanelProps {
  minBet: number;
  maxBet: number;
  loading: boolean;
  onStart: (amount: number) => void;
}

/**
 * 投注面板 - 金额输入 + 快捷按钮 + Start
 */
export default function BettingPanel({ minBet, maxBet, loading, onStart }: BettingPanelProps) {
  const { t } = useLanguage();
  const [betAmount, setBetAmount] = useState<string>(String(minBet));

  const handleStart = () => {
    const amount = Number(betAmount);
    if (isNaN(amount) || amount < minBet || amount > maxBet) return;
    onStart(amount);
  };

  const handleQuickBet = (amount: number) => {
    setBetAmount(String(amount));
  };

  const currentAmount = Number(betAmount);
  const isValid = !isNaN(currentAmount) && currentAmount >= minBet && currentAmount <= maxBet;

  return (
    <div className="px-4 pb-4 space-y-3">
      {/* Input + Start button */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-purple-400 font-medium">$VOICICA</span>
          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            min={minBet}
            max={maxBet}
            step="1"
            className="w-full rounded-xl bg-white/10 border border-white/20 pl-[5.5rem] pr-3 py-3 text-white text-lg font-semibold placeholder:text-white/30 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
            placeholder={String(minBet)}
          />
        </div>
        <button
          onClick={handleStart}
          disabled={loading || !isValid}
          className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3 text-white font-bold text-lg shadow-lg shadow-green-500/30 hover:shadow-green-500/50 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
        >
          {loading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            t('native.crashGame.start')
          )}
        </button>
      </div>

      {/* Quick bet buttons */}
      <div className="flex gap-2">
        {QUICK_BET_AMOUNTS.map((amount) => (
          <button
            key={amount}
            onClick={() => handleQuickBet(amount)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
              currentAmount === amount
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            {amount}
          </button>
        ))}
      </div>

      {/* Range hint */}
      <p className="text-center text-xs text-white/40">
        {t('native.crashGame.betRange', { min: minBet, max: maxBet })}
      </p>
    </div>
  );
}
