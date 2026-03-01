'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCredits } from '@/contexts/CreditsContext';
import {
  getCrashGameConfig,
  startCrashRound,
  cashOutCrashRound,
  expireCrashRound,
  getActiveRound,
  getUserCrashHistory,
  type CrashGameConfigData,
  type CrashRoundData,
  type CrashHistoryItem,
} from '@/actions/crash-game';
import MultiplierDisplay from '@/components/native/crash-game/MultiplierDisplay';
import BettingPanel from '@/components/native/crash-game/BettingPanel';
import CashOutButton from '@/components/native/crash-game/CashOutButton';
import GameResult from '@/components/native/crash-game/GameResult';
import GameHistory from '@/components/native/crash-game/GameHistory';
import LiveFeed from '@/components/native/crash-game/LiveFeed';
import GameBalanceBar from '@/components/native/GameBalanceBar';

type GameState = 'idle' | 'betting' | 'playing' | 'result';

export default function CrashGamePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { refreshCredits } = useCredits();

  // Config
  const [config, setConfig] = useState<CrashGameConfigData | null>(null);

  // Game state
  const [gameState, setGameState] = useState<GameState>('idle');
  const [roundData, setRoundData] = useState<CrashRoundData | null>(null);
  const [loading, setLoading] = useState(false);
  const multiplierRef = useRef(1.00);

  // History
  const [history, setHistory] = useState<CrashHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Refs for avoiding stale closures
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  // Load config and check for active round on mount
  useEffect(() => {
    const init = async () => {
      try {
        const [configData, activeResult, historyData] = await Promise.all([
          getCrashGameConfig(),
          getActiveRound(),
          getUserCrashHistory(20),
        ]);

        setConfig(configData);
        setHistory(historyData);
        setHistoryLoading(false);

        // Restore active round
        if (activeResult.success && activeResult.data) {
          if (activeResult.data.status === 'active') {
            setRoundData(activeResult.data);
            setGameState('playing');
          } else if (activeResult.data.status === 'expired') {
            // Was auto-expired
            setRoundData(activeResult.data);
            setGameState('result');
            refreshCredits();
          }
        }
      } catch (error) {
        console.error('Failed to initialize crash game:', error);
        setHistoryLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start a new game
  const handleStart = useCallback(async (betAmount: number) => {
    setLoading(true);
    setGameState('betting');

    try {
      const result = await startCrashRound(betAmount);
      if (result.success && result.data) {
        setRoundData(result.data);
        setGameState('playing');
        refreshCredits();
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
  }, [refreshCredits]);

  // Cash out
  const handleCashOut = useCallback(async () => {
    if (!roundData || gameStateRef.current !== 'playing') return;
    setLoading(true);

    try {
      const result = await cashOutCrashRound(roundData.roundId);
      if (result.success && result.data) {
        setRoundData(result.data);
        setGameState('result');
        refreshCredits();
        // Refresh history
        const historyData = await getUserCrashHistory(20);
        setHistory(historyData);
      } else {
        alert(result.error || 'Failed to cash out');
      }
    } catch (error) {
      console.error('Cash out error:', error);
      alert('Failed to cash out');
    } finally {
      setLoading(false);
    }
  }, [roundData, refreshCredits]);

  // Handle crash (multiplier exceeded crashPoint on client)
  const handleCrash = useCallback(async () => {
    if (!roundData || gameStateRef.current !== 'playing') return;

    try {
      const result = await expireCrashRound(roundData.roundId);
      if (result.success && result.data) {
        setRoundData(result.data);
        setGameState('result');
        refreshCredits();
        const historyData = await getUserCrashHistory(20);
        setHistory(historyData);
      }
    } catch (error) {
      console.error('Expire error:', error);
    }
  }, [roundData, refreshCredits]);

  // Play again
  const handlePlayAgain = useCallback(() => {
    setRoundData(null);
    multiplierRef.current = 1.00;
    setGameState('idle');
  }, []);

  // Determine display state
  const displayState = gameState === 'playing'
    ? 'playing'
    : gameState === 'result'
    ? (roundData?.status === 'cashed_out' ? 'win' : 'lose')
    : 'idle';

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-400 border-t-transparent" />
      </div>
    );
  }

  if (!config.enabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <div className="text-4xl mb-4">🚀</div>
        <h2 className="text-xl font-bold text-white mb-2">{t('native.crashGame.title')}</h2>
        <p className="text-white/60">{t('native.crashGame.disabled')}</p>
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
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-slate-950/80 backdrop-blur-lg border-b border-white/5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-white/60 hover:text-white transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-white">{t('native.crashGame.title')}</h1>
        </div>
        <div className="relative">
          <LiveFeed />
        </div>
      </div>

      {/* Balance Bar - always visible at top */}
      <GameBalanceBar />

      {/* Multiplier Display - always visible */}
      <MultiplierDisplay
        active={gameState === 'playing'}
        speed={roundData?.speed ?? config.speed}
        startedAt={roundData?.startedAt ?? ''}
        maxDurationSeconds={config.maxDurationSeconds}
        crashPoint={roundData?.crashPoint}
        onCrash={handleCrash}
        onExpire={handleCrash}
        onMultiplierUpdate={(m: number) => { multiplierRef.current = m; }}
        displayState={displayState}
        finalMultiplier={roundData?.cashOutMultiplier ?? roundData?.crashPoint}
      />

      {/* Bottom section based on state */}
      {gameState === 'idle' && (
        <BettingPanel
          minBet={config.minBet}
          maxBet={config.maxBet}
          loading={loading}
          onStart={handleStart}
        />
      )}

      {gameState === 'betting' && (
        <div className="px-4 pb-4">
          <div className="w-full rounded-xl bg-white/10 py-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-400 border-t-transparent mx-auto mb-2" />
            <span className="text-white/60 text-sm">{t('native.crashGame.placing')}</span>
          </div>
        </div>
      )}

      {gameState === 'playing' && (
        <>
          <CashOutButton
            betAmount={roundData?.betAmount ?? 0}
            loading={loading}
            onCashOut={handleCashOut}
          />
          {/* Seed hash shown DURING game for provably fair commitment */}
          {roundData?.seedHash && (
            <div className="mx-4 mb-3 rounded-lg bg-white/5 border border-white/10 px-3 py-2">
              <p className="text-[10px] text-white/30 mb-0.5">SHA-256 Hash (pre-committed)</p>
              <p className="text-[11px] text-white/50 font-mono break-all leading-tight">{roundData.seedHash}</p>
            </div>
          )}
        </>
      )}

      {gameState === 'result' && roundData && (
        <GameResult
          status={roundData.status as 'cashed_out' | 'crashed' | 'expired'}
          betAmount={roundData.betAmount}
          crashPoint={roundData.crashPoint!}
          cashOutMultiplier={roundData.cashOutMultiplier ?? undefined}
          profit={roundData.profit ?? -roundData.betAmount}
          seed={roundData.seed!}
          seedHash={roundData.seedHash}
          onPlayAgain={handlePlayAgain}
        />
      )}

      {/* History */}
      <GameHistory history={history} loading={historyLoading} />
    </div>
  );
}
