/**
 * Convert Modal
 * VOICICA <-> USDT 转换弹窗（UI 占位，暂不实际操作数据）
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCredits } from '@/contexts/CreditsContext';

interface ConvertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EXCHANGE_RATE = 0.001; // 1 VOICICA = 0.001 USDT

const CloseIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const SwapIcon = ({ spinning }: { spinning: boolean }) => (
  <svg
    className={`w-5 h-5 transition-transform duration-300 ${spinning ? 'rotate-180' : ''}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
  </svg>
);

export default function ConvertModal({ isOpen, onClose }: ConvertModalProps) {
  const { t } = useLanguage();
  const { credits } = useCredits();

  // true = VOICICA -> USDT, false = USDT -> VOICICA
  const [isVoicicaToUsdt, setIsVoicicaToUsdt] = useState(true);
  const [amount, setAmount] = useState('');
  const [swapAnimation, setSwapAnimation] = useState(false);

  const usdtBalance = 0;

  // Calculate output
  const inputAmount = parseFloat(amount) || 0;
  const outputAmount = isVoicicaToUsdt
    ? inputAmount * EXCHANGE_RATE
    : inputAmount / EXCHANGE_RATE;

  const maxAmount = isVoicicaToUsdt ? credits : usdtBalance;

  const handleSwapDirection = useCallback(() => {
    setSwapAnimation((prev) => !prev);
    setIsVoicicaToUsdt((prev) => !prev);
    setAmount('');
  }, []);

  const handleMax = useCallback(() => {
    setAmount(String(maxAmount));
  }, [maxAmount]);

  const handleConfirm = useCallback(() => {
    alert(t('native.totalAssets.comingSoon'));
  }, [t]);

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

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const fromToken = isVoicicaToUsdt ? '$VOICICA' : 'USDT';
  const toToken = isVoicicaToUsdt ? 'USDT' : '$VOICICA';
  const fromBalance = isVoicicaToUsdt ? credits : usdtBalance;

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
          {/* Title */}
          <h3 className="text-xl font-bold text-white text-center mb-6">
            {t('native.totalAssets.convertModal.title')}
          </h3>

          {/* From */}
          <div className="bg-white/5 rounded-2xl p-4 mb-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 text-sm">{t('native.totalAssets.convertModal.from')}</span>
              <span className="text-gray-500 text-xs">
                {fromBalance.toLocaleString()} {fromToken}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                min="0"
                className="min-w-0 flex-1 bg-transparent text-white text-2xl font-semibold outline-none placeholder-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                onClick={handleMax}
                className="shrink-0 px-2.5 py-1 text-xs font-bold text-purple-400 bg-purple-500/20 rounded-lg hover:bg-purple-500/30 transition-colors"
              >
                {t('native.totalAssets.convertModal.max')}
              </button>
              <span className="shrink-0 text-white font-semibold text-xs">{fromToken}</span>
            </div>
          </div>

          {/* Swap direction button */}
          <div className="flex justify-center -my-1 relative z-10">
            <button
              onClick={handleSwapDirection}
              className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-500 flex items-center justify-center text-white shadow-lg transition-colors"
            >
              <SwapIcon spinning={swapAnimation} />
            </button>
          </div>

          {/* To */}
          <div className="bg-white/5 rounded-2xl p-4 mt-2 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 text-sm">{t('native.totalAssets.convertModal.to')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex-1 text-2xl font-semibold text-gray-300">
                {inputAmount > 0 ? (isVoicicaToUsdt ? outputAmount.toFixed(4) : outputAmount.toLocaleString()) : '0'}
              </span>
              <span className="shrink-0 text-white font-semibold text-xs">{toToken}</span>
            </div>
          </div>

          {/* Exchange rate info */}
          <p className="text-gray-500 text-xs text-center mb-4">
            1 $VOICICA = {EXCHANGE_RATE} USDT
          </p>

          {/* Confirm button */}
          <button
            onClick={handleConfirm}
            disabled={inputAmount <= 0}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold text-base hover:from-purple-500 hover:to-purple-400 transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
          >
            {t('native.totalAssets.convertModal.confirm')}
          </button>
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
