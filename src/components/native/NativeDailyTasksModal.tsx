/**
 * Native Daily Tasks Modal
 * 原生 App 版本的每日任务弹窗
 * - 深色主题适配
 * - 积分加到永久积分
 */
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useDailyTasks } from '@/hooks/useDailyTasks';
import { formatCredits } from '@/utils/formatCredits';
import Image from 'next/image';
import EnergyOrb from '@/components/common/EnergyOrb';
import { getMiningEconomyConfig } from '@/config/appConfig';
import LoginModal from './LoginModal';

// 广告加载超时时间（毫秒）
const AD_LOADING_TIMEOUT = 30000;

interface NativeDailyTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreditsUpdated?: () => void;
}

// Icons
const CloseIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const PlayIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const LoaderIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 4v6h-6M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
  </svg>
);

export default function NativeDailyTasksModal({ isOpen, onClose, onCreditsUpdated }: NativeDailyTasksModalProps) {
  const { t } = useLanguage();
  const { user } = useFirebaseAuth();
  const {
    status,
    config,
    claiming,
    doCheckin,
    doClaimAdReward,
    markPopupShown,
    refresh,
    cancelClaiming,
  } = useDailyTasks();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginPromptAction, setLoginPromptAction] = useState<'checkin' | 'ad' | null>(null);
  const [lastClaimedCredits, setLastClaimedCredits] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [adLoading, setAdLoading] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);
  const [checkinError, setCheckinError] = useState<string | null>(null);
  const [pendingRetry, setPendingRetry] = useState<'checkin' | 'ad' | null>(null);
  const cancelledRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 24 小时内是否已跳过登录提示
  const LOGIN_DISMISS_KEY = 'mining_login_dismissed_at';
  const isLoginDismissedRecently = useCallback(() => {
    try {
      const ts = localStorage.getItem(LOGIN_DISMISS_KEY);
      if (!ts) return false;
      return Date.now() - parseInt(ts, 10) < 24 * 60 * 60 * 1000;
    } catch { return false; }
  }, []);

  const dismissLogin = useCallback(() => {
    try { localStorage.setItem(LOGIN_DISMISS_KEY, Date.now().toString()); } catch {}
  }, []);

  // 未登录时拦截操作，24 小时内跳过提示
  const requireLoginOrProceed = useCallback((action: 'checkin' | 'ad', proceed: () => void) => {
    if (user || isLoginDismissedRecently()) {
      proceed();
    } else {
      setLoginPromptAction(action);
    }
  }, [user, isLoginDismissedRecently]);

  // 登录成功后自动执行之前被拦截的操作
  useEffect(() => {
    if (user && showLoginModal) {
      setShowLoginModal(false);
      setLoginPromptAction(null);
      refresh();
    }
  }, [user, showLoginModal, refresh]);

  // 关闭弹窗时标记已显示
  const handleClose = useCallback(() => {
    markPopupShown();
    setLoginPromptAction(null);
    onClose();
  }, [markPopupShown, onClose]);

  // 清理超时定时器
  const clearAdTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // 取消加载
  const handleCancelLoading = useCallback((type: 'checkin' | 'ad') => {
    cancelledRef.current = true;
    clearAdTimeout();
    cancelClaiming();
    if (type === 'checkin') {
      setCheckinLoading(false);
      setCheckinError(t('dailyTasks.cancelled') || 'Cancelled');
      setPendingRetry('checkin');
    } else {
      setAdLoading(false);
      setAdError(t('dailyTasks.cancelled') || 'Cancelled');
      setPendingRetry('ad');
    }
    setTimeout(() => {
      if (type === 'checkin') setCheckinError(null);
      else setAdError(null);
    }, 5000);
  }, [t, clearAdTimeout, cancelClaiming]);

  // 处理签到
  const handleCheckin = useCallback(async () => {
    if (checkinLoading || claiming) return;

    cancelledRef.current = false;
    setCheckinError(null);
    setCheckinLoading(true);
    setPendingRetry(null);

    clearAdTimeout();
    timeoutRef.current = setTimeout(() => {
      if (checkinLoading && !cancelledRef.current) {
        cancelledRef.current = true;
        setCheckinLoading(false);
        setCheckinError(t('dailyTasks.timeout') || 'Timeout, please retry');
        setPendingRetry('checkin');
      }
    }, AD_LOADING_TIMEOUT);

    try {
      const result = await doCheckin();
      if (cancelledRef.current) return;
      clearAdTimeout();

      if (result.success && result.credits) {
        setLastClaimedCredits(result.credits!);
        setShowCelebration(true);
        onCreditsUpdated?.();
      } else if (!result.success) {
        setCheckinError(result.message || 'Check-in failed');
        setPendingRetry('checkin');
        setTimeout(() => setCheckinError(null), 5000);
      }
    } catch (err) {
      if (cancelledRef.current) return;
      clearAdTimeout();
      setCheckinError(err instanceof Error ? err.message : 'Check-in failed');
      setPendingRetry('checkin');
      setTimeout(() => setCheckinError(null), 5000);
    } finally {
      if (!cancelledRef.current) setCheckinLoading(false);
    }
  }, [checkinLoading, claiming, doCheckin, onCreditsUpdated, t, clearAdTimeout]);

  // 处理看广告
  const handleWatchAd = useCallback(async () => {
    if (adLoading || claiming) return;

    cancelledRef.current = false;
    setAdError(null);
    setAdLoading(true);
    setPendingRetry(null);

    clearAdTimeout();
    timeoutRef.current = setTimeout(() => {
      if (adLoading && !cancelledRef.current) {
        cancelledRef.current = true;
        setAdLoading(false);
        setAdError(t('dailyTasks.timeout') || 'Timeout, please retry');
        setPendingRetry('ad');
      }
    }, AD_LOADING_TIMEOUT);

    try {
      const result = await doClaimAdReward();
      if (cancelledRef.current) return;
      clearAdTimeout();

      if (result.success && result.credits) {
        setLastClaimedCredits(result.credits!);
        setShowCelebration(true);
        onCreditsUpdated?.();
      } else if (!result.success) {
        setAdError(result.message || 'Claim failed');
        setPendingRetry('ad');
        setTimeout(() => setAdError(null), 5000);
      }
    } catch (err) {
      if (cancelledRef.current) return;
      clearAdTimeout();
      setAdError(err instanceof Error ? err.message : 'Ad failed');
      setPendingRetry('ad');
      setTimeout(() => setAdError(null), 5000);
    } finally {
      if (!cancelledRef.current) setAdLoading(false);
    }
  }, [adLoading, claiming, doClaimAdReward, onCreditsUpdated, t, clearAdTimeout]);

  // 重试
  const handleRetry = useCallback(() => {
    const retryType = pendingRetry;
    setPendingRetry(null);
    if (retryType === 'checkin') handleCheckin();
    else if (retryType === 'ad') handleWatchAd();
  }, [pendingRetry, handleCheckin, handleWatchAd]);

  // 庆祝效果完成
  const handleCelebrationComplete = useCallback(() => {
    setShowCelebration(false);
    setLastClaimedCredits(null);
  }, []);

  if (!isOpen) return null;

  const isDisabled = config && !config.enabled;

  const isStatusLoading = !status;

  // Skeleton placeholder
  const Skeleton = ({ className = '' }: { className?: string }) => (
    <div className={`animate-pulse bg-white/10 rounded ${className}`} />
  );

  // 渲染任务内容
  const renderLoggedInContent = () => {
    return (
      <div>
        {/* Header: VOICICA logo + title */}
        <div className="text-center mb-3">
          <h3 className="text-lg font-bold text-white flex items-center justify-center gap-2">
            <Image src="/logo/voicica-token.png" alt="VOICICA" width={40} height={40} className="w-10 h-10" />
            {t('dailyTasks.title')}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">{t('dailyTasks.subtitle')}</p>
        </div>

        {/* Mining Power status indicator */}
        <div className="flex items-center justify-between mb-4 px-1">
          <span className="text-xs text-gray-400">{t('dailyTasks.miningPower')}</span>
          <span className="flex items-center gap-1.5 text-xs font-medium text-green-400">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            {t('dailyTasks.active')}
          </span>
        </div>

        {/* Daily Activation (check-in) */}
        <div className="border border-white/10 rounded-xl p-3 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${
              isStatusLoading ? 'bg-white/5' : status.checkinDone ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
            }`}>
              {isStatusLoading ? <Skeleton className="w-4 h-4 rounded" /> : status.checkinDone ? <CheckIcon /> : <PlayIcon />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white text-sm">{t('dailyTasks.checkin')}</p>
              <p className="text-xs text-gray-400">+{formatCredits(config?.checkin_credits || 0)} {t('dailyTasks.credits')}</p>
            </div>
          </div>

          {checkinError && (
            <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 text-center">
              {checkinError}
            </div>
          )}

          {isStatusLoading ? (
            <Skeleton className="w-full h-11 rounded-xl" />
          ) : (
            <button
              onClick={() => requireLoginOrProceed('checkin', handleCheckin)}
              disabled={status.checkinDone || claiming || checkinLoading}
              className={`w-full py-3 font-medium rounded-xl flex items-center justify-center gap-2 text-sm ${
                status.checkinDone
                  ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                  : 'border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 disabled:opacity-50'
              }`}
            >
              {(claiming || checkinLoading) ? (
                <>
                  <LoaderIcon className="w-5 h-5" />
                  <span>{t('dailyTasks.loadingAd') || 'Loading...'}</span>
                </>
              ) : status.checkinDone ? (
                t('dailyTasks.claimed')
              ) : (
                <>
                  <PlayIcon />
                  {t('dailyTasks.watchCheckinGet', { credits: config?.checkin_credits || 0 })}
                </>
              )}
            </button>
          )}
        </div>

        {/* Video Mining */}
        <div className="border border-white/10 rounded-xl p-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 shrink-0 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
              <PlayIcon />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white text-sm">{t('dailyTasks.watchAds')}</p>
              <p className="text-xs text-gray-400">
                {t('dailyTasks.watchMultiple')}
              </p>
            </div>
          </div>

          {/* Energy orb animation */}
          <div className="flex justify-center mb-4">
            <EnergyOrb />
          </div>

          {/* 进度 + 收益 */}
          <div className="flex items-center justify-between mb-1 px-1">
            {isStatusLoading ? (
              <>
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-28" />
              </>
            ) : (
              <>
                <span className="text-xs text-gray-400">
                  {status.adRewardsClaimed} / {status.maxDailyAdViews} {t('dailyTasks.viewsToday') || 'views today'}
                </span>
                <span className="text-xs text-amber-400 font-medium">
                  +{formatCredits(status.adRewardsCredits)} $VOICICA
                </span>
              </>
            )}
          </div>
          {!isStatusLoading && status.adRewardsCredits > 0 && (
            <p className="text-[10px] text-gray-500 text-right px-1 mb-3">
              ≈ ${(status.adRewardsCredits * getMiningEconomyConfig().token_value_usd).toFixed(4)} USD
            </p>
          )}

          {adError && (
            <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 text-center">
              {adError}
            </div>
          )}

          {isStatusLoading ? (
            <Skeleton className="w-full h-12 rounded-xl" />
          ) : status.remainingAdViews > 0 ? (
            <button
              onClick={() => requireLoginOrProceed('ad', handleWatchAd)}
              disabled={claiming || adLoading}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {(claiming || adLoading) ? (
                <>
                  <LoaderIcon className="w-5 h-5" />
                  <span>{t('dailyTasks.loadingAd') || 'Loading ad...'}</span>
                </>
              ) : (
                <>
                  <PlayIcon />
                  {t('dailyTasks.startMining') || 'Start Mining'}
                </>
              )}
            </button>
          ) : (
            <div className="w-full py-3 bg-white/5 text-gray-500 font-medium rounded-xl text-center text-sm">
              {t('dailyTasks.dailyLimitReached') || 'Daily limit reached'}
            </div>
          )}
        </div>
      </div>
    );
  };

  const modalContent = (
    <>
      {/* 加载覆盖层 */}
      {(adLoading || checkinLoading) && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-[10001]">
          <div className="bg-gray-900 rounded-2xl p-8 flex flex-col items-center shadow-2xl min-w-[280px] border border-white/10">
            <LoaderIcon className="w-12 h-12 text-purple-500 mb-4" />
            <p className="text-white font-medium">{t('dailyTasks.loadingAd') || 'Loading ad...'}</p>
            <p className="text-gray-400 text-sm mt-1">{t('dailyTasks.pleaseWait') || 'Please wait'}</p>
            <button
              onClick={() => handleCancelLoading(checkinLoading ? 'checkin' : 'ad')}
              className="mt-6 px-6 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm"
            >
              {t('dailyTasks.cancel') || 'Cancel'}
            </button>
          </div>
        </div>
      )}

      {/* 重试覆盖层 */}
      {pendingRetry && !adLoading && !checkinLoading && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-[10001]">
          <div className="bg-gray-900 rounded-2xl p-8 flex flex-col items-center shadow-2xl min-w-[280px] border border-white/10">
            <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center mb-4 text-orange-400">
              <RefreshIcon />
            </div>
            <p className="text-white font-medium">
              {pendingRetry === 'checkin' ? (checkinError || t('dailyTasks.loadFailed')) : (adError || t('dailyTasks.loadFailed'))}
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setPendingRetry(null)}
                className="px-5 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm"
              >
                {t('dailyTasks.close') || 'Close'}
              </button>
              <button
                onClick={handleRetry}
                className="px-5 py-2 bg-purple-600 text-white rounded-lg text-sm flex items-center gap-2"
              >
                <RefreshIcon />
                {t('dailyTasks.retry') || 'Retry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 主弹窗 */}
      <div
        className={`fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all z-[10000] ${
          (adLoading || checkinLoading || pendingRetry) ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        onClick={handleClose}
      >
        <div
          className="relative w-full max-w-[420px] mx-4 bg-gray-900 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto border border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10"
          >
            <CloseIcon />
          </button>

          <div className="p-6">
            {isDisabled ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-sm text-gray-400">{t('dailyTasks.disabled') || 'Daily tasks not available'}</p>
              </div>
            ) : isStatusLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-10 h-10 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin mb-4" />
                <p className="text-sm text-gray-400">{t('common.loading') || 'Loading...'}</p>
              </div>
            ) : renderLoggedInContent()}
          </div>

        </div>
      </div>

      {/* 操作时登录提示（未登录且 24h 内未跳过） */}
      {loginPromptAction && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-[10001]"
          onClick={() => setLoginPromptAction(null)}
        >
          <div
            className="bg-gray-900 rounded-2xl p-6 mx-4 max-w-[360px] w-full border border-white/10 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 mx-auto">
              <svg className="w-8 h-8 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
              </svg>
            </div>
            <h4 className="text-white font-bold text-lg mb-2">{t('dailyTasks.guestPrompt.title')}</h4>
            <p className="text-gray-400 text-sm leading-relaxed mb-6 px-2">
              {t('dailyTasks.guestPrompt.desc')}
            </p>
            <button
              onClick={() => {
                setLoginPromptAction(null);
                setShowLoginModal(true);
              }}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-xl mb-3 active:scale-[0.97] transition-transform"
            >
              {t('dailyTasks.guestPrompt.login')}
            </button>
            <button
              onClick={() => {
                dismissLogin();
                const action = loginPromptAction;
                setLoginPromptAction(null);
                // 跳过后直接执行操作
                if (action === 'checkin') handleCheckin();
                else if (action === 'ad') handleWatchAd();
              }}
              className="w-full py-3 border border-white/10 text-gray-400 font-medium rounded-xl hover:bg-white/5 transition-colors"
            >
              {t('dailyTasks.guestPrompt.continueAsGuest')}
            </button>
          </div>
        </div>
      )}

      {/* 登录弹窗 */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      {/* 庆祝效果 */}
      {showCelebration && lastClaimedCredits !== null && (
        <div className="fixed inset-0 z-[10002] flex items-center justify-center pointer-events-none">
          <div className="bg-gray-900/95 backdrop-blur-sm rounded-2xl p-8 text-center border border-purple-500/30 pointer-events-auto animate-bounce-in">
            {/* sparkles 围绕 emoji */}
            <div className="relative inline-block mb-4">
              <div className="text-5xl">🎉</div>
              <span className="absolute -top-2 -left-3 text-lg animate-ping">✨</span>
              <span className="absolute -top-1 -right-3 text-sm animate-ping" style={{ animationDelay: '0.2s' }}>⭐</span>
              <span className="absolute -bottom-1 -left-2 text-sm animate-ping" style={{ animationDelay: '0.4s' }}>🌟</span>
              <span className="absolute -bottom-2 -right-2 text-lg animate-ping" style={{ animationDelay: '0.6s' }}>✨</span>
            </div>
            <p className="text-white text-lg font-bold mb-2">+{lastClaimedCredits} $VOICICA</p>
            <p className="text-gray-400 text-sm">{t('dailyTasks.creditsClaimed') || '$VOICICA mined successfully!'}</p>
            <button
              onClick={handleCelebrationComplete}
              className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium"
            >
              {t('common.ok') || 'OK'}
            </button>
          </div>
        </div>
      )}
    </>
  );

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
