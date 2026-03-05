'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCredits } from '@/contexts/CreditsContext';
import {
  getBullBearConfig,
  startBullBearRound,
  settleBullBearRound,
  getActiveBullBearRound,
  getUserBullBearHistory,
  type BullBearConfigData,
  type BullBearRoundData,
  type BullBearHistoryItem,
} from '@/actions/bull-bear';
import { useBtcPrice } from '@/hooks/useBtcPrice';
import BtcPriceDisplay from '@/components/native/bull-bear/BtcPriceDisplay';
import DirectionPanel from '@/components/native/bull-bear/DirectionPanel';
import RoundResult from '@/components/native/bull-bear/RoundResult';
import RoundHistorySheet from '@/components/native/bull-bear/RoundHistorySheet';
import GameRulesSheet from '@/components/native/bull-bear/GameRulesSheet';
import GameBalanceBar from '@/components/native/GameBalanceBar';
import InsufficientCreditsModal from '@/components/native/common/InsufficientCreditsModal';
import NativeDailyTasksModal from '@/components/native/NativeDailyTasksModal';
import { DEFAULT_MIN_BET, DEFAULT_MAX_BET, DEFAULT_MULTIPLIERS } from '@/config/native/bullBearConfig';
import { getConversionConfig } from '@/config/appConfig';
import { consumeBullBearPrefetch } from '@/lib/bullBearPrefetch';
import { useNavigationLoading } from '@/hooks/useNavigationLoading';
import NativeLoadingOverlay from '@/components/native/common/NativeLoadingOverlay';

type GameState = 'idle' | 'betting' | 'playing' | 'result';

export default function BullBearPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { credits, refreshCredits, refreshCreditsSilent, deductCredits, updateCredits } = useCredits();
  const { navigating: goingBack, startLoading } = useNavigationLoading();
  const { price, priceHistory, isConnected } = useBtcPrice();

  const goBack = useCallback(() => {
    startLoading();
    router.replace('/native');
  }, [router, startLoading]);

  const { min_voicica_reserve } = getConversionConfig();
  const usableBalance = Math.max(0, Math.floor(credits - min_voicica_reserve));

  // Config
  const [config, setConfig] = useState<BullBearConfigData | null>(null);

  // Game state
  const [gameState, setGameState] = useState<GameState>('idle');
  const [roundData, setRoundData] = useState<BullBearRoundData | null>(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);

  // History & Rules sheets
  const [showHistory, setShowHistory] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [history, setHistory] = useState<BullBearHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Insufficient credits modal
  const [showInsufficientCredits, setShowInsufficientCredits] = useState(false);
  const [insufficientInfo, setInsufficientInfo] = useState<{ required: number; current: number } | null>(null);
  const [showDailyTasks, setShowDailyTasks] = useState(false);

  // Refs
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const countdownTimerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // Multipliers map from config
  const multipliers: Record<number, number> = config ? {
    30: config.multiplier30s,
    60: config.multiplier60s,
    120: config.multiplier120s,
  } : DEFAULT_MULTIPLIERS;

  // Load config and active round
  useEffect(() => {
    const init = async () => {
      try {
        const prefetched = consumeBullBearPrefetch();
        const [configData, activeResult] = await Promise.all([
          prefetched.configPromise ?? getBullBearConfig(),
          prefetched.activeRoundPromise ?? getActiveBullBearRound(),
        ]);

        setConfig(configData);

        if (activeResult.success && activeResult.data) {
          if (activeResult.data.status === 'active') {
            setRoundData(activeResult.data);
            setGameState('playing');
          } else {
            // Already settled (expired/won/lost/draw from server recovery)
            setRoundData(activeResult.data);
            setGameState('result');
            refreshCredits();
          }
        }
      } catch (error) {
        console.error('Failed to initialize bull bear game:', error);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Countdown timer during playing state
  useEffect(() => {
    if (gameState === 'playing' && roundData) {
      const startedAt = new Date(roundData.startedAt).getTime();
      const endAt = startedAt + roundData.durationSeconds * 1000;

      const tick = () => {
        const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
        setCountdown(remaining);

        if (remaining <= 0 && gameStateRef.current === 'playing') {
          // Time's up — settle
          clearInterval(countdownTimerRef.current);
          handleSettle();
        }
      };

      tick(); // immediate
      countdownTimerRef.current = setInterval(tick, 1000);

      return () => clearInterval(countdownTimerRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, roundData?.roundId]);

  // Load history separately
  const refreshHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await getUserBullBearHistory(10);
      setHistory(data);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  // Start a new round
  const handleStart = useCallback(async (betAmount: number, direction: 'bull' | 'bear', duration: number) => {
    const available = Math.max(0, Math.floor(credits - min_voicica_reserve));
    if (betAmount > available) {
      setInsufficientInfo({ required: betAmount, current: available });
      setShowInsufficientCredits(true);
      return;
    }

    setLoading(true);
    setGameState('betting');

    try {
      const result = await startBullBearRound(betAmount, direction, duration);
      if (result.success && result.data) {
        setRoundData(result.data);
        setGameState('playing');
        deductCredits(betAmount);
      } else {
        alert(result.error || 'Failed to start game');
        setGameState('idle');
      }
    } catch (error) {
      console.error('Start error:', error);
      alert('Failed to start game');
      setGameState('idle');
    } finally {
      setLoading(false);
    }
  }, [credits, min_voicica_reserve, deductCredits]);

  // Settle round
  const handleSettle = useCallback(async () => {
    if (!roundData || gameStateRef.current !== 'playing') return;
    setLoading(true);

    try {
      const result = await settleBullBearRound(roundData.roundId);
      if (result.success && result.data) {
        setRoundData(result.data);
        setGameState('result');

        const profit = result.data.profit ?? 0;
        if (result.data.status === 'won' || result.data.status === 'draw') {
          updateCredits(credits + roundData.betAmount + profit);
        }

        const historyData = await getUserBullBearHistory(10);
        setHistory(historyData);
      } else {
        alert(result.error || 'Failed to settle');
      }
    } catch (error) {
      console.error('Settle error:', error);
      alert('Failed to settle round');
    } finally {
      setLoading(false);
    }
  }, [roundData, credits, updateCredits]);

  // Play again
  const handlePlayAgain = useCallback(() => {
    setRoundData(null);
    setCountdown(0);
    setGameState('idle');
    refreshCreditsSilent();
  }, [refreshCreditsSilent]);

  if (config && !config.enabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <div className="text-4xl mb-4">📈</div>
        <h2 className="text-xl font-bold text-white mb-2">{t('native.bullBear.title')}</h2>
        <p className="text-white/60">{t('native.bullBear.disabled')}</p>
        <button
          onClick={() => router.back()}
          className="mt-6 px-6 py-2 bg-white/10 rounded-lg text-white/70 hover:bg-white/20 transition"
        >
          {t('native.common.cancel')}
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="h-dvh flex flex-col overflow-hidden">
        {/* Header */}
        <div
          className="shrink-0 flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-white/5"
          style={{ paddingTop: 'calc(var(--safe-area-inset-top, 0px) + 12px)' }}
        >
          <div className="flex items-center gap-3">
            <button onClick={goBack} className="text-white/60 hover:text-white transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-white">{t('native.bullBear.title')}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowRules(true)}
              className="flex items-center gap-1 text-xs text-white/40 hover:text-white/60 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('native.bullBear.rules')}
            </button>
            <button
              onClick={() => { refreshHistory(); setShowHistory(true); }}
              className="flex items-center gap-1 text-xs text-white/40 hover:text-white/60 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('native.bullBear.history')}
            </button>
          </div>
        </div>

        {/* Balance Bar */}
        <div className="shrink-0">
          <GameBalanceBar />
        </div>

        {/* BTC Price Display — fills remaining game area */}
        <div className="flex-1 flex items-start justify-center min-h-0 pt-4">
          <BtcPriceDisplay
            price={price}
            priceHistory={priceHistory}
            isConnected={isConnected}
            entryPrice={roundData?.entryPrice}
            countdown={gameState === 'playing' ? countdown : undefined}
            direction={roundData?.direction}
            isPlaying={gameState === 'playing'}
          />
        </div>

        {/* Game controls */}
        <div className="shrink-0" style={{ paddingBottom: 'var(--safe-area-inset-bottom, 0px)' }}>
          {gameState === 'idle' && (
            <DirectionPanel
              minBet={config?.minBet ?? DEFAULT_MIN_BET}
              maxBet={config?.maxBet ?? DEFAULT_MAX_BET}
              usableBalance={usableBalance}
              loading={loading}
              multipliers={multipliers}
              availableDurations={config?.availableDurations ?? [30, 60, 120]}
              onStart={handleStart}
            />
          )}

          {gameState === 'betting' && (
            <div className="px-4 pb-4">
              <div className="w-full rounded-xl bg-white/10 py-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-amber-400 border-t-transparent mx-auto mb-2" />
                <span className="text-white/60 text-sm">{t('native.bullBear.placing')}</span>
              </div>
            </div>
          )}

          {gameState === 'playing' && (
            <div className="px-4 pb-4">
              <div className="w-full rounded-xl bg-white/5 border border-white/10 py-4 text-center">
                <div className="flex items-center justify-center gap-3">
                  <span className={`text-sm font-bold px-2 py-1 rounded ${
                    roundData?.direction === 'bull' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {roundData?.direction === 'bull' ? '↑ BULL' : '↓ BEAR'}
                  </span>
                  <span className="text-white/60 text-sm">
                    {roundData?.betAmount} $V @ {roundData?.multiplier?.toFixed(2)}x
                  </span>
                </div>
                <p className="text-[10px] text-white/30 mt-1">
                  {t('native.bullBear.entryPriceLabel')}: ${roundData?.entryPrice?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                {loading && (
                  <div className="mt-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-amber-400 border-t-transparent mx-auto" />
                    <span className="text-white/40 text-xs">{t('native.bullBear.settling')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {gameState === 'result' && roundData && (
            <RoundResult
              status={roundData.status as 'won' | 'lost' | 'draw' | 'expired'}
              betAmount={roundData.betAmount}
              direction={roundData.direction}
              multiplier={roundData.multiplier}
              entryPrice={roundData.entryPrice}
              settlePrice={roundData.settlePrice}
              outcome={roundData.outcome}
              profit={roundData.profit ?? 0}
              onPlayAgain={handlePlayAgain}
            />
          )}
        </div>
      </div>

      {/* Bottom Sheets */}
      <RoundHistorySheet
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        history={history}
        loading={historyLoading}
      />
      <GameRulesSheet
        isOpen={showRules}
        onClose={() => setShowRules(false)}
      />

      {/* Insufficient credits modal */}
      <InsufficientCreditsModal
        isOpen={showInsufficientCredits}
        onClose={() => setShowInsufficientCredits(false)}
        onGetFreeCredits={() => {
          setShowInsufficientCredits(false);
          setShowDailyTasks(true);
        }}
        requiredCredits={insufficientInfo?.required}
        currentCredits={insufficientInfo?.current}
      />
      {showDailyTasks && (
        <NativeDailyTasksModal
          isOpen
          onClose={() => setShowDailyTasks(false)}
          onCreditsUpdated={refreshCredits}
        />
      )}

      <NativeLoadingOverlay visible={goingBack} />
    </>
  );
}
