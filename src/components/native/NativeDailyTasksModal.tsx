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
import { useRouter } from 'next/navigation';
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

const GiftIcon = () => (
  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="8" width="18" height="13" rx="2" />
    <path d="M12 8v13M3 12h18M7.5 8a2.5 2.5 0 010-5C9 3 12 6 12 8M16.5 8a2.5 2.5 0 000-5C15 3 12 6 12 8" />
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

const CrownIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2 19h20v2H2v-2zm2-4l-2-9 6 4 4-7 4 7 6-4-2 9H4z" />
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
  const router = useRouter();
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
  const [lastClaimedCredits, setLastClaimedCredits] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [adLoading, setAdLoading] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);
  const [checkinError, setCheckinError] = useState<string | null>(null);
  const [pendingRetry, setPendingRetry] = useState<'checkin' | 'ad' | null>(null);
  const cancelledRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 登录成功后刷新状态
  useEffect(() => {
    if (user && showLoginModal) {
      setShowLoginModal(false);
      refresh();
    }
  }, [user, showLoginModal, refresh]);

  // 关闭弹窗时标记已显示
  const handleClose = useCallback(() => {
    markPopupShown();
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
        setTimeout(() => {
          setLastClaimedCredits(result.credits!);
          setShowCelebration(true);
        }, 300);
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
  const handleWatchAd = useCallback(async (bonusMode: boolean = false) => {
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
      const result = await doClaimAdReward(bonusMode);
      if (cancelledRef.current) return;
      clearAdTimeout();

      if (result.success && result.credits) {
        setTimeout(() => {
          setLastClaimedCredits(result.credits!);
          setShowCelebration(true);
        }, 500);
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

  // 前往订阅页
  const handleUpgrade = () => {
    handleClose();
    router.push('/native/subscribe');
  };

  if (!isOpen) return null;

  const isConfigLoading = !config;
  const isDisabled = config && !config.enabled;
  const formatCredits = (credits: number) => credits.toLocaleString();

  // 渲染未登录内容
  const renderGuestContent = () => {
    const totalAdCredits = config?.ad_reward_tiers?.reduce((a, b) => a + b, 0) || 0;

    return (
      <div>
        <div className="text-center mb-5">
          <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <GiftIcon />
          </div>
          <h3 className="text-xl font-bold text-white">{t('dailyTasks.title')}</h3>
          <p className="text-sm text-gray-400">{t('dailyTasks.loginToEarn')}</p>
        </div>

        <div className="space-y-3 mb-3">
          {/* 签到 */}
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <PlayIcon />
              </div>
              <div>
                <p className="font-medium text-white">{t('dailyTasks.checkin')}</p>
                <p className="text-xs text-gray-400">+{formatCredits(config?.checkin_credits || 0)} {t('dailyTasks.credits')}</p>
              </div>
            </div>
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-4 py-2 bg-purple-600 text-white font-medium text-sm rounded-lg flex items-center gap-1.5"
            >
              <PlayIcon />
              {t('dailyTasks.watchCheckinGet', { credits: formatCredits(config?.checkin_credits || 0) })}
            </button>
          </div>

          {/* 看视频 */}
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                <PlayIcon />
              </div>
              <div>
                <p className="font-medium text-white">{t('dailyTasks.watchAds')}</p>
                <p className="text-xs text-gray-400">+{formatCredits(totalAdCredits)} {t('dailyTasks.credits')}</p>
              </div>
            </div>
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-4 py-2 bg-green-600 text-white font-medium text-sm rounded-lg"
            >
              {t('dailyTasks.claim')}
            </button>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-3 text-center">
          <span className="text-sm text-gray-400">{t('dailyTasks.dailyMax')}: </span>
          <span className="text-lg font-bold text-purple-400">
            {formatCredits((config?.checkin_credits || 0) + totalAdCredits)} {t('dailyTasks.credits')}
          </span>
        </div>
      </div>
    );
  };

  // 渲染已登录内容
  const renderLoggedInContent = () => {
    if (!status) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <LoaderIcon className="w-8 h-8 text-purple-500 mb-3" />
          <p className="text-sm text-gray-400">{t('common.loading') || 'Loading...'}</p>
        </div>
      );
    }

    const adTiers = config?.ad_reward_tiers || [];
    const totalAdCredits = adTiers.reduce((sum, v) => sum + v, 0);

    return (
      <div>
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white">
            <GiftIcon />
          </div>
          <h3 className="text-xl font-bold text-white">{t('dailyTasks.title')}</h3>
          <p className="text-sm text-gray-400">{t('dailyTasks.subtitle')}</p>
        </div>

        {/* 今日进度 */}
        <div className="bg-white/5 rounded-xl p-4 mb-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">{t('dailyTasks.todayEarned')}</span>
            <span className="font-semibold text-purple-400">
              {formatCredits(status.todayTotalCredits)} / {formatCredits(status.todayMaxCredits)}
            </span>
          </div>
          <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
              style={{ width: `${(status.todayTotalCredits / status.todayMaxCredits) * 100}%` }}
            />
          </div>
        </div>

        {/* 签到任务 */}
        <div className="border border-white/10 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${
                status.checkinDone ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400'
              }`}>
                {status.checkinDone ? <CheckIcon /> : <PlayIcon />}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-white truncate">{t('dailyTasks.checkin')}</p>
                <p className="text-sm text-gray-400">+{formatCredits(config?.checkin_credits || 0)} {t('dailyTasks.credits')}</p>
              </div>
            </div>
            <button
              onClick={handleCheckin}
              disabled={status.checkinDone || claiming || checkinLoading}
              className={`shrink-0 px-3 py-2 rounded-lg font-medium text-sm flex items-center gap-1.5 whitespace-nowrap ${
                status.checkinDone
                  ? 'bg-white/10 text-gray-500 cursor-not-allowed'
                  : 'bg-purple-600 text-white disabled:opacity-50'
              }`}
            >
              {(claiming || checkinLoading) ? (
                <LoaderIcon className="w-4 h-4" />
              ) : status.checkinDone ? (
                t('dailyTasks.claimed')
              ) : (
                <>
                  <PlayIcon />
                  <span>+{config?.checkin_credits || 0}</span>
                </>
              )}
            </button>
          </div>
          {checkinError && (
            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 text-center">
              {checkinError}
            </div>
          )}
        </div>

        {/* 看广告任务 */}
        <div className="border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                <PlayIcon />
              </div>
              <div>
                <p className="font-medium text-white">{t('dailyTasks.watchAds')}</p>
                <p className="text-sm text-gray-400">
                  {formatCredits(status.adRewardsCredits)} / {formatCredits(totalAdCredits)} {t('dailyTasks.credits')}
                </p>
              </div>
            </div>
          </div>

          {/* 档位进度 */}
          <div className="flex gap-1.5 mb-4">
            {adTiers.map((tier, index) => {
              const isClaimed = index < status.adRewardsClaimed;
              const isNext = index === status.adRewardsClaimed;
              return (
                <div
                  key={index}
                  className={`flex-1 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                    isClaimed
                      ? 'bg-green-500 text-white'
                      : isNext
                      ? 'bg-purple-500/20 text-purple-400 border-2 border-purple-500/50'
                      : 'bg-white/10 text-gray-500'
                  }`}
                >
                  {isClaimed ? <CheckIcon /> : tier}
                </div>
              );
            })}
          </div>

          {adError && (
            <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 text-center">
              {adError}
            </div>
          )}

          {status.nextAdReward !== null ? (
            <button
              onClick={() => handleWatchAd(false)}
              disabled={claiming || adLoading}
              className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {(claiming || adLoading) ? (
                <>
                  <LoaderIcon className="w-5 h-5" />
                  <span>{t('dailyTasks.loadingAd') || 'Loading ad...'}</span>
                </>
              ) : (
                <>
                  <PlayIcon />
                  {t('dailyTasks.watchAdGet', { credits: formatCredits(status.nextAdReward) })}
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => handleWatchAd(true)}
              disabled={claiming || adLoading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {(claiming || adLoading) ? (
                <>
                  <LoaderIcon className="w-5 h-5" />
                  <span>{t('dailyTasks.loadingAd') || 'Loading ad...'}</span>
                </>
              ) : (
                <>
                  <RefreshIcon />
                  {t('dailyTasks.watchMore') || 'Watch More +1'}
                </>
              )}
            </button>
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
            {isConfigLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <LoaderIcon className="w-8 h-8 text-purple-500 mb-3" />
                <p className="text-sm text-gray-400">{t('common.loading') || 'Loading...'}</p>
              </div>
            ) : isDisabled ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-sm text-gray-400">{t('dailyTasks.disabled') || 'Daily tasks not available'}</p>
              </div>
            ) : user ? renderLoggedInContent() : renderGuestContent()}
          </div>

          {!isConfigLoading && !isDisabled && (
            <div className="px-6 pb-5 space-y-4">
              <p className="text-xs text-gray-500 text-center">{t('dailyTasks.resetTip')}</p>

              {/* 会员推广卡片 - 更加醒目 */}
              <button
                onClick={handleUpgrade}
                className="w-full p-4 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-pink-500/20 border border-amber-500/30 hover:from-amber-500/30 hover:via-orange-500/30 hover:to-pink-500/30 transition-all active:scale-[0.98]"
              >
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <CrownIcon />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white">
                      {t('dailyTasks.noAdsTitle') || "Skip the ads, get unlimited!"}
                    </p>
                    <p className="text-xs text-amber-400/80">
                      {t('dailyTasks.noAdsSubtitle') || "Become a VIP member today"}
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 登录弹窗 */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      {/* 庆祝效果 */}
      {showCelebration && lastClaimedCredits !== null && (
        <div className="fixed inset-0 z-[10002] flex items-center justify-center pointer-events-none">
          <div className="bg-gray-900/95 backdrop-blur-sm rounded-2xl p-8 text-center border border-purple-500/30 pointer-events-auto animate-bounce-in">
            <div className="text-5xl mb-4">🎉</div>
            <p className="text-white text-lg font-bold mb-2">+{lastClaimedCredits} Credits!</p>
            <p className="text-gray-400 text-sm">{t('dailyTasks.creditsClaimed') || 'Credits added to your account'}</p>
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
