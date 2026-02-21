/**
 * Total Assets Card
 * 资产总览卡片 - 显示 VOICICA 和 USDT 余额
 */
'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCredits } from '@/contexts/CreditsContext';
import NativeDailyTasksModal from './NativeDailyTasksModal';
import ConvertModal from './ConvertModal';
import WithdrawModal from './WithdrawModal';

const EXCHANGE_RATE = 0.001; // 1 VOICICA = 0.001 USDT

export default function TotalAssetsCard() {
  const { t } = useLanguage();
  const { credits, loading, refreshCredits } = useCredits();
  const [showDailyTasks, setShowDailyTasks] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const usdtBalance = 0;
  const totalValue = credits * EXCHANGE_RATE + usdtBalance;

  return (
    <>
      <div className="mx-4 mt-2 rounded-2xl bg-gradient-to-br from-purple-900/40 via-[#1e1e3a]/80 to-[#1a1a35]/80 border border-purple-500/15 backdrop-blur-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <p className="text-gray-400 text-sm font-medium mb-1">
            {t('native.totalAssets.title')}
          </p>
          <p className="text-white text-3xl font-bold tracking-tight">
            {loading ? '...' : `$${totalValue.toFixed(2)}`}
          </p>
          <p className="text-gray-500 text-xs mt-0.5">
            1 $VOICICA = ${EXCHANGE_RATE} USDT
          </p>
        </div>

        {/* Token balances */}
        <div className="px-5 py-3 space-y-2.5">
          {/* VOICICA */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-purple-500/25 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-purple-400" />
              </div>
              <span className="text-gray-300 text-sm font-medium">$VOICICA</span>
            </div>
            <span className="text-white text-sm font-semibold">
              {loading ? '...' : credits.toLocaleString()}
            </span>
          </div>

          {/* USDT */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500/25 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-emerald-400" />
              </div>
              <span className="text-gray-300 text-sm font-medium">USDT</span>
            </div>
            <span className="text-white text-sm font-semibold">
              {usdtBalance.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5 border-t border-white/5" />

        {/* Action buttons */}
        <div className="px-5 py-3.5 flex gap-2.5">
          <button
            onClick={() => setShowDailyTasks(true)}
            className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium transition-colors active:scale-[0.97]"
          >
            {t('native.totalAssets.mining')}
          </button>
          <button
            onClick={() => setShowConvertModal(true)}
            className="flex-1 py-2.5 rounded-xl bg-purple-600/80 hover:bg-purple-600 text-white text-sm font-medium transition-colors active:scale-[0.97]"
          >
            {t('native.totalAssets.convert')}
          </button>
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium transition-colors active:scale-[0.97]"
          >
            {t('native.totalAssets.withdraw')}
          </button>
        </div>
      </div>

      <NativeDailyTasksModal
        isOpen={showDailyTasks}
        onClose={() => setShowDailyTasks(false)}
        onCreditsUpdated={refreshCredits}
      />

      <ConvertModal
        isOpen={showConvertModal}
        onClose={() => setShowConvertModal(false)}
      />

      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
      />
    </>
  );
}
