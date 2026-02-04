/**
 * Insufficient Credits Modal
 * 积分不足提示弹窗
 * - 提供两个选项：获取免费积分 和 订阅
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

const GiftIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="8" width="18" height="13" rx="2" />
    <path d="M12 8v13M3 12h18M7.5 8a2.5 2.5 0 010-5C9 3 12 6 12 8M16.5 8a2.5 2.5 0 000-5C15 3 12 6 12 8" />
  </svg>
);

const CrownIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2 19h20v2H2v-2zm2-4l-2-9 6 4 4-7 4 7 6-4-2 9H4z" />
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
                <GiftIcon />
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
                <CrownIcon />
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
