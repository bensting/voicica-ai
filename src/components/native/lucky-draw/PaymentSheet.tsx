'use client';

import GradientButton from '@/components/native/common/GradientButton';
import { MinusIcon, PlusIcon, UsdtIcon, CreditCardIcon } from './icons';

const QUICK_PICKS = [1, 5, 10, 20, 50];

export interface PaymentSheetProps {
  open: boolean;
  onClose: () => void;
  qty: number;
  setQty: (n: number) => void;
  payMethod: 'crypto' | 'stripe';
  setPayMethod: (m: 'crypto' | 'stripe') => void;
  remainingSlots: number;
  creditsPerPurchase: number;
  stripePriceCents: number;
  cryptoPriceCents: number;
  totalSlots: number;
  purchasing: boolean;
  onPurchase: () => void;
}

export default function PaymentSheet({
  open,
  onClose,
  qty,
  setQty,
  payMethod,
  setPayMethod,
  remainingSlots,
  creditsPerPurchase,
  stripePriceCents,
  cryptoPriceCents,
  totalSlots,
  purchasing,
  onPurchase,
}: PaymentSheetProps) {
  if (!open) return null;

  const clampQty = (n: number) => Math.max(1, Math.min(n, remainingSlots));
  const stripePriceUsd = stripePriceCents / 100;
  const cryptoPriceUsd = cryptoPriceCents / 100;
  const totalCredits = qty * creditsPerPurchase;
  const winProbability = ((qty / totalSlots) * 100).toFixed(2);

  return (
    <>
      <div
        className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-[10001] bg-[#111127] rounded-t-3xl animate-slide-up"
        style={{ paddingBottom: 'calc(var(--safe-area-inset-bottom, 0px) + 16px)' }}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-gray-600" />
        </div>

        <div className="px-5 pb-4">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-bold text-lg">Get Credit Packs</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-gray-400 hover:text-white"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Quantity selector */}
          <div className="flex items-center justify-center gap-4 mb-3">
            <button
              onClick={() => setQty(clampQty(qty - 1))}
              disabled={qty <= 1}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white disabled:opacity-30 transition-opacity"
            >
              <MinusIcon />
            </button>
            <span className="text-white text-4xl font-black w-20 text-center tabular-nums">{qty}</span>
            <button
              onClick={() => setQty(clampQty(qty + 1))}
              disabled={qty >= remainingSlots}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white disabled:opacity-30 transition-opacity"
            >
              <PlusIcon />
            </button>
          </div>

          {/* Quick-pick buttons */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {QUICK_PICKS.filter((n) => n <= remainingSlots).map((n) => (
              <button
                key={n}
                onClick={() => setQty(n)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  qty === n
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 text-gray-400 hover:text-white'
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          {/* Credits + Draw info */}
          <div className="bg-white/5 rounded-xl p-3 mb-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">AI Credits</span>
              <span className="text-white font-bold text-lg">{totalCredits.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Free draw entries</span>
              <span className="text-emerald-400 font-bold">{qty}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-white/5">
              <span className="text-gray-400 text-sm">Win probability</span>
              <span className="text-amber-400 font-bold">{winProbability}%</span>
            </div>
          </div>

          {/* Payment method selector */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => setPayMethod('crypto')}
              className={`relative flex flex-col items-center gap-1.5 rounded-2xl py-4 px-3 transition-all active:scale-[0.97] ${
                payMethod === 'crypto'
                  ? 'bg-gradient-to-br from-emerald-900/50 to-teal-900/40 border-2 border-emerald-500'
                  : 'bg-white/5 border-2 border-transparent'
              }`}
            >
              <span className="absolute -top-2 bg-gray-500 text-white text-[9px] font-bold px-2 py-0.5 rounded">
                Coming Soon
              </span>
              <UsdtIcon />
              <span className="text-white text-xl font-black">${(cryptoPriceUsd * qty).toFixed(2)}</span>
              <span className="text-emerald-300/70 text-[11px]">USDT / USDC</span>
            </button>

            <button
              onClick={() => setPayMethod('stripe')}
              className={`relative flex flex-col items-center gap-1.5 rounded-2xl py-4 px-3 transition-all active:scale-[0.97] ${
                payMethod === 'stripe'
                  ? 'bg-gradient-to-br from-indigo-900/50 to-purple-900/40 border-2 border-indigo-500'
                  : 'bg-white/5 border-2 border-transparent'
              }`}
            >
              <span className="absolute -top-2 bg-indigo-500 text-white text-[9px] font-bold px-2 py-0.5 rounded">
                Instant
              </span>
              <CreditCardIcon />
              <span className="text-white text-xl font-black">${(stripePriceUsd * qty).toFixed(2)}</span>
              <span className="text-indigo-300/70 text-[11px]">Credit Card</span>
            </button>
          </div>

          <GradientButton
            onClick={onPurchase}
            disabled={purchasing}
          >
            {purchasing
              ? 'Processing...'
              : `GET ${totalCredits.toLocaleString()} CREDITS — $${(payMethod === 'crypto' ? cryptoPriceUsd * qty : stripePriceUsd * qty).toFixed(2)}`
            }
          </GradientButton>
        </div>
      </div>
    </>
  );
}
