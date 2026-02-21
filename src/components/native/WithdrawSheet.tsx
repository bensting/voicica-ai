/**
 * Withdraw Sheet
 * 底部滑出提现面板 - 展示 VOICICA 和 USDT 余额及各自提现入口
 */
'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCredits } from '@/contexts/CreditsContext';

const EXCHANGE_RATE = 0.001;

interface WithdrawSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const WalletIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="6" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
    <path d="M6 6V4a2 2 0 012-2h8a2 2 0 012 2v2" />
    <circle cx="16" cy="14" r="1" fill="currentColor" />
  </svg>
);

const ExchangeIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M2 12h20M2 12l4-4M2 12l4 4" />
    <rect x="14" y="4" width="8" height="16" rx="2" />
    <path d="M17 9h2M17 12h2M17 15h2" />
  </svg>
);

export default function WithdrawSheet({ isOpen, onClose }: WithdrawSheetProps) {
  const { t } = useLanguage();
  const { credits, loading } = useCredits();

  const usdtBalance = 0;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleWithdrawVoicica = () => {
    alert(t('native.totalAssets.comingSoon'));
  };

  const handleCashOutUsdt = () => {
    alert(t('native.totalAssets.comingSoon'));
  };

  const sheetContent = (
    <div
      className="fixed inset-0 z-[10000] flex items-end justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]" />

      {/* Sheet */}
      <div
        className="relative w-full max-w-lg bg-gradient-to-b from-[#2a2a4a] to-[#1a1a3a] rounded-t-3xl shadow-2xl animate-[slideUp_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 20px)' }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-white text-center mb-4 px-6">
          {t('native.totalAssets.withdraw')}
        </h3>

        <div className="px-5 pb-4 space-y-3">
          {/* VOICICA row */}
          <div className="rounded-2xl bg-white/5 border border-purple-500/15 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-purple-500/25 flex items-center justify-center overflow-hidden">
                  <Image
                    src="/logo/voicica-token.png"
                    alt="VOICICA"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      target.parentElement!.innerHTML = '<div class="w-5 h-5 rounded-full bg-purple-400"></div>';
                    }}
                  />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">$VOICICA</p>
                  <p className="text-gray-500 text-xs">
                    ≈ ${loading ? '...' : (credits * EXCHANGE_RATE).toFixed(2)} USDT
                  </p>
                </div>
              </div>
              <p className="text-white font-bold text-lg">
                {loading ? '...' : credits.toLocaleString()}
              </p>
            </div>
            <button
              onClick={handleWithdrawVoicica}
              className="w-full py-2.5 rounded-xl bg-purple-600/80 hover:bg-purple-600 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
            >
              <WalletIcon />
              {t('native.withdraw.toWallet')}
            </button>
            <p className="text-gray-600 text-[11px] text-center mt-1.5">
              {t('native.withdraw.walletDesc')}
            </p>
          </div>

          {/* USDT row */}
          <div className="rounded-2xl bg-white/5 border border-emerald-500/15 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full flex items-center justify-center">
                  <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
                    <circle cx="16" cy="16" r="16" fill="#26A17B" />
                    <path d="M17.9 17.05v-.02c-.1.01-.6.04-1.8.04-1 0-1.5-.03-1.7-.04v.02c-3.4-.15-5.9-.8-5.9-1.57 0-.77 2.5-1.42 5.9-1.58v2.5c.2.02.7.05 1.7.05 1.2 0 1.7-.04 1.8-.05v-2.5c3.4.16 5.9.81 5.9 1.58 0 .77-2.5 1.42-5.9 1.57zm0-3.4v-2.24h5V8.4H9.2v3.01h5v2.23c-3.8.18-6.7 1.05-6.7 2.08 0 1.03 2.9 1.9 6.7 2.08v7.45h3.7V17.8c3.8-.18 6.6-1.05 6.6-2.08 0-1.03-2.8-1.9-6.6-2.08z" fill="white" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">USDT</p>
                  <p className="text-gray-500 text-xs">Tether USD</p>
                </div>
              </div>
              <p className="text-white font-bold text-lg">
                {usdtBalance.toFixed(2)}
              </p>
            </div>
            <button
              onClick={handleCashOutUsdt}
              className="w-full py-2.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
            >
              <ExchangeIcon />
              {t('native.withdraw.cashOut')}
            </button>
            <p className="text-gray-600 text-[11px] text-center mt-1.5">
              {t('native.withdraw.cashOutDesc')}
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(sheetContent, document.body) : null;
}
