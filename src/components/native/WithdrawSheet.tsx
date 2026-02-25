/**
 * Withdraw Sheet
 * 底部滑出 USDT 提现面板 — 金额输入、网络选择、钱包地址、邮箱、费用明细
 */
'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUser } from '@/contexts/UserContext';
import { getWithdrawalConfig } from '@/config/appConfig';
import { submitWithdrawal } from '@/actions/withdrawal';
import type { WithdrawalNetworkConfig } from '@/config/appConfig/types';

/** 校验钱包地址格式是否匹配所选网络 */
function isValidAddress(address: string, networkId: string): boolean {
  switch (networkId) {
    case 'polygon':
    case 'bep20':
      // EVM 地址：0x 开头 + 40 位十六进制，共 42 字符
      return /^0x[0-9a-fA-F]{40}$/.test(address);
    case 'trc20':
      // Tron 地址：T 开头 + 33 位 Base58 字符，共 34 字符
      return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address);
    default:
      return true;
  }
}

interface WithdrawSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function WithdrawSheet({ isOpen, onClose, onSuccess }: WithdrawSheetProps) {
  const { t } = useLanguage();
  const { profile } = useUser();
  const config = getWithdrawalConfig();

  const usdtBalance = profile?.usdt_balance ?? 0;

  // Form state
  const [amount, setAmount] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<WithdrawalNetworkConfig | null>(
    config.networks[0] ?? null
  );
  const [walletAddress, setWalletAddress] = useState('');
  const [walletAddressConfirm, setWalletAddressConfirm] = useState('');
  const [email, setEmail] = useState('');
  const [telegram, setTelegram] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when sheet opens
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setSelectedNetwork(config.networks[0] ?? null);
      setWalletAddress('');
      setWalletAddressConfirm('');
      setEmail('');
      setTelegram('');
      setErrors({});
      setShowSuccess(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, config.networks]);

  // Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Computed values
  const parsedAmount = useMemo(() => parseFloat(amount) || 0, [amount]);
  const fee = selectedNetwork?.fee ?? 0;
  const netAmount = useMemo(() => Math.max(parsedAmount - fee, 0), [parsedAmount, fee]);

  const canSubmit = useMemo(() => {
    return (
      parsedAmount >= config.min_amount &&
      parsedAmount <= usdtBalance &&
      parsedAmount > fee &&
      selectedNetwork !== null &&
      walletAddress.trim().length > 0 &&
      walletAddressConfirm.trim().length > 0 &&
      email.trim().length > 0 &&
      !submitting
    );
  }, [parsedAmount, config.min_amount, usdtBalance, fee, selectedNetwork, walletAddress, walletAddressConfirm, email, submitting]);

  const handleMax = () => {
    setAmount(usdtBalance.toString());
    if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
  };

  const handleAmountChange = (val: string) => {
    // Allow only valid decimal input
    if (/^\d*\.?\d{0,6}$/.test(val) || val === '') {
      setAmount(val);
      if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
    }
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};

    if (!parsedAmount || parsedAmount <= 0) {
      e.amount = t('native.withdraw.errors.required');
    } else if (parsedAmount < config.min_amount) {
      e.amount = t('native.withdraw.errors.minAmount', { min: config.min_amount.toString() });
    } else if (parsedAmount > usdtBalance) {
      e.amount = t('native.withdraw.errors.insufficientBalance');
    } else if (parsedAmount <= fee) {
      e.amount = t('native.withdraw.errors.amountTooLow');
    }

    if (!selectedNetwork) {
      e.network = t('native.withdraw.errors.required');
    }

    if (!walletAddress.trim()) {
      e.walletAddress = t('native.withdraw.errors.required');
    } else if (selectedNetwork && !isValidAddress(walletAddress.trim(), selectedNetwork.id)) {
      e.walletAddress = t('native.withdraw.errors.invalidAddress');
    }

    if (!walletAddressConfirm.trim()) {
      e.walletAddressConfirm = t('native.withdraw.errors.required');
    } else if (walletAddress.trim() !== walletAddressConfirm.trim()) {
      e.walletAddressConfirm = t('native.withdraw.errors.addressMismatch');
    }

    if (!email.trim()) {
      e.email = t('native.withdraw.errors.required');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      e.email = t('native.withdraw.errors.invalidEmail');
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const result = await submitWithdrawal({
        amount: parsedAmount,
        network: selectedNetwork!.id,
        walletAddress: walletAddress.trim(),
        email: email.trim(),
        telegram: telegram.trim() || undefined,
      });

      if (result.success) {
        setShowSuccess(true);
        onSuccess?.();
      } else {
        // Map server errors
        const errorKey = result.error || 'server_error';
        const errorMap: Record<string, string> = {
          insufficient_balance: t('native.withdraw.errors.insufficientBalance'),
          below_minimum: t('native.withdraw.errors.minAmount', { min: config.min_amount.toString() }),
          invalid_network: t('native.withdraw.errors.invalidNetwork'),
          invalid_wallet: t('native.withdraw.errors.required'),
          invalid_email: t('native.withdraw.errors.invalidEmail'),
          withdrawal_disabled: t('native.withdraw.errors.disabled'),
          not_authenticated: t('native.withdraw.errors.loginRequired'),
          amount_too_low: t('native.withdraw.errors.amountTooLow'),
        };
        setErrors({ submit: errorMap[errorKey] || t('native.withdraw.errors.serverError') });
      }
    } catch {
      setErrors({ submit: t('native.withdraw.errors.serverError') });
    } finally {
      setSubmitting(false);
    }
  };

  const clearFieldError = (field: string) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  if (!isOpen) return null;

  const sheetContent = (
    <div
      className="fixed inset-0 z-[10000] flex items-end justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]" />

      {/* Sheet */}
      <div
        className="relative w-full max-w-lg bg-gradient-to-b from-[#2a2a4a] to-[#1a1a3a] rounded-t-3xl shadow-2xl animate-[slideUp_0.3s_ease-out] max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Title */}
        <div className="px-5 pb-3 flex-shrink-0 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">
            {t('native.withdraw.title')}
          </h3>
          <button onClick={onClose} className="text-gray-400 p-1">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-4">
          {showSuccess ? (
            /* ── Success state ── */
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h4 className="text-white font-bold text-lg">{t('native.withdraw.successTitle')}</h4>
              <p className="text-gray-400 text-sm">{t('native.withdraw.successDesc')}</p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
              >
                {t('native.common.confirm')}
              </button>
            </div>
          ) : (
            /* ── Form ── */
            <div className="space-y-4">
              {/* Available balance */}
              <div className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 p-3">
                <span className="text-gray-400 text-sm">{t('native.withdraw.available')}</span>
                <span className="text-white font-semibold">{usdtBalance.toFixed(4)} USDT</span>
              </div>

              {/* Amount input */}
              <div>
                <label className="text-gray-300 text-sm font-medium mb-1.5 block">
                  {t('native.withdraw.amount')} <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder={`${t('native.withdraw.min')} ${config.min_amount} USDT`}
                    className={`w-full px-3 py-2.5 pr-16 rounded-lg bg-white/5 border text-white text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 ${
                      errors.amount ? 'border-red-500/50' : 'border-white/10'
                    }`}
                  />
                  <button
                    onClick={handleMax}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-emerald-500/15 text-emerald-400 text-xs font-medium hover:bg-emerald-500/25 transition-colors"
                  >
                    MAX
                  </button>
                </div>
                {errors.amount
                  ? <p className="text-red-400 text-xs mt-1">{errors.amount}</p>
                  : <p className="text-gray-500 text-xs mt-1">{t('native.withdraw.minHint', { min: config.min_amount.toString() })}</p>
                }
              </div>

              {/* Network selector */}
              <div>
                <label className="text-gray-300 text-sm font-medium mb-1.5 block">
                  {t('native.withdraw.network')} <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2">
                  {config.networks.map((net) => (
                    <button
                      key={net.id}
                      onClick={() => {
                        setSelectedNetwork(net);
                        clearFieldError('network');
                      }}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-medium border transition-colors ${
                        selectedNetwork?.id === net.id
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                          : 'bg-white/5 border-white/10 text-gray-400'
                      }`}
                    >
                      <div>{net.label}</div>
                      <div className="text-[10px] mt-0.5 opacity-70">
                        {t('native.withdraw.feeLabel')}: {net.fee} USDT
                      </div>
                    </button>
                  ))}
                </div>
                {errors.network && <p className="text-red-400 text-xs mt-1">{errors.network}</p>}
              </div>

              {/* Wallet Address */}
              <Field
                label={t('native.withdraw.walletAddress')}
                required
                error={errors.walletAddress}
                value={walletAddress}
                onChange={(v) => { setWalletAddress(v); clearFieldError('walletAddress'); }}
                placeholder={selectedNetwork?.placeholder ?? '0x...'}
                mono
              />

              {/* Confirm Wallet Address */}
              <Field
                label={t('native.withdraw.confirmAddress')}
                required
                error={errors.walletAddressConfirm}
                value={walletAddressConfirm}
                onChange={(v) => { setWalletAddressConfirm(v); clearFieldError('walletAddressConfirm'); }}
                placeholder={t('native.withdraw.confirmAddressPlaceholder')}
                mono
              />

              {/* Email */}
              <Field
                label={t('native.withdraw.email')}
                required
                error={errors.email}
                value={email}
                onChange={(v) => { setEmail(v); clearFieldError('email'); }}
                placeholder="your@email.com"
                type="email"
              />

              {/* Telegram (optional) */}
              <div>
                <label className="text-gray-300 text-sm font-medium mb-1.5 block">
                  {t('native.withdraw.telegram')}
                  <span className="text-gray-500 font-normal ml-1">({t('native.withdraw.optional')})</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">@</span>
                  <input
                    type="text"
                    value={telegram}
                    onChange={(e) => setTelegram(e.target.value)}
                    placeholder="username"
                    className="w-full pl-7 pr-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              {/* Fee breakdown */}
              {parsedAmount > 0 && selectedNetwork && (
                <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">{t('native.withdraw.withdrawAmount')}</span>
                    <span className="text-white">{parsedAmount.toFixed(4)} USDT</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">{t('native.withdraw.feeLabel')}</span>
                    <span className="text-amber-400">-{fee.toFixed(4)} USDT</span>
                  </div>
                  <div className="border-t border-white/10 pt-2 flex justify-between text-sm">
                    <span className="text-gray-300 font-medium">{t('native.withdraw.netAmount')}</span>
                    <span className="text-emerald-400 font-semibold">{netAmount.toFixed(4)} USDT</span>
                  </div>
                </div>
              )}

              {/* Submit error */}
              {errors.submit && (
                <p className="text-red-400 text-sm text-center">{errors.submit}</p>
              )}

              {/* Spacer for safe area */}
              <div className="h-2" />
            </div>
          )}
        </div>

        {/* Fixed submit button */}
        {!showSuccess && (
          <div className="flex-shrink-0 px-5 pt-3 border-t border-white/[0.06]">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`w-full py-3 rounded-xl text-white font-bold text-[15px] transition-all active:scale-[0.97] ${
                canSubmit
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20'
                  : 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
              }`}
            >
              {submitting ? t('native.withdraw.submitting') : t('native.withdraw.submit')}
            </button>
            <div className="h-2" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }} />
          </div>
        )}
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

/** 通用输入字段 */
function Field({
  label, required, error, value, onChange, placeholder, type = 'text', mono,
}: {
  label: string;
  required?: boolean;
  error?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="text-gray-300 text-sm font-medium mb-1.5 block">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2.5 rounded-lg bg-white/5 border text-white text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 ${
          error ? 'border-red-500/50' : 'border-white/10'
        } ${mono ? 'font-mono text-xs' : ''}`}
      />
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}
