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
import GameHistorySheet from '@/components/native/crash-game/GameHistorySheet';
import GameRulesSheet from '@/components/native/crash-game/GameRulesSheet';
import ProvablyFairSheet from '@/components/native/crash-game/ProvablyFairSheet';
import GameBalanceBar from '@/components/native/GameBalanceBar';
import InsufficientCreditsModal from '@/components/native/common/InsufficientCreditsModal';
import NativeDailyTasksModal from '@/components/native/NativeDailyTasksModal';
import { DEFAULT_CRASH_SPEED, MAX_GAME_DURATION_SECONDS } from '@/config/native/crashGameConfig';
import { getConversionConfig } from '@/config/appConfig';
import { consumeCrashGamePrefetch } from '@/lib/crashGamePrefetch';
import { Copy } from 'lucide-react';

type GameState = 'idle' | 'betting' | 'playing' | 'result';

export default function CrashGamePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { credits, refreshCredits, deductCredits, updateCredits } = useCredits();

  // Available balance (total minus reserved)
  const { min_voicica_reserve } = getConversionConfig();
  const usableBalance = Math.max(0, Math.floor(credits - min_voicica_reserve));

  // Config
  const [config, setConfig] = useState<CrashGameConfigData | null>(null);

  // Game state
  const [gameState, setGameState] = useState<GameState>('idle');
  const [roundData, setRoundData] = useState<CrashRoundData | null>(null);
  const [loading, setLoading] = useState(false);
  const multiplierRef = useRef(1.00);

  // History & Rules sheets
  const [showHistory, setShowHistory] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showFairness, setShowFairness] = useState(false);
  const [history, setHistory] = useState<CrashHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Insufficient credits modal
  const [showInsufficientCredits, setShowInsufficientCredits] = useState(false);
  const [insufficientInfo, setInsufficientInfo] = useState<{ required: number; current: number } | null>(null);
  const [showDailyTasks, setShowDailyTasks] = useState(false);

  // Refs for avoiding stale closures
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  // Load config and active round (critical path — renders game UI)
  // 优先消费 CrashGameCard 的预加载缓存，无缓存时回退到新请求
  useEffect(() => {
    const init = async () => {
      try {
        const prefetched = consumeCrashGamePrefetch();
        const [configData, activeResult] = await Promise.all([
          prefetched.configPromise ?? getCrashGameConfig(),
          prefetched.activeRoundPromise ?? getActiveRound(),
        ]);

        setConfig(configData);

        // Restore active round
        if (activeResult.success && activeResult.data) {
          if (activeResult.data.status === 'active') {
            setRoundData(activeResult.data);
            setGameState('playing');
          } else if (activeResult.data.status === 'expired') {
            setRoundData(activeResult.data);
            setGameState('result');
            refreshCredits();
          }
        }
      } catch (error) {
        console.error('Failed to initialize crash game:', error);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load history separately (non-blocking, below the fold)
  const refreshHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await getUserCrashHistory(10);
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

  // Start a new game
  const handleStart = useCallback(async (betAmount: number) => {
    // Check usable balance before starting
    const available = Math.max(0, Math.floor(credits - min_voicica_reserve));
    if (betAmount > available) {
      setInsufficientInfo({ required: betAmount, current: available });
      setShowInsufficientCredits(true);
      return;
    }

    setLoading(true);
    setGameState('betting');

    try {
      const result = await startCrashRound(betAmount);
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

  // Cash out
  const handleCashOut = useCallback(async () => {
    if (!roundData || gameStateRef.current !== 'playing') return;
    setLoading(true);

    try {
      const result = await cashOutCrashRound(roundData.roundId);
      if (result.success && result.data) {
        setRoundData(result.data);
        setGameState('result');
        // 乐观更新余额：当前 + profit
        const profit = result.data.profit ?? -roundData.betAmount;
        updateCredits(credits + roundData.betAmount + profit);
        // Refresh history
        const historyData = await getUserCrashHistory(10);
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
  }, [roundData, credits, updateCredits]);

  // Handle crash (multiplier exceeded crashPoint on client)
  const handleCrash = useCallback(async () => {
    if (!roundData || gameStateRef.current !== 'playing') return;

    try {
      const result = await expireCrashRound(roundData.roundId);
      if (result.success && result.data) {
        setRoundData(result.data);
        setGameState('result');
        // 崩盘：betAmount 已在 start 时扣除，无需更新
        const historyData = await getUserCrashHistory(10);
        setHistory(historyData);
      }
    } catch (error) {
      console.error('Expire error:', error);
    }
  }, [roundData]);

  // Play again
  const handlePlayAgain = useCallback(() => {
    setRoundData(null);
    multiplierRef.current = 1.00;
    setGameState('idle');
    refreshCredits();
  }, [refreshCredits]);

  // Determine display state
  const displayState = gameState === 'playing'
    ? 'playing'
    : gameState === 'result'
    ? (roundData?.status === 'cashed_out' ? 'win' : 'lose')
    : 'idle';

  if (config && !config.enabled) {
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
    <>
      <div className="h-dvh flex flex-col overflow-hidden">
        {/* Header */}
        <div
          className="shrink-0 flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-white/5"
          style={{ paddingTop: 'calc(var(--safe-area-inset-top, 0px) + 12px)' }}
        >
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
          {/* History & Rules */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowRules(true)}
              className="flex items-center gap-1 text-xs text-white/40 hover:text-white/60 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Rules
            </button>
            <button
              onClick={() => { refreshHistory(); setShowHistory(true); }}
              className="flex items-center gap-1 text-xs text-white/40 hover:text-white/60 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History
            </button>
          </div>
        </div>

        {/* Balance Bar */}
        <div className="shrink-0">
          <GameBalanceBar />
        </div>

        {/* Multiplier Display — fills remaining game area */}
        <div className="flex-1 flex items-center justify-center min-h-0">
          <MultiplierDisplay
            active={gameState === 'playing'}
            speed={roundData?.speed ?? config?.speed ?? DEFAULT_CRASH_SPEED}
            startedAt={roundData?.startedAt ?? ''}
            maxDurationSeconds={config?.maxDurationSeconds ?? MAX_GAME_DURATION_SECONDS}
            crashPoint={roundData?.crashPoint}
            onCrash={handleCrash}
            onExpire={handleCrash}
            onMultiplierUpdate={(m: number) => { multiplierRef.current = m; }}
            displayState={displayState}
            finalMultiplier={roundData?.cashOutMultiplier ?? roundData?.crashPoint}
          />
        </div>

        {/* Game controls */}
        <div className="shrink-0" style={{ paddingBottom: 'var(--safe-area-inset-bottom, 0px)' }}>
          {gameState === 'idle' && (
            <BettingPanel
              minBet={config?.minBet ?? 1}
              maxBet={config?.maxBet ?? 1000}
              usableBalance={usableBalance}
              loading={loading || !config}
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
              {roundData?.seedHash && (
                <div className="mx-4 mb-3 rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-[10px] text-white/30">SHA-256 Hash (pre-committed)</p>
                    <button
                      onClick={() => { navigator.clipboard.writeText(roundData.seedHash); }}
                      className="text-white/30 hover:text-white/60 transition-colors p-0.5"
                      aria-label="Copy hash"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
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
              onPlayAgain={handlePlayAgain}
              onShowFairness={() => setShowFairness(true)}
            />
          )}
        </div>
      </div>

      {/* Bottom Sheets */}
      <GameHistorySheet
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        history={history}
        loading={historyLoading}
      />
      <GameRulesSheet
        isOpen={showRules}
        onClose={() => setShowRules(false)}
      />
      {roundData && (
        <ProvablyFairSheet
          isOpen={showFairness}
          onClose={() => setShowFairness(false)}
          seed={roundData.seed!}
          seedHash={roundData.seedHash}
          crashPoint={roundData.crashPoint!}
        />
      )}

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
    </>
  );
}
