/**
 * Withdraw Modal
 * 提现选择弹窗 - 选择提取 VOICICA 或 USDT
 */
'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CloseIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

export default function WithdrawModal({ isOpen, onClose }: WithdrawModalProps) {
  const { t } = useLanguage();

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
    onClose();
    alert(t('native.totalAssets.comingSoon'));
  };

  const handleWithdrawUsdt = () => {
    onClose();
    alert(t('native.totalAssets.comingSoon'));
  };

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[10000]"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[380px] mx-4 bg-gradient-to-b from-[#2a2a4a] to-[#1a1a3a] rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'scaleIn 0.2s ease-out' }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10"
        >
          <CloseIcon />
        </button>

        {/* Content */}
        <div className="px-6 pt-8 pb-6">
          <h3 className="text-xl font-bold text-white text-center mb-6">
            {t('native.totalAssets.withdraw')}
          </h3>

          <div className="space-y-3">
            {/* Withdraw VOICICA */}
            <button
              onClick={handleWithdrawVoicica}
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-purple-500/20 to-violet-500/20 border border-purple-500/30 hover:from-purple-500/30 hover:to-violet-500/30 transition-all active:scale-[0.98] flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-purple-500/25 flex items-center justify-center shrink-0">
                <div className="w-6 h-6 rounded-full bg-purple-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-semibold">
                  {t('native.totalAssets.withdrawModal.voicicaTitle')}
                </p>
                <p className="text-purple-400/80 text-sm">
                  {t('native.totalAssets.withdrawModal.voicicaDesc')}
                </p>
              </div>
              <ChevronRightIcon />
            </button>

            {/* Withdraw USDT */}
            <button
              onClick={handleWithdrawUsdt}
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30 hover:from-emerald-500/30 hover:to-green-500/30 transition-all active:scale-[0.98] flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-500/25 flex items-center justify-center shrink-0">
                <div className="w-6 h-6 rounded-full bg-emerald-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-semibold">
                  {t('native.totalAssets.withdrawModal.usdtTitle')}
                </p>
                <p className="text-emerald-400/80 text-sm">
                  {t('native.totalAssets.withdrawModal.usdtDesc')}
                </p>
              </div>
              <ChevronRightIcon />
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
