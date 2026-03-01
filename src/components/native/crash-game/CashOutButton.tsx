'use client';

import { useLanguage } from '@/contexts/LanguageContext';

interface CashOutButtonProps {
  betAmount: number;
  currentMultiplier: number;
  loading: boolean;
  onCashOut: () => void;
}

/**
 * Cash Out 大按钮 - 游戏进行中显示
 */
export default function CashOutButton({ betAmount, currentMultiplier, loading, onCashOut }: CashOutButtonProps) {
  const { t } = useLanguage();
  const potentialWin = Math.floor(betAmount * currentMultiplier * 100) / 100;

  return (
    <div className="px-4 pb-4">
      <button
        onClick={onCashOut}
        disabled={loading}
        className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-4 text-white font-bold text-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 active:scale-[0.98] transition-all disabled:opacity-60"
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            <span>{t('native.crashGame.cashingOut')}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <span>{t('native.crashGame.cashOut')}</span>
            <span className="text-sm font-normal text-white/80">
              {potentialWin.toFixed(2)} $VOICICA
            </span>
          </div>
        )}
      </button>
    </div>
  );
}
