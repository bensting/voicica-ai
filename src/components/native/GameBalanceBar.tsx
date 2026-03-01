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
import { useNavigationLoading } from '@/hooks/useNavigationLoading';
import NativeLoadingOverlay from './common/NativeLoadingOverlay';
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
  const { navigating, startLoading } = useNavigationLoading();

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
        {/* Row 1: Balance */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo/voicica-token.png" alt="$VOICICA" width={24} height={24} className="w-6 h-6" />
            <span className="text-white/40 text-xs font-medium">$VOICICA</span>
          </div>
          <span className="text-white font-bold text-lg">
            {loading ? '...' : formatCredits(usableBalance)}
          </span>
        </div>

        {/* Row 2: Reserve hint + Actions */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-white/25 text-[10px]">
            {formatCredits(min_voicica_reserve)} reserved
          </span>
          <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMining(true)}
            className="w-14 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-semibold text-center hover:bg-amber-500/30 active:scale-95 transition-all"
          >
            Mine
          </button>
          <button
            onClick={() => requireLogin(() => { startLoading(); router.push('/native/subscribe'); })}
            className="w-14 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 text-xs font-semibold text-center hover:bg-purple-500/30 active:scale-95 transition-all"
          >
            Buy
          </button>
          </div>
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

      <NativeLoadingOverlay visible={navigating} />
    </>
  );
}
