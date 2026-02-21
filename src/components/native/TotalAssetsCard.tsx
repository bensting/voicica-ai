/**
 * Total Assets Card
 * 资产总览卡片 - 显示 VOICICA 和 USDT 余额
 * Mining 为独立 CTA，Convert/Withdraw 分别在对应币种行
 */
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCredits } from '@/contexts/CreditsContext';
import NativeDailyTasksModal from './NativeDailyTasksModal';
import ConvertModal from './ConvertModal';
import WithdrawSheet from './WithdrawSheet';

const EXCHANGE_RATE = 0.001; // 1 VOICICA = 0.001 USDT

// Mining pickaxe icon
const MiningIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 3.5l6 6M4 20l6.5-6.5" />
    <path d="M18 2l4 4-7.5 7.5-4-4L18 2z" />
    <path d="M2 22l5.5-5.5" />
    <path d="M7.5 13.5L10 16" />
  </svg>
);

export default function TotalAssetsCard() {
  const { t } = useLanguage();
  const { credits, loading, refreshCredits } = useCredits();
  const [showDailyTasks, setShowDailyTasks] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showWithdrawSheet, setShowWithdrawSheet] = useState(false);

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

        {/* Token rows with inline actions */}
        <div className="px-5 py-3 space-y-2.5">
          {/* VOICICA row + Convert */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-purple-500/25 flex items-center justify-center overflow-hidden">
                <Image src="/logo/voicica-token.png" alt="VOICICA" width={32} height={32} className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="text-gray-300 text-sm font-medium">$VOICICA</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-semibold mr-1">
                {loading ? '...' : credits.toLocaleString()}
              </span>
              <button
                onClick={() => setShowConvertModal(true)}
                className="px-2.5 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 text-xs font-medium hover:bg-purple-500/30 transition-colors active:scale-[0.95]"
              >
                {t('native.totalAssets.convert')}
              </button>
              <button
                onClick={() => setShowWithdrawSheet(true)}
                className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-xs font-medium hover:bg-white/10 transition-colors active:scale-[0.95]"
              >
                {t('native.totalAssets.withdraw')}
              </button>
            </div>
          </div>

          {/* USDT row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <circle cx="16" cy="16" r="16" fill="#26A17B" />
                  <path d="M17.9 17.05v-.02c-.1.01-.6.04-1.8.04-1 0-1.5-.03-1.7-.04v.02c-3.4-.15-5.9-.8-5.9-1.57 0-.77 2.5-1.42 5.9-1.58v2.5c.2.02.7.05 1.7.05 1.2 0 1.7-.04 1.8-.05v-2.5c3.4.16 5.9.81 5.9 1.58 0 .77-2.5 1.42-5.9 1.57zm0-3.4v-2.24h5V8.4H9.2v3.01h5v2.23c-3.8.18-6.7 1.05-6.7 2.08 0 1.03 2.9 1.9 6.7 2.08v7.45h3.7V17.8c3.8-.18 6.6-1.05 6.6-2.08 0-1.03-2.8-1.9-6.6-2.08z" fill="white" />
                </svg>
              </div>
              <span className="text-gray-300 text-sm font-medium">USDT</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-semibold mr-1">
                {usdtBalance.toFixed(2)}
              </span>
              <button
                onClick={() => setShowConvertModal(true)}
                className="px-2.5 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 text-xs font-medium hover:bg-purple-500/30 transition-colors active:scale-[0.95]"
              >
                {t('native.totalAssets.convert')}
              </button>
              <button
                onClick={() => setShowWithdrawSheet(true)}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-medium hover:bg-emerald-500/30 transition-colors active:scale-[0.95]"
              >
                {t('native.totalAssets.withdraw')}
              </button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5 border-t border-white/5" />

        {/* Mining CTA */}
        <div className="px-5 py-3.5">
          <button
            onClick={() => setShowDailyTasks(true)}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500/80 to-orange-500/80 hover:from-amber-500 hover:to-orange-500 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.97] shadow-lg shadow-amber-500/20"
          >
            <MiningIcon />
            {t('native.totalAssets.mining')}
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

      <WithdrawSheet
        isOpen={showWithdrawSheet}
        onClose={() => setShowWithdrawSheet(false)}
      />
    </>
  );
}
