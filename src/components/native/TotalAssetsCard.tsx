'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCredits } from '@/utils/formatCredits';
import { useCredits } from '@/contexts/CreditsContext';
import { getMiningEconomyConfig } from '@/config/appConfig';
import NativeDailyTasksModal from './NativeDailyTasksModal';

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
  const miningConfig = getMiningEconomyConfig();

  const [showDailyTasks, setShowDailyTasks] = useState(false);


  if (!miningConfig.show_wallet_card) return null;

  const rate = miningConfig.token_value_usd;

  return (
    <>
      <div className="mx-4 mt-2 rounded-2xl bg-gradient-to-br from-purple-900/40 via-[#1e1e3a]/80 to-[#1a1a35]/80 border border-purple-500/15 backdrop-blur-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-4 pb-2">
          <p className="text-gray-400 text-sm font-medium">
            {t('native.totalAssets.title')}
          </p>
        </div>

        {/* VOICICA row */}
        <div className="px-5 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-purple-500/25 flex items-center justify-center overflow-hidden">
                <Image src="/logo/voicica-token.png" alt="VOICICA" width={32} height={32} className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="text-gray-300 text-sm font-medium">$VOICICA</span>
                <span className="text-gray-500 text-[11px] ml-1.5">
                  {loading ? '' : `≈ ${credits * rate === 0 ? '0' : parseFloat((credits * rate).toFixed(4))} USDT`}
                </span>
              </div>
            </div>
            <span className="text-white text-sm font-semibold">
              {loading ? '...' : formatCredits(credits)}
            </span>
          </div>
        </div>

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
