'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Gift, Check, Loader2, Play } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useDailyTasks } from '@/hooks/useDailyTasks';
import LoginModal from '@/components/features/auth/LoginModal';

interface DailyTasksModalProps {
  /** 是否显示 */
  isOpen: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 积分更新回调 */
  onCreditsUpdated?: () => void;
}

/**
 * 每日任务弹窗组件
 */
export default function DailyTasksModal({ isOpen, onClose, onCreditsUpdated }: DailyTasksModalProps) {
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
  } = useDailyTasks();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [lastClaimedCredits, setLastClaimedCredits] = useState<number | null>(null);

  // 标记弹窗已显示
  useEffect(() => {
    if (isOpen) {
      markPopupShown();
    }
  }, [isOpen, markPopupShown]);

  // 登录成功后刷新状态
  useEffect(() => {
    if (user && showLoginModal) {
      setShowLoginModal(false);
      refresh();
    }
  }, [user, showLoginModal, refresh]);

  // 按 ESC 键关闭
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // 处理签到
  const handleCheckin = async () => {
    const result = await doCheckin();
    if (result.success && result.credits) {
      setLastClaimedCredits(result.credits);
      onCreditsUpdated?.();
      // 2秒后清除提示
      setTimeout(() => setLastClaimedCredits(null), 2000);
    }
  };

  // 处理看广告领奖励
  const handleWatchAd = async () => {
    // TODO: 第二阶段接入真实广告
    // 目前模拟：点击即成功
    const result = await doClaimAdReward();
    if (result.success && result.credits) {
      setLastClaimedCredits(result.credits);
      onCreditsUpdated?.();
      setTimeout(() => setLastClaimedCredits(null), 2000);
    }
  };

  if (!isOpen || !config?.enabled) return null;

  // 格式化积分数字
  const formatCredits = (credits: number) => {
    return credits.toLocaleString();
  };

  // 渲染未登录状态
  const renderGuestContent = () => {
    const totalAdCredits = config?.ad_reward_tiers?.reduce((a, b) => a + b, 0) || 0;

    return (
      <div>
        {/* 标题 */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Gift className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            {t('dailyTasks.title')}
          </h3>
          <p className="text-sm text-gray-500">
            {t('dailyTasks.loginToEarn')}
          </p>
        </div>

        {/* 任务列表预览 */}
        <div className="space-y-3 mb-3">
          {/* 签到任务 */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Gift className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{t('dailyTasks.checkin')}</p>
                <p className="text-xs text-gray-500">+{formatCredits(config?.checkin_credits || 0)} {t('dailyTasks.credits')}</p>
              </div>
            </div>
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-4 py-2 bg-purple-600 text-white font-medium text-sm rounded-lg hover:bg-purple-700 transition-colors"
            >
              {t('dailyTasks.claim')}
            </button>
          </div>

          {/* 观看视频任务 */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Play className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{t('dailyTasks.watchAds')}</p>
                <p className="text-xs text-gray-500">+{formatCredits(totalAdCredits)} {t('dailyTasks.credits')}</p>
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

  // 渲染已登录状态
  const renderLoggedInContent = () => {
    if (!status) return null;

    const adTiers = config?.ad_reward_tiers || [];
    const totalAdCredits = adTiers.reduce((sum, v) => sum + v, 0);

    return (
      <div>
        {/* 标题 */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Gift className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            {t('dailyTasks.title')}
          </h3>
          <p className="text-sm text-gray-500">
            {t('dailyTasks.subtitle')}
          </p>
        </div>

        {/* 今日进度 */}
        <div className="bg-gray-50 rounded-xl p-4 mb-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{t('dailyTasks.todayEarned')}</span>
            <span className="font-semibold text-purple-600">
              {formatCredits(status.todayTotalCredits)} / {formatCredits(status.todayMaxCredits)}
            </span>
          </div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
              style={{ width: `${(status.todayTotalCredits / status.todayMaxCredits) * 100}%` }}
            />
          </div>
        </div>

        {/* 签到任务 */}
        <div className="border border-gray-200 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                status.checkinDone ? 'bg-green-100' : 'bg-purple-100'
              }`}>
                {status.checkinDone ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <Gift className="w-5 h-5 text-purple-600" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">{t('dailyTasks.checkin')}</p>
                <p className="text-sm text-gray-500">+{formatCredits(config?.checkin_credits || 0)} {t('dailyTasks.credits')}</p>
              </div>
            </div>
            <button
              onClick={handleCheckin}
              disabled={status.checkinDone || claiming}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                status.checkinDone
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {claiming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : status.checkinDone ? (
                t('dailyTasks.claimed')
              ) : (
                t('dailyTasks.claim')
              )}
            </button>
          </div>
        </div>

        {/* 看广告赚积分 */}
        <div className="border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Play className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{t('dailyTasks.watchAds')}</p>
                <p className="text-sm text-gray-500">
                  {formatCredits(status.adRewardsCredits)} / {formatCredits(totalAdCredits)} {t('dailyTasks.credits')}
                </p>
              </div>
            </div>
          </div>

          {/* 广告档位进度 */}
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
                      ? 'bg-purple-100 text-purple-600 border-2 border-purple-300'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {isClaimed ? <Check className="w-3.5 h-3.5" /> : tier}
                </div>
              );
            })}
          </div>

          {/* 看广告按钮 */}
          {status.nextAdReward !== null ? (
            <button
              onClick={handleWatchAd}
              disabled={claiming}
              className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              {claiming ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  {t('dailyTasks.watchAdGet', { credits: formatCredits(status.nextAdReward) })}
                </>
              )}
            </button>
          ) : (
            <div className="w-full py-3 bg-gray-100 text-gray-400 font-semibold rounded-xl text-center">
              {t('dailyTasks.allAdsClaimed')}
            </div>
          )}
        </div>

        {/* 领取成功提示 */}
        {lastClaimedCredits !== null && (
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[10000] pointer-events-none">
            <div className="bg-black/80 text-white px-6 py-3 rounded-xl text-lg font-bold animate-bounce">
              +{formatCredits(lastClaimedCredits)} {t('dailyTasks.credits')}!
            </div>
          </div>
        )}
      </div>
    );
  };

  const modalContent = (
    <>
      <div
        className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-[9998]"
        onClick={onClose}
      >
        {/* 弹窗内容 */}
        <div
          className="relative w-full max-w-[420px] mx-4 bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* 内容区域 */}
          <div className="p-6">
            {user ? renderLoggedInContent() : renderGuestContent()}
          </div>

          {/* 底部提示 */}
          <div className="px-6 pb-5 text-center">
            <p className="text-xs text-gray-400">
              {t('dailyTasks.resetTip')}
            </p>
          </div>
        </div>
      </div>

      {/* 登录弹窗 */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );

  return typeof window !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
}