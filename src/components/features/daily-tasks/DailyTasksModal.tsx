'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Gift, Play, Crown, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useDailyTasks } from '@/hooks/useDailyTasks';
import { useAdsterraSmartLink } from '@/hooks/useAdsterraSmartLink';
import { claimAdReward, checkin } from '@/actions/daily-tasks';
import LoginModal from '@/components/features/auth/LoginModal';
import CelebrationEffect from './CelebrationEffect';
import { Capacitor } from '@capacitor/core';
import { formatCredits } from './utils';
import {
  AdOverlay,
  LoadingOverlay,
  RetryOverlay,
  CheckinTaskCard,
  WatchAdsTaskCard,
  DailyTasksHeader,
  DailyTasksProgress,
} from './components';

// 广告加载超时时间（毫秒）
const AD_LOADING_TIMEOUT = 30000;

interface DailyTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreditsUpdated?: () => void;
  onUpgradeClick?: () => void;
}

type TaskType = 'checkin' | 'ad';

/**
 * 每日任务弹窗组件
 */
export default function DailyTasksModal({
  isOpen,
  onClose,
  onCreditsUpdated,
  onUpgradeClick,
}: DailyTasksModalProps) {
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

  const adsterra = useAdsterraSmartLink();
  const isNative = Capacitor.isNativePlatform();

  // UI 状态
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [lastClaimedCredits, setLastClaimedCredits] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // 加载状态
  const [adLoading, setAdLoading] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(false);

  // 错误状态
  const [adError, setAdError] = useState<string | null>(null);
  const [checkinError, setCheckinError] = useState<string | null>(null);

  // 重试状态
  const [pendingRetry, setPendingRetry] = useState<TaskType | null>(null);

  // Refs
  const cancelledRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 登录成功后刷新
  useEffect(() => {
    if (user && showLoginModal) {
      setShowLoginModal(false);
      refresh();
    }
  }, [user, showLoginModal, refresh]);

  // 关闭弹窗
  const handleClose = useCallback(() => {
    markPopupShown();
    onClose();
  }, [markPopupShown, onClose]);

  // ESC 键关闭
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleClose]);

  // 清理超时定时器
  const clearAdTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // 显示成功效果
  const showSuccess = useCallback((credits: number) => {
    setTimeout(() => {
      setLastClaimedCredits(credits);
      setShowCelebration(true);
    }, 300);
    onCreditsUpdated?.();
  }, [onCreditsUpdated]);

  // 显示错误
  const showError = useCallback((type: TaskType, message: string) => {
    if (type === 'checkin') {
      setCheckinError(message);
    } else {
      setAdError(message);
    }
    setPendingRetry(type);
    setTimeout(() => {
      if (type === 'checkin') {
        setCheckinError(null);
      } else {
        setAdError(null);
      }
    }, 5000);
  }, []);

  // 取消加载
  const handleCancelLoading = useCallback((type: TaskType) => {
    console.log('🚫 [DailyTasks] User cancelled', type);
    cancelledRef.current = true;
    clearAdTimeout();
    cancelClaiming();

    if (type === 'checkin') {
      setCheckinLoading(false);
    } else {
      setAdLoading(false);
    }
    showError(type, t('dailyTasks.cancelled') || '已取消');
  }, [t, clearAdTimeout, cancelClaiming, showError]);

  // Adsterra 广告完成后的处理
  const handleAdsterraComplete = useCallback(async (type: TaskType) => {
    if (cancelledRef.current) return;

    try {
      if (type === 'checkin') {
        const result = await checkin(false);
        if (result.success && result.credits) {
          await refresh();
          showSuccess(result.credits);
        } else {
          showError('checkin', result.message || '签到失败');
        }
      } else {
        const result = await claimAdReward(true, false, false);
        if (result.success && result.credits) {
          await refresh();
          showSuccess(result.credits);
        } else {
          showError('ad', result.message || '领取失败');
        }
      }
    } catch (err) {
      console.error('❌ [DailyTasks] Error:', err);
      showError(type, type === 'checkin' ? '签到失败，请稍后再试' : '领取失败，请稍后再试');
    }
  }, [refresh, showSuccess, showError]);

  // 处理签到
  const handleCheckin = useCallback(async () => {
    if (checkinLoading || claiming || adsterra.isShowing) return;

    cancelledRef.current = false;
    setCheckinError(null);
    setCheckinLoading(true);
    setPendingRetry(null);

    // Web 端使用 Adsterra
    if (!isNative && adsterra.isEnabled) {
      setCheckinLoading(false);
      const adResult = await adsterra.showAd();

      if (cancelledRef.current) return;

      if (adResult.success) {
        await handleAdsterraComplete('checkin');
      } else if (adResult.reason !== 'cancelled') {
        showError('checkin', adResult.message || '广告未完成');
      }
      return;
    }

    // 原生 App
    clearAdTimeout();
    timeoutRef.current = setTimeout(() => {
      if (checkinLoading && !cancelledRef.current) {
        cancelledRef.current = true;
        setCheckinLoading(false);
        showError('checkin', t('dailyTasks.timeout') || '加载超时，请重试');
      }
    }, AD_LOADING_TIMEOUT);

    try {
      const result = await doCheckin();

      if (cancelledRef.current) return;
      clearAdTimeout();

      if (result.success && result.credits) {
        showSuccess(result.credits);
      } else if (!result.success) {
        showError('checkin', result.message || '签到失败');
      }
    } catch (err) {
      if (cancelledRef.current) return;
      clearAdTimeout();
      showError('checkin', err instanceof Error ? err.message : '签到失败，请稍后再试');
    } finally {
      if (!cancelledRef.current) {
        setCheckinLoading(false);
      }
    }
  }, [
    checkinLoading,
    claiming,
    adsterra,
    isNative,
    doCheckin,
    t,
    clearAdTimeout,
    showSuccess,
    showError,
    handleAdsterraComplete,
  ]);

  // 处理看广告
  const handleWatchAd = useCallback(async () => {
    if (adLoading || claiming || adsterra.isShowing) return;

    cancelledRef.current = false;
    setAdError(null);
    setAdLoading(true);
    setPendingRetry(null);

    // Web 端使用 Adsterra
    if (!isNative && adsterra.isEnabled) {
      setAdLoading(false);
      const adResult = await adsterra.showAd();

      if (cancelledRef.current) return;

      if (adResult.success) {
        await handleAdsterraComplete('ad');
      } else if (adResult.reason !== 'cancelled') {
        showError('ad', adResult.message || '广告未完成');
      }
      return;
    }

    // 原生 App
    clearAdTimeout();
    timeoutRef.current = setTimeout(() => {
      if (adLoading && !cancelledRef.current) {
        cancelledRef.current = true;
        setAdLoading(false);
        showError('ad', t('dailyTasks.timeout') || '加载超时，请重试');
      }
    }, AD_LOADING_TIMEOUT);

    try {
      const result = await doClaimAdReward();

      if (cancelledRef.current) return;
      clearAdTimeout();

      if (result.success && result.credits) {
        setTimeout(() => {
          setLastClaimedCredits(result.credits!);
          setShowCelebration(true);
        }, 500);
        onCreditsUpdated?.();
      } else if (!result.success) {
        showError('ad', result.message || '领取失败');
      }
    } catch (err) {
      if (cancelledRef.current) return;
      clearAdTimeout();
      showError('ad', err instanceof Error ? err.message : '广告加载失败，请稍后再试');
    } finally {
      if (!cancelledRef.current) {
        setAdLoading(false);
      }
    }
  }, [
    adLoading,
    claiming,
    adsterra,
    isNative,
    doClaimAdReward,
    t,
    clearAdTimeout,
    onCreditsUpdated,
    showError,
    handleAdsterraComplete,
  ]);

  // 重试
  const handleRetry = useCallback(() => {
    const retryType = pendingRetry;
    setPendingRetry(null);
    if (retryType === 'checkin') {
      handleCheckin();
    } else if (retryType === 'ad') {
      handleWatchAd();
    }
  }, [pendingRetry, handleCheckin, handleWatchAd]);

  // 庆祝完成
  const handleCelebrationComplete = useCallback(() => {
    setShowCelebration(false);
    setLastClaimedCredits(null);
  }, []);

  if (!isOpen) return null;

  const isConfigLoading = !config;
  const isDisabled = config && !config.enabled;
  const isLoading = adLoading || checkinLoading;

  // 渲染未登录内容
  const renderGuestContent = () => {
    const totalAdCredits = config?.ad_reward_tiers?.reduce((a, b) => a + b, 0) || 0;

    return (
      <div>
        <DailyTasksHeader isLoggedIn={false} />

        <div className="space-y-3 mb-3">
          {/* 签到任务预览 */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Play className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{t('dailyTasks.checkin')}</p>
                <p className="text-xs text-gray-500">
                  +{formatCredits(config?.checkin_credits || 0)} {t('dailyTasks.credits')}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-4 py-2 bg-purple-600 text-white font-medium text-sm rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1.5"
            >
              <Play className="w-4 h-4" />
              {t('dailyTasks.watchCheckinGet', { credits: formatCredits(config?.checkin_credits || 0) })}
            </button>
          </div>

          {/* 看广告任务预览 */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Play className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{t('dailyTasks.watchAds')}</p>
                <p className="text-xs text-gray-500">
                  +{formatCredits(totalAdCredits)} {t('dailyTasks.credits')}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-4 py-2 bg-green-600 text-white font-medium text-sm rounded-lg hover:bg-green-700 transition-colors"
            >
              {t('dailyTasks.claim')}
            </button>
          </div>
        </div>

        {/* 总计 */}
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <span className="text-sm text-gray-500">{t('dailyTasks.dailyMax')}: </span>
          <span className="text-lg font-bold text-purple-600">
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
          <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-3" />
          <p className="text-sm text-gray-500">{t('common.loading') || '加载中...'}</p>
        </div>
      );
    }

    return (
      <div>
        <DailyTasksHeader isLoggedIn={true} />

        <DailyTasksProgress
          earnedCredits={status.todayTotalCredits}
          maxCredits={status.todayMaxCredits}
        />

        <CheckinTaskCard
          isDone={status.checkinDone}
          credits={config?.checkin_credits || 0}
          isLoading={claiming || checkinLoading}
          error={checkinError}
          onCheckin={handleCheckin}
        />

        <WatchAdsTaskCard
          adTiers={config?.ad_reward_tiers || []}
          claimedCount={status.adRewardsClaimed}
          earnedCredits={status.adRewardsCredits}
          nextReward={status.nextAdReward}
          isLoading={claiming || adLoading}
          error={adError}
          onWatchAd={handleWatchAd}
        />
      </div>
    );
  };

  const modalContent = (
    <>
      {/* Adsterra 广告覆盖层 */}
      <AdOverlay
        isShowing={adsterra.isShowing}
        remainingSeconds={adsterra.remainingSeconds}
        totalSeconds={adsterra.totalSeconds}
        isCompleted={adsterra.isCompleted}
        isWindowClosed={adsterra.isWindowClosed}
        onCancel={adsterra.cancel}
        onConfirm={adsterra.confirmComplete}
      />

      {/* 加载中覆盖层 */}
      <LoadingOverlay
        isLoading={isLoading && !adsterra.isShowing}
        onCancel={() => handleCancelLoading(checkinLoading ? 'checkin' : 'ad')}
      />

      {/* 重试覆盖层 */}
      <RetryOverlay
        isVisible={!!pendingRetry && !isLoading}
        errorMessage={pendingRetry === 'checkin' ? checkinError : adError}
        onClose={() => setPendingRetry(null)}
        onRetry={handleRetry}
      />

      {/* 主弹窗 */}
      <div
        className={`fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all z-[9998] ${
          isLoading || pendingRetry || adsterra.isShowing ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        onClick={handleClose}
      >
        <div
          className="relative w-full max-w-[420px] mx-4 bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 关闭按钮 */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* 内容 */}
          <div className="p-6">
            {isConfigLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-3" />
                <p className="text-sm text-gray-500">{t('common.loading') || '加载中...'}</p>
              </div>
            ) : isDisabled ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-sm text-gray-500">{t('dailyTasks.disabled') || '每日任务暂未开放'}</p>
              </div>
            ) : user ? (
              renderLoggedInContent()
            ) : (
              renderGuestContent()
            )}
          </div>

          {/* 底部 */}
          {!isConfigLoading && !isDisabled && (
            <div className="px-6 pb-5 text-center space-y-2">
              <p className="text-xs text-gray-400">{t('dailyTasks.resetTip')}</p>

              {onUpgradeClick && (
                <button
                  onClick={() => {
                    handleClose();
                    onUpgradeClick();
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-700 transition-colors"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>{t('dailyTasks.noAdsPromo') || "Don't want to watch ads? Become a member!"}</span>
                </button>
              )}
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
        <CelebrationEffect
          credits={lastClaimedCredits}
          onComplete={handleCelebrationComplete}
        />
      )}
    </>
  );

  return typeof window !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
}
