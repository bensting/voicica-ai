/**
 * Convert Modal
 * $VOICICA → USDT 兑换弹窗
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCredits } from '@/contexts/CreditsContext';
import { formatCredits } from '@/utils/formatCredits';
import { getConversionConfig, getMiningEconomyConfig } from '@/config/appConfig';
import { convertVoicicaToUsdt } from '@/actions/conversion';

interface ConvertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const config = getConversionConfig();
const RATE = getMiningEconomyConfig().token_value_usd;

const CloseIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
  </svg>
);

export default function ConvertModal({ isOpen, onClose, onSuccess }: ConvertModalProps) {
  const { t } = useLanguage();
  const { credits, refreshCredits } = useCredits();

  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Convertible amount = max(0, credits - reserve)
  const maxConvertible = Math.max(0, credits - config.min_voicica_reserve);
  const inputAmount = parseFloat(amount) || 0;
  const outputAmount = inputAmount * RATE;
  const isDisabled = maxConvertible <= 0 || inputAmount <= 0 || inputAmount > maxConvertible || inputAmount < config.min_convert_amount || loading;

  const handleMax = useCallback(() => {
    if (maxConvertible > 0) {
      // 最多4位小数，去掉末尾0
      const rounded = Math.round(maxConvertible * 10000) / 10000;
      setAmount(String(rounded));
    }
  }, [maxConvertible]);

  const handleConfirm = useCallback(async () => {
    if (isDisabled) return;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const convertAmount = Math.round(inputAmount * 10000) / 10000;
    const result = await convertVoicicaToUsdt(convertAmount);

    if (result.success) {
      setSuccessMsg(
        t('native.totalAssets.convertModal.convertSuccess', {
          amount: convertAmount,
          usdt: (result.usdt_received ?? 0).toFixed(4),
        })
      );
      setAmount('');
      // Refresh credits in context
      await refreshCredits();
      onSuccess?.();
      // Auto-close after showing success
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1500);
    } else {
      switch (result.error) {
        case 'insufficient_balance':
          setError(t('native.totalAssets.convertModal.insufficientBalance'));
          break;
        case 'below_minimum':
          setError(t('native.totalAssets.convertModal.minAmount', { min: config.min_convert_amount }));
          break;
        case 'not_authenticated':
          setError(t('native.totalAssets.convertModal.loginRequired'));
          break;
        default:
          setError(result.error || 'Unknown error');
      }
    }

    setLoading(false);
  }, [isDisabled, inputAmount, t, refreshCredits, onSuccess, onClose]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen]);

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
      if (e.key === 'Escape' && isOpen && !loading) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, loading]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[10000]"
      onClick={loading ? undefined : onClose}
    >
      <div
        className="relative w-full max-w-[380px] mx-4 bg-gradient-to-b from-[#2a2a4a] to-[#1a1a3a] rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'scaleIn 0.2s ease-out' }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10 disabled:opacity-40"
        >
          <CloseIcon />
        </button>

        {/* Content */}
        <div className="px-6 pt-8 pb-6">
          {/* Title */}
          <h3 className="text-xl font-bold text-white text-center mb-4">
            {t('native.totalAssets.convertModal.title')}
          </h3>

          {/* Rule hint */}
          <div className="flex items-start gap-1.5 bg-purple-500/10 border border-purple-500/20 rounded-xl px-3 py-2 mb-4">
            <InfoIcon />
            <p className="text-purple-300/80 text-[11px] leading-relaxed">
              {t('native.totalAssets.convertModal.ruleHint', { reserve: config.min_voicica_reserve })}
            </p>
          </div>

          {/* From: $VOICICA */}
          <div className="bg-white/5 rounded-2xl p-4 mb-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 text-sm">{t('native.totalAssets.convertModal.from')}</span>
              <span className="text-gray-500 text-xs">
                {formatCredits(credits)} $VOICICA
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError(null);
                }}
                placeholder="0"
                min="0"
                max={maxConvertible}
                disabled={maxConvertible <= 0 || loading}
                className="min-w-0 flex-1 bg-transparent text-white text-2xl font-semibold outline-none placeholder-gray-600 disabled:opacity-40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                onClick={handleMax}
                disabled={maxConvertible <= 0 || loading}
                className="shrink-0 px-2.5 py-1 text-xs font-bold text-purple-400 bg-purple-500/20 rounded-lg hover:bg-purple-500/30 transition-colors disabled:opacity-40"
              >
                {t('native.totalAssets.convertModal.max')}
              </button>
              <span className="shrink-0 text-white font-semibold text-xs">$VOICICA</span>
            </div>
          </div>

          {/* Arrow down */}
          <div className="flex justify-center -my-1 relative z-10">
            <div className="w-10 h-10 rounded-full bg-purple-600/60 flex items-center justify-center text-white">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M19 12l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* To: USDT */}
          <div className="bg-white/5 rounded-2xl p-4 mt-2 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 text-sm">{t('native.totalAssets.convertModal.to')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex-1 text-2xl font-semibold text-gray-300">
                {inputAmount > 0 ? outputAmount.toFixed(4) : '0'}
              </span>
              <span className="shrink-0 text-white font-semibold text-xs">USDT</span>
            </div>
          </div>

          {/* Exchange rate info */}
          <p className="text-gray-500 text-xs text-center mb-2">
            1 $VOICICA = {RATE} USDT
          </p>

          {/* Min amount hint */}
          {maxConvertible > 0 && maxConvertible < config.min_convert_amount && (
            <p className="text-amber-400/70 text-xs text-center mb-2">
              {t('native.totalAssets.convertModal.minAmount', { min: config.min_convert_amount })}
            </p>
          )}

          {/* Error message */}
          {error && (
            <p className="text-red-400 text-xs text-center mb-2">{error}</p>
          )}

          {/* Success message */}
          {successMsg && (
            <p className="text-emerald-400 text-xs text-center mb-2">{successMsg}</p>
          )}

          {/* Confirm button */}
          <button
            onClick={handleConfirm}
            disabled={isDisabled}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold text-base hover:from-purple-500 hover:to-purple-400 transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
          >
            {loading
              ? t('native.totalAssets.convertModal.converting')
              : t('native.totalAssets.convertModal.confirm')
            }
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
