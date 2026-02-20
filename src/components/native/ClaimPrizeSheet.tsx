'use client';

import { useState } from 'react';

/**
 * 领奖状态
 */
export type ClaimStatus = 'unclaimed' | 'info_submitted' | 'shipped' | 'delivered';

export interface ShippingInfo {
  fullName: string;
  phone: string;
  email: string;
  country: string;
  address: string;
  zipCode: string;
  telegram?: string;
}

export interface WalletInfo {
  walletNetwork: string;
  walletAddress: string;
  email: string;
  telegram?: string;
}

export interface ClaimData {
  status: ClaimStatus;
  shippingInfo?: ShippingInfo;
  walletInfo?: WalletInfo;
  /** 快递/转账信息（shipped 后填入） */
  tracking?: {
    carrier: string;
    trackingNumber: string;
    trackingUrl?: string;
    shippedAt: string;
  };
  /** 签收/确认时间 */
  deliveredAt?: string;
}

/** 支持的 USDT 网络 */
const WALLET_NETWORKS = [
  { id: 'TRC-20', label: 'TRC-20 (Tron)', placeholder: 'T...' },
  { id: 'BEP-20', label: 'BEP-20 (BSC)', placeholder: '0x...' },
  { id: 'ERC-20', label: 'ERC-20 (Ethereum)', placeholder: '0x...' },
];

interface ClaimPrizeSheetProps {
  prize: string;
  prizeType: 'product' | 'cash';
  claimData: ClaimData;
  onClose: () => void;
  onSubmitShipping: (info: ShippingInfo) => void;
  onSubmitWallet: (info: WalletInfo) => void;
}

/** 国家 / 地区完整列表（按英文名 A-Z） */
const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola',
  'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria',
  'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados',
  'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
  'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei',
  'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia',
  'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile',
  'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica',
  'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark',
  'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt',
  'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini',
  'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon',
  'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece',
  'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
  'Haiti', 'Honduras', 'Hong Kong', 'Hungary', 'Iceland',
  'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
  'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan',
  'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo', 'Kuwait',
  'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho',
  'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
  'Macau', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives',
  'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius',
  'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia',
  'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia',
  'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua',
  'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway',
  'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama',
  'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland',
  'Portugal', 'Puerto Rico', 'Qatar', 'Romania', 'Russia',
  'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines',
  'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal',
  'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia',
  'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea',
  'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname',
  'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan',
  'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga',
  'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
  'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States',
  'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela',
  'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe',
];

export default function ClaimPrizeSheet({ prize, prizeType, claimData, onClose, onSubmitShipping, onSubmitWallet }: ClaimPrizeSheetProps) {
  const isCash = prizeType === 'cash';

  // Shipping form state (product)
  const [shippingForm, setShippingForm] = useState<ShippingInfo>({
    fullName: '', phone: '', email: '', country: '', address: '', zipCode: '', telegram: '',
  });
  const [shippingErrors, setShippingErrors] = useState<Partial<Record<keyof ShippingInfo, string>>>({});
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  // Wallet form state (cash)
  const [walletForm, setWalletForm] = useState<WalletInfo>({
    walletNetwork: 'TRC-20', walletAddress: '', email: '', telegram: '',
  });
  const [walletAddressConfirm, setWalletAddressConfirm] = useState('');
  const [walletErrors, setWalletErrors] = useState<Partial<Record<keyof WalletInfo | 'walletAddressConfirm', string>>>({});

  const filteredCountries = COUNTRIES.filter((c) =>
    c.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const validateShipping = (): boolean => {
    const e: Partial<Record<keyof ShippingInfo, string>> = {};
    if (!shippingForm.fullName.trim()) e.fullName = 'Required';
    if (!shippingForm.phone.trim()) e.phone = 'Required';
    if (!shippingForm.email.trim()) e.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(shippingForm.email)) e.email = 'Invalid email';
    if (!shippingForm.country.trim()) e.country = 'Required';
    if (!shippingForm.address.trim()) e.address = 'Required';
    if (!shippingForm.zipCode.trim()) e.zipCode = 'Required';
    setShippingErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateWallet = (): boolean => {
    const e: Partial<Record<keyof WalletInfo | 'walletAddressConfirm', string>> = {};
    if (!walletForm.walletNetwork) e.walletNetwork = 'Required';
    if (!walletForm.walletAddress.trim()) e.walletAddress = 'Required';
    if (!walletAddressConfirm.trim()) e.walletAddressConfirm = 'Required';
    else if (walletForm.walletAddress.trim() !== walletAddressConfirm.trim()) e.walletAddressConfirm = 'Addresses do not match';
    if (!walletForm.email.trim()) e.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(walletForm.email)) e.email = 'Invalid email';
    setWalletErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (isCash) {
      if (validateWallet()) onSubmitWallet(walletForm);
    } else {
      if (validateShipping()) onSubmitShipping(shippingForm);
    }
  };

  const updateShippingField = (key: keyof ShippingInfo, value: string) => {
    setShippingForm((prev) => ({ ...prev, [key]: value }));
    if (shippingErrors[key]) setShippingErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const updateWalletField = (key: keyof WalletInfo, value: string) => {
    setWalletForm((prev) => ({ ...prev, [key]: value }));
    if (walletErrors[key]) setWalletErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const selectedNetwork = WALLET_NETWORKS.find((n) => n.id === walletForm.walletNetwork);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-w-lg bg-[#0f0f2a] rounded-t-2xl animate-slide-up max-h-[90vh] flex flex-col overflow-hidden">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 pb-4 flex-shrink-0 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-lg">Claim Your Prize</h3>
              <p className="text-amber-400 text-sm mt-0.5">{prize}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 p-1">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content — scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
          {/* === 未提交：显示表单 === */}
          {claimData.status === 'unclaimed' && (
            isCash ? (
              /* ── Cash: Wallet Form ── */
              <div className="space-y-4">
                <p className="text-gray-400 text-sm">
                  Please provide your wallet address. We&apos;ll transfer <span className="text-amber-400 font-medium">{prize}</span> to your wallet.
                </p>

                {/* Wallet Network */}
                <div>
                  <label className="text-gray-300 text-sm font-medium mb-1.5 block">
                    Network <span className="text-red-400">*</span>
                  </label>
                  <div className="flex gap-2">
                    {WALLET_NETWORKS.map((net) => (
                      <button
                        key={net.id}
                        onClick={() => updateWalletField('walletNetwork', net.id)}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                          walletForm.walletNetwork === net.id
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                            : 'bg-white/5 border-white/10 text-gray-400'
                        }`}
                      >
                        {net.id}
                      </button>
                    ))}
                  </div>
                  {walletErrors.walletNetwork && <p className="text-red-400 text-xs mt-1">{walletErrors.walletNetwork}</p>}
                </div>

                {/* Wallet Address */}
                <Field
                  label="Wallet Address"
                  required
                  error={walletErrors.walletAddress}
                  value={walletForm.walletAddress}
                  onChange={(v) => updateWalletField('walletAddress', v)}
                  placeholder={selectedNetwork?.placeholder ?? '0x...'}
                  mono
                />

                {/* Confirm Wallet Address */}
                <Field
                  label="Confirm Wallet Address"
                  required
                  error={walletErrors.walletAddressConfirm}
                  value={walletAddressConfirm}
                  onChange={(v) => {
                    setWalletAddressConfirm(v);
                    if (walletErrors.walletAddressConfirm) setWalletErrors((prev) => ({ ...prev, walletAddressConfirm: undefined }));
                  }}
                  placeholder="Re-enter your wallet address"
                  mono
                />

                {/* Email */}
                <Field
                  label="Email"
                  required
                  error={walletErrors.email}
                  value={walletForm.email}
                  onChange={(v) => updateWalletField('email', v)}
                  placeholder="your@email.com"
                  type="email"
                />

                {/* Telegram (optional) */}
                <div>
                  <label className="text-gray-300 text-sm font-medium mb-1.5 block">
                    Telegram Username
                    <span className="text-gray-500 font-normal ml-1">(optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">@</span>
                    <input
                      type="text"
                      value={walletForm.telegram}
                      onChange={(e) => updateWalletField('telegram', e.target.value)}
                      placeholder="username"
                      className="w-full pl-7 pr-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>
                  <p className="text-gray-500 text-xs mt-1">
                    We&apos;ll send transfer updates via Telegram Bot.
                  </p>
                </div>

                <div className="h-4" />
              </div>
            ) : (
              /* ── Product: Shipping Form ── */
              <div className="space-y-4">
                <p className="text-gray-400 text-sm">
                  Please provide your shipping details. We&apos;ll deliver the prize to your address.
                </p>

                <Field label="Full Name" required error={shippingErrors.fullName} value={shippingForm.fullName} onChange={(v) => updateShippingField('fullName', v)} placeholder="Your full name" />
                <Field label="Email" required error={shippingErrors.email} value={shippingForm.email} onChange={(v) => updateShippingField('email', v)} placeholder="your@email.com" type="email" />
                <Field label="Phone" required error={shippingErrors.phone} value={shippingForm.phone} onChange={(v) => updateShippingField('phone', v)} placeholder="+1 234 567 8900" type="tel" />

                {/* Country */}
                <div>
                  <label className="text-gray-300 text-sm font-medium mb-1.5 block">
                    Country / Region <span className="text-red-400">*</span>
                  </label>
                  <button
                    onClick={() => setShowCountryPicker(true)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg bg-white/5 border text-sm ${
                      shippingErrors.country ? 'border-red-500/50' : 'border-white/10'
                    } ${shippingForm.country ? 'text-white' : 'text-gray-500'}`}
                  >
                    {shippingForm.country || 'Select country'}
                  </button>
                  {shippingErrors.country && <p className="text-red-400 text-xs mt-1">{shippingErrors.country}</p>}
                </div>

                {/* Address */}
                <div>
                  <label className="text-gray-300 text-sm font-medium mb-1.5 block">
                    Address <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={shippingForm.address}
                    onChange={(e) => updateShippingField('address', e.target.value)}
                    placeholder="Street address, apartment, suite, etc."
                    rows={2}
                    className={`w-full px-3 py-2.5 rounded-lg bg-white/5 border text-white text-sm placeholder-gray-500 resize-none focus:outline-none focus:border-purple-500/50 ${
                      shippingErrors.address ? 'border-red-500/50' : 'border-white/10'
                    }`}
                  />
                  {shippingErrors.address && <p className="text-red-400 text-xs mt-1">{shippingErrors.address}</p>}
                </div>

                <Field label="Zip / Postal Code" required error={shippingErrors.zipCode} value={shippingForm.zipCode} onChange={(v) => updateShippingField('zipCode', v)} placeholder="10001" />

                {/* Telegram (optional) */}
                <div>
                  <label className="text-gray-300 text-sm font-medium mb-1.5 block">
                    Telegram Username
                    <span className="text-gray-500 font-normal ml-1">(optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">@</span>
                    <input
                      type="text"
                      value={shippingForm.telegram}
                      onChange={(e) => updateShippingField('telegram', e.target.value)}
                      placeholder="username"
                      className="w-full pl-7 pr-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>
                  <p className="text-gray-500 text-xs mt-1">
                    We&apos;ll send shipping updates via Telegram Bot.
                  </p>
                </div>

                <div className="h-4" />
              </div>
            )
          )}

          {/* === 已提交，等待处理 === */}
          {claimData.status === 'info_submitted' && (
            <div className="py-6 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h4 className="text-white font-bold text-lg">Info Received!</h4>
              <p className="text-gray-400 text-sm leading-relaxed">
                {isCash ? (
                  <>We&apos;ll transfer <span className="text-amber-400 font-medium">{prize}</span> to your wallet shortly.</>
                ) : (
                  <>We&apos;re preparing your <span className="text-amber-400 font-medium">{prize}</span>. You&apos;ll be notified once it&apos;s shipped.</>
                )}
              </p>

              {/* 信息摘要 */}
              {isCash && claimData.walletInfo ? (
                <div className="mt-4 bg-white/5 rounded-xl p-4 text-left space-y-3">
                  <h5 className="text-gray-400 text-xs font-medium uppercase tracking-wider">Transfer To</h5>
                  <div className="text-sm leading-relaxed space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 text-xs font-medium bg-emerald-500/10 px-2 py-0.5 rounded">
                        {claimData.walletInfo.walletNetwork}
                      </span>
                    </div>
                    <p className="text-white font-mono text-xs break-all">{claimData.walletInfo.walletAddress}</p>
                    {claimData.walletInfo.email && (
                      <p className="text-gray-400 mt-2">{claimData.walletInfo.email}</p>
                    )}
                    {claimData.walletInfo.telegram && (
                      <p className="text-gray-500">Telegram: @{claimData.walletInfo.telegram}</p>
                    )}
                  </div>
                </div>
              ) : !isCash && claimData.shippingInfo ? (
                <div className="mt-4 bg-white/5 rounded-xl p-4 text-left space-y-3">
                  <h5 className="text-gray-400 text-xs font-medium uppercase tracking-wider">Shipping To</h5>
                  <div className="text-sm leading-relaxed">
                    <p className="text-white font-medium">{claimData.shippingInfo.fullName}</p>
                    <p className="text-gray-400 mt-1">
                      {[claimData.shippingInfo.address, claimData.shippingInfo.zipCode].filter(Boolean).join(', ')}
                    </p>
                    {claimData.shippingInfo.country && <p className="text-gray-400">{claimData.shippingInfo.country}</p>}
                    {claimData.shippingInfo.phone && <p className="text-gray-400 mt-1">{claimData.shippingInfo.phone}</p>}
                    {claimData.shippingInfo.email && <p className="text-gray-400">{claimData.shippingInfo.email}</p>}
                    {claimData.shippingInfo.telegram && <p className="text-gray-500 mt-1">Telegram: @{claimData.shippingInfo.telegram}</p>}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* === 已发货/已转账 === */}
          {claimData.status === 'shipped' && claimData.tracking && (
            <div className="py-6 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center">
                {isCash ? (
                  <svg className="w-8 h-8 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 6v1.5m0 9V18m-2.5-8.5c0-.83.67-1.5 1.5-1.5h2c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-2c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h2c.83 0 1.5-.67 1.5-1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                  </svg>
                )}
              </div>
              <h4 className="text-white font-bold text-lg">
                {isCash ? 'Prize Transferred!' : 'Prize Shipped!'}
              </h4>
              <p className="text-gray-400 text-sm">
                Your <span className="text-amber-400 font-medium">{prize}</span> {isCash ? 'has been sent to your wallet.' : 'is on its way.'}
              </p>

              <div className="bg-white/5 rounded-xl p-4 text-left space-y-3">
                <h5 className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                  {isCash ? 'Transaction Info' : 'Tracking Info'}
                </h5>
                {isCash ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Network</span>
                      <span className="text-white text-sm font-medium">{claimData.tracking.carrier}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Tx Hash</span>
                      <p className="text-white text-xs font-mono break-all mt-1">{claimData.tracking.trackingNumber}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Transferred</span>
                      <span className="text-gray-300 text-sm">{claimData.tracking.shippedAt}</span>
                    </div>
                    {claimData.tracking.trackingUrl && (
                      <a
                        href={claimData.tracking.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium text-center mt-2"
                      >
                        View on Explorer &rarr;
                      </a>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Carrier</span>
                      <span className="text-white text-sm font-medium">{claimData.tracking.carrier}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Tracking No.</span>
                      <span className="text-white text-sm font-mono">{claimData.tracking.trackingNumber}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Shipped</span>
                      <span className="text-gray-300 text-sm">{claimData.tracking.shippedAt}</span>
                    </div>
                    {claimData.tracking.trackingUrl && (
                      <a
                        href={claimData.tracking.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full py-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium text-center mt-2"
                      >
                        Track Package &rarr;
                      </a>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* === 已签收/已确认 === */}
          {claimData.status === 'delivered' && (
            <div className="py-6 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
              <h4 className="text-white font-bold text-lg">
                {isCash ? 'Transfer Confirmed!' : 'Prize Delivered!'}
              </h4>
              <p className="text-gray-400 text-sm">
                Your <span className="text-amber-400 font-medium">{prize}</span> {isCash ? 'transfer is confirmed. Enjoy!' : 'has been delivered. Enjoy!'}
              </p>
              {claimData.deliveredAt && (
                <p className="text-gray-500 text-xs">
                  {isCash ? 'Confirmed' : 'Delivered'} on {claimData.deliveredAt}
                </p>
              )}
            </div>
          )}
        </div>

        {/* 固定底部 */}
        {claimData.status === 'unclaimed' ? (
          <div className="flex-shrink-0 px-5 pt-4 border-t border-white/[0.06]">
            <button
              onClick={handleSubmit}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-[15px]"
            >
              {isCash ? 'Submit Wallet Info' : 'Submit Shipping Info'}
            </button>
            <div className="h-6" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} />
          </div>
        ) : (
          <div className="flex-shrink-0 px-5 py-4 border-t border-white/[0.06]">
            <StatusTimeline current={claimData.status} isCash={isCash} />
            <div className="h-2" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} />
          </div>
        )}

        {/* Country Picker Overlay (product only) */}
        {showCountryPicker && (
          <div className="absolute inset-0 bg-[#0f0f2a] rounded-t-2xl z-10 flex flex-col">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
              <button onClick={() => setShowCountryPicker(false)} className="text-gray-400">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <input
                type="text"
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                placeholder="Search country..."
                autoFocus
                className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 focus:outline-none"
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredCountries.map((country) => (
                <button
                  key={country}
                  onClick={() => {
                    updateShippingField('country', country);
                    setShowCountryPicker(false);
                    setCountrySearch('');
                  }}
                  className={`w-full text-left px-5 py-3 text-sm border-b border-white/[0.03] ${
                    shippingForm.country === country ? 'text-amber-400 bg-amber-500/5' : 'text-gray-300'
                  }`}
                >
                  {country}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
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
        className={`w-full px-3 py-2.5 rounded-lg bg-white/5 border text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500/50 ${
          error ? 'border-red-500/50' : 'border-white/10'
        } ${mono ? 'font-mono text-xs' : ''}`}
      />
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

/** 状态时间线 */
function StatusTimeline({ current, isCash }: { current: ClaimStatus; isCash: boolean }) {
  const steps: { key: ClaimStatus; label: string }[] = isCash
    ? [
        { key: 'info_submitted', label: 'Info Received' },
        { key: 'shipped', label: 'Transferred' },
        { key: 'delivered', label: 'Confirmed' },
      ]
    : [
        { key: 'info_submitted', label: 'Info Received' },
        { key: 'shipped', label: 'Shipped' },
        { key: 'delivered', label: 'Delivered' },
      ];

  const currentIdx = steps.findIndex((s) => s.key === current);

  return (
    <div className="flex items-center justify-center gap-0 mt-4 px-4">
      {steps.map((step, i) => {
        const isCompleted = i <= currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full border-2 ${
                isCompleted
                  ? isCurrent && current !== 'delivered'
                    ? 'bg-amber-400 border-amber-400'
                    : 'bg-emerald-400 border-emerald-400'
                  : 'bg-transparent border-gray-600'
              }`} />
              <span className={`text-[10px] mt-1.5 whitespace-nowrap ${
                isCompleted ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-12 h-0.5 mx-1 -mt-4 ${
                i < currentIdx ? 'bg-emerald-400' : 'bg-gray-700'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
