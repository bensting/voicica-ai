/**
 * GameBalanceBar
 * 游戏页面公共余额栏 — 显示 $VOICICA 余额 + Mine / Buy 入口
 * 适用于 crash-game、lucky-draw 等所有游戏页面
 */
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCredits } from '@/contexts/CreditsContext';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { formatCredits } from '@/utils/formatCredits';
import { getConversionConfig } from '@/config/appConfig';
import NativeDailyTasksModal from './NativeDailyTasksModal';
import LoginModal from './LoginModal';

const { min_voicica_reserve } = getConversionConfig();

export default function GameBalanceBar() {
  const router = useRouter();
  const { credits, loading, refreshCredits } = useCredits();
  const { user } = useFirebaseAuth();

  // Usable balance = total credits minus the reserved amount (e.g. 2000)
  const usableBalance = Math.max(0, credits - min_voicica_reserve);

  const [showMining, setShowMining] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const requireLogin = useCallback((action: () => void) => {
    if (!user) {
      setShowLogin(true);
      return;
    }
    action();
  }, [user]);

  return (
    <>
      <div className="mx-4 mt-3 mb-3 rounded-xl bg-white/5 border border-white/10 px-4 py-3">
        {/* Row 1: Balance + $VOICICA */}
        <div className="flex items-baseline justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo/voicica-token.png" alt="$VOICICA" width={24} height={24} className="w-6 h-6" />
            <span className="text-white font-bold text-lg">
              {loading ? '...' : formatCredits(usableBalance)}
            </span>
          </div>
          <span className="text-white/40 text-xs font-medium">$VOICICA</span>
        </div>

        {/* Row 2: Reserve hint */}
        <p className="text-white/25 text-[10px] mt-1 text-center">
          {formatCredits(min_voicica_reserve)} $VOICICA reserved and not available for games
        </p>

        {/* Row 3: Actions */}
        <div className="flex items-center justify-end gap-2 mt-2">
          <button
            onClick={() => setShowMining(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-semibold hover:bg-amber-500/30 active:scale-95 transition-all"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 3.5l6 6M4 20l6.5-6.5" />
              <path d="M18 2l4 4-7.5 7.5-4-4L18 2z" />
              <path d="M2 22l5.5-5.5" />
              <path d="M7.5 13.5L10 16" />
            </svg>
            Mine
          </button>
          <button
            onClick={() => requireLogin(() => router.push('/native/subscribe'))}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 text-xs font-semibold hover:bg-purple-500/30 active:scale-95 transition-all"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M16 8h-6a2 2 0 100 4h4a2 2 0 110 4H8" />
              <path d="M12 18V6" />
            </svg>
            Buy
          </button>
        </div>

      </div>

      {showMining && (
        <NativeDailyTasksModal
          isOpen
          onClose={() => setShowMining(false)}
          onCreditsUpdated={refreshCredits}
        />
      )}

      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onLoginSuccess={() => setShowLogin(false)}
      />
    </>
  );
}
