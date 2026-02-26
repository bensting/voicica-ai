'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useCredits } from '@/contexts/CreditsContext';
import { createVoicicaPurchaseCheckout } from '@/actions/voicica-purchase';
import LoginModal from '@/components/native/LoginModal';
import LoadingDots from '@/components/native/common/LoadingDots';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  MIN_PURCHASE_USD,
  MAX_PURCHASE_USD,
  QUICK_AMOUNTS,
  calculateVoicica,
  calculateEstimatedValue,
} from '@/config/native/voicica-purchase';

/**
 * Native Subscribe Page — VOICICA Swap UI
 * 类似 Uniswap 的自由兑换界面，深色金融风格
 */
export default function NativeSubscribePage() {
  const router = useRouter();
  const { user } = useFirebaseAuth();
  const { credits, loading: creditsLoading } = useCredits();
  const { t } = useLanguage();

  const [amountStr, setAmountStr] = useState('10');
  const [processing, setProcessing] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const amountUsd = parseFloat(amountStr) || 0;
  const voicicaAmount = calculateVoicica(amountUsd);
  const estimatedValue = calculateEstimatedValue(credits);
  const isValidAmount = amountUsd >= MIN_PURCHASE_USD && amountUsd <= MAX_PURCHASE_USD;

  const handleAmountChange = (value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setAmountStr(cleaned);
  };

  const handleQuickAmount = (amount: number) => {
    setAmountStr(String(amount));
  };

  const handleBuy = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    if (!isValidAmount) return;

    setProcessing(true);
    try {
      const successUrl = `${window.location.origin}/native/payment/success`;
      const cancelUrl = `${window.location.origin}/native/subscribe`;
      const data = await createVoicicaPurchaseCheckout(amountUsd, successUrl, cancelUrl);
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert(error instanceof Error ? error.message : 'Failed to start checkout');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#060613] flex flex-col overflow-auto">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-amber-500/[0.07] blur-[100px]" />
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-purple-600/[0.08] blur-[80px]" />
        <div className="absolute bottom-40 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-amber-600/[0.04] blur-[120px]" />
      </div>

      {/* Close button */}
      <button
        onClick={() => { window.location.href = '/native'; }}
        className="absolute left-4 z-20 w-10 h-10 flex items-center justify-center bg-white/5 backdrop-blur-sm rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all"
        style={{ top: 'calc(var(--safe-area-inset-top, 0px) + 8px)' }}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      {/* ── Balance Section ── */}
      <div
        className="relative z-10 text-center pt-5 pb-4"
        style={{ marginTop: 'calc(var(--safe-area-inset-top, 0px) + 52px)' }}
      >
        <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mb-3">
          {t('native.subscribe.yourBalance')}
        </p>
        <div className="flex items-center justify-center gap-2.5">
          <Image
            src="/logo/voicica-token.png"
            alt="VOICICA"
            width={36}
            height={36}
            className="w-9 h-9"
          />
          <span className="text-4xl font-bold text-white">
            {creditsLoading ? <LoadingDots /> : Math.floor(credits).toLocaleString()}
          </span>
        </div>
        <p className="text-slate-500 text-xs mt-1.5">
          {t('native.subscribe.estimatedValue', { value: estimatedValue.toFixed(2) })}
        </p>
      </div>

      {/* ── Swap Card ── */}
      <div className="relative z-10 flex-1 px-4 flex flex-col">
        <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-3xl p-4 space-y-0">
          {/* You Pay */}
          <div className="bg-white/[0.04] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">
                {t('native.subscribe.youPay')}
              </span>
              <span className="text-slate-600 text-[11px]">
                {t('native.subscribe.fee')}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08]">
                <span className="text-green-400 text-sm font-bold">$</span>
                <span className="text-slate-300 text-sm font-medium">{t('native.subscribe.usdLabel')}</span>
              </div>
              <input
                type="text"
                inputMode="decimal"
                value={amountStr}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="flex-1 bg-transparent text-white text-right text-3xl font-bold outline-none placeholder-slate-700 min-w-0"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Swap arrow */}
          <div className="flex justify-center -my-2 relative z-10">
            <div className="w-9 h-9 rounded-xl bg-[#0c0c20] border border-white/[0.08] flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M19 12l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* You Get */}
          <div className="bg-white/[0.04] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">
                {t('native.subscribe.youGet')}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                <Image
                  src="/logo/voicica-token.png"
                  alt=""
                  width={18}
                  height={18}
                  className="w-[18px] h-[18px]"
                />
                <span className="text-amber-400 text-sm font-medium">{t('native.subscribe.tokenLabel')}</span>
              </div>
              <span className="flex-1 text-right text-3xl font-bold text-amber-400 min-w-0 truncate">
                {voicicaAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Quick amount buttons */}
        <div className="flex gap-2 mt-4">
          {QUICK_AMOUNTS.map((amount) => {
            const isSelected = amountStr === String(amount);
            return (
              <button
                key={amount}
                onClick={() => handleQuickAmount(amount)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isSelected
                    ? 'bg-amber-500/15 border border-amber-500/50 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                    : 'bg-white/[0.03] border border-white/[0.06] text-slate-500 hover:text-slate-300 hover:border-white/10'
                }`}
              >
                ${amount}
              </button>
            );
          })}
        </div>

        {/* Rate & info */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-slate-600 text-[11px]">{t('native.subscribe.rateLabel')}</span>
            <span className="text-slate-400 text-[11px] font-medium">{t('native.subscribe.rateValue')}</span>
          </div>
          <div className="flex items-center justify-between px-1">
            <span className="text-slate-600 text-[11px]">{t('native.subscribe.feeLabel')}</span>
            <span className="text-slate-400 text-[11px] font-medium">{t('native.subscribe.feeValue')}</span>
          </div>
          <div className="flex items-center justify-between px-1">
            <span className="text-slate-600 text-[11px]">{t('native.subscribe.totalLabel')}</span>
            <span className="text-white text-[11px] font-semibold">
              ${isValidAmount ? (amountUsd + 0.30).toFixed(2) : '—'}
            </span>
          </div>
        </div>

        {/* Min amount hint */}
        {amountUsd > 0 && amountUsd < MIN_PURCHASE_USD && (
          <p className="text-center text-red-400/70 text-xs mt-3">
            {t('native.subscribe.minAmount')}
          </p>
        )}
      </div>

      {/* ── Bottom Buy Button ── */}
      <div
        className="relative z-20 px-4 pt-3 pb-4"
        style={{ paddingBottom: 'calc(var(--safe-area-inset-bottom, 0px) + 16px)' }}
      >
        <button
          onClick={handleBuy}
          disabled={processing || !isValidAmount}
          className="w-full py-4 rounded-2xl font-bold text-[15px] text-white flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          style={{
            background: isValidAmount && !processing
              ? 'linear-gradient(135deg, #b45309, #d97706, #f59e0b)'
              : 'linear-gradient(135deg, #1e1e2e, #2a2a3e, #1e1e2e)',
            boxShadow: isValidAmount && !processing
              ? '0 8px 32px rgba(217,119,6,0.3), 0 2px 8px rgba(245,158,11,0.2)'
              : 'none',
          }}
        >
          {processing ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {t('native.subscribe.processing')}
            </>
          ) : (
            <>
              <Image src="/logo/voicica-token.png" alt="" width={20} height={20} className="w-5 h-5" />
              {t('native.subscribe.buyButton')}
            </>
          )}
        </button>
      </div>

      {/* Login modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={() => {
          setShowLoginModal(false);
          window.location.reload();
        }}
      />
    </div>
  );
}
