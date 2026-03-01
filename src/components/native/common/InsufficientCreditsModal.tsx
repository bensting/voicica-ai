/**
 * Insufficient $VOICICA Modal
 * $VOICICA 不足提示弹窗
 * - 提供两个选项：挖矿赚 $VOICICA 和 购买 $VOICICA
 */
'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

interface InsufficientCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGetFreeCredits: () => void;
  requiredCredits?: number;
  currentCredits?: number;
}

// Icons
const CloseIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const CoinIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v12M9 9c0-1 1-2 3-2s3 1 3 2-1 2-3 2-3 1-3 2 1 2 3 2 3-1 3-2" />
  </svg>
);

const MiningIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 3.5l6 6M4 20l6.5-6.5" />
    <path d="M18 2l4 4-7.5 7.5-4-4L18 2z" />
    <path d="M2 22l5.5-5.5" />
    <path d="M7.5 13.5L10 16" />
  </svg>
);

const CartIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

export default function InsufficientCreditsModal({
  isOpen,
  onClose,
  onGetFreeCredits,
  requiredCredits,
  currentCredits,
}: InsufficientCreditsModalProps) {
  const { t } = useLanguage();
  const router = useRouter();

  // Prevent body scroll when modal is open
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

  // Handle ESC key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleGetFreeCredits = () => {
    onClose();
    onGetFreeCredits();
  };

  const handleSubscribe = () => {
    onClose();
    router.push('/native/subscribe');
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
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400">
              <CoinIcon />
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-white text-center mb-2">
            {t('native.insufficientCredits.title')}
          </h3>

          {/* Subtitle */}
          <p className="text-gray-400 text-sm text-center mb-6">
            {requiredCredits !== undefined && currentCredits !== undefined
              ? t('native.insufficientCredits.subtitleWithAmount', {
                  required: requiredCredits,
                  current: currentCredits,
                })
              : t('native.insufficientCredits.subtitle')}
          </p>

          {/* Options */}
          <div className="space-y-3">
            {/* Get Free Credits */}
            <button
              onClick={handleGetFreeCredits}
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 hover:from-green-500/30 hover:to-emerald-500/30 transition-all active:scale-[0.98] flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white shrink-0">
                <MiningIcon />
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-semibold">
                  {t('native.insufficientCredits.getFreeCredits')}
                </p>
                <p className="text-green-400/80 text-sm">
                  {t('native.insufficientCredits.getFreeCreditsDesc')}
                </p>
              </div>
              <ChevronRightIcon />
            </button>

            {/* Subscribe */}
            <button
              onClick={handleSubscribe}
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-pink-500/20 border border-amber-500/30 hover:from-amber-500/30 hover:via-orange-500/30 hover:to-pink-500/30 transition-all active:scale-[0.98] flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shrink-0">
                <CartIcon />
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-semibold">
                  {t('native.insufficientCredits.subscribe')}
                </p>
                <p className="text-amber-400/80 text-sm">
                  {t('native.insufficientCredits.subscribeDesc')}
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
