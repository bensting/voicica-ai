'use client';

import { X, Gift, Check, AlertTriangle, MousePointerClick } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import AdsterraNativeBanner from './AdsterraNativeBanner';

interface AdOverlayProps {
  isShowing: boolean;
  remainingSeconds: number;
  totalSeconds: number;
  isCompleted: boolean;
  isWindowClosed: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * 广告倒计时覆盖层
 * 用于 Adsterra 弹出窗口模式，显示倒计时和状态
 */
export default function AdOverlay({
  isShowing,
  remainingSeconds,
  totalSeconds,
  isCompleted,
  isWindowClosed,
  onCancel,
  onConfirm,
}: AdOverlayProps) {
  const { t } = useLanguage();

  if (!isShowing) return null;

  const progress = ((totalSeconds - remainingSeconds) / totalSeconds) * 100;

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-[9999]">
      <div className="bg-white rounded-2xl p-8 flex flex-col items-center shadow-2xl min-w-[320px] max-w-[400px] mx-4">
        {/* 倒计时圆环 */}
        <div className="relative w-24 h-24 mb-6">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="44"
              stroke="#e5e7eb"
              strokeWidth="6"
              fill="none"
            />
            <circle
              cx="48"
              cy="48"
              r="44"
              stroke={isCompleted ? '#22c55e' : isWindowClosed ? '#ef4444' : '#8b5cf6'}
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={276.46}
              strokeDashoffset={isCompleted ? 0 : isWindowClosed ? 0 : 276.46 * (1 - progress / 100)}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {isCompleted ? (
              <Check className="w-10 h-10 text-green-500" />
            ) : isWindowClosed ? (
              <X className="w-10 h-10 text-red-500" />
            ) : (
              <span className="text-3xl font-bold text-gray-800">{remainingSeconds}</span>
            )}
          </div>
        </div>

        {/* 状态文字 */}
        <div className="text-center mb-6">
          {isCompleted ? (
            // 倒计时完成，可以领取奖励
            <>
              <p className="text-lg font-semibold text-green-600 mb-1">
                {t('dailyTasks.adCompleted') || '观看完成！'}
              </p>
              <p className="text-sm text-gray-500">
                {t('dailyTasks.clickToClaimReward') || '点击下方按钮领取奖励'}
              </p>
            </>
          ) : isWindowClosed ? (
            // 倒计时未完成就关闭窗口，失败
            <>
              <p className="text-lg font-semibold text-red-600 mb-1">
                {t('dailyTasks.adFailed') || '领取失败'}
              </p>
              <p className="text-sm text-gray-500">
                {t('dailyTasks.windowClosedTip') || '请重新观看广告'}
              </p>
            </>
          ) : (
            // 正在观看中
            <>
              <p className="text-lg font-semibold text-gray-800 mb-1">
                {t('dailyTasks.watchingAd') || '观看广告中...'}
              </p>
              <p className="text-sm text-gray-500">
                {t('dailyTasks.keepAdOpen') || '请保持广告窗口打开'}
              </p>
            </>
          )}
        </div>

        {/* Native Banner 广告 */}
        <div className="w-full mb-4">
          <AdsterraNativeBanner />
        </div>

        {/* 点击提示 - 仅在倒计时中显示 */}
        {!isCompleted && !isWindowClosed && (
          <div className="w-full mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center gap-2">
            <MousePointerClick className="w-5 h-5 text-purple-500 flex-shrink-0" />
            <p className="text-sm text-purple-700">
              {t('dailyTasks.exploreAdTip') || '浏览广告内容可发现更多精彩优惠'}
            </p>
          </div>
        )}

        {/* 窗口关闭警告 - 仅在倒计时未完成时显示 */}
        {isWindowClosed && !isCompleted && (
          <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">
              {t('dailyTasks.adWindowClosedNoReward') || '广告窗口已关闭，无法领取奖励'}
            </p>
          </div>
        )}

        {/* 按钮 */}
        <div className="flex gap-3 w-full">
          {isCompleted ? (
            // 倒计时完成，显示领取按钮
            <button
              onClick={onConfirm}
              className="flex-1 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
            >
              <Gift className="w-5 h-5" />
              {t('dailyTasks.claimReward') || '领取奖励'}
            </button>
          ) : isWindowClosed ? (
            // 倒计时未完成就关闭窗口，显示关闭按钮
            <button
              onClick={onCancel}
              className="flex-1 py-3 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-5 h-5" />
              {t('dailyTasks.close') || '关闭'}
            </button>
          ) : (
            // 正在观看中，显示取消按钮
            <button
              onClick={onCancel}
              className="flex-1 py-3 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-5 h-5" />
              {t('dailyTasks.cancel') || '取消'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
