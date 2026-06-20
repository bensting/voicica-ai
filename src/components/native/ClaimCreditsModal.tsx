'use client';

import { useState } from 'react';
import { useRewardedAd } from '@/hooks/useRewardedAd';
import { claimFreeCredits } from '@/actions/claimCredits';
import { formatCredits } from '@/utils/formatCredits';
import { useLanguage } from '@/contexts/LanguageContext';

interface ClaimCreditsModalProps {
  giftAmount: number;
  onClaimed: () => void;
  onClose: () => void;
}

export default function ClaimCreditsModal({ giftAmount, onClaimed, onClose }: ClaimCreditsModalProps) {
  const [phase, setPhase] = useState<'idle' | 'ad' | 'claiming' | 'success' | 'error'>('idle');
  const { showRewardedAd } = useRewardedAd();
  const { t } = useLanguage();

  const handleClaim = async () => {
    setPhase('ad');
    const result = await showRewardedAd();
    if (!result.success) {
      setPhase('error');
      return;
    }
    setPhase('claiming');
    const res = await claimFreeCredits(giftAmount);
    if (res.success) {
      setPhase('success');
      setTimeout(() => { onClaimed(); }, 1800);
    } else {
      setPhase('error');
    }
  };

  const amount = formatCredits(giftAmount);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ paddingBottom: 'var(--safe-area-inset-bottom, 0px)' }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="relative w-full bg-[#0f0f24] rounded-t-3xl px-6 pt-8 pb-10 flex flex-col items-center text-center animate-slide-up">
        <button
          onClick={onClose}
          disabled={phase === 'ad' || phase === 'claiming'}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {phase === 'success' ? (
          <>
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-white text-xl font-bold mb-1">{t('native.creditsGift.successTitle')}</h2>
            <p className="text-purple-300 text-base font-semibold">
              {t('native.creditsGift.successDesc', { amount })}
            </p>
          </>
        ) : (
          <>
            <div
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-5 text-4xl"
              style={{ boxShadow: '0 0 32px rgba(168,85,247,0.5)' }}
            >
              🎁
            </div>

            <h2 className="text-white text-xl font-bold mb-3">{t('native.creditsGift.title')}</h2>
            <p className="text-gray-300 text-sm mb-7">
              {t('native.creditsGift.subtitle', { amount })}
            </p>

            {phase === 'error' && (
              <p className="text-red-400 text-xs mb-4">{t('native.creditsGift.adFailed')}</p>
            )}

            <button
              onClick={handleClaim}
              disabled={phase === 'ad' || phase === 'claiming'}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-base disabled:opacity-60 transition-opacity"
            >
              {phase === 'ad'
                ? t('native.creditsGift.loadingAd')
                : phase === 'claiming'
                  ? t('native.creditsGift.claiming')
                  : t('native.creditsGift.claim')}
            </button>

            <button
              onClick={onClose}
              disabled={phase === 'ad' || phase === 'claiming'}
              className="mt-3 text-gray-500 text-sm py-2"
            >
              {t('native.creditsGift.maybeLater')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
