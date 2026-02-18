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

export interface ClaimData {
  status: ClaimStatus;
  shippingInfo?: ShippingInfo;
  /** 快递信息（shipped 后填入） */
  tracking?: {
    carrier: string;
    trackingNumber: string;
    trackingUrl?: string;
    shippedAt: string;
  };
  /** 签收时间 */
  deliveredAt?: string;
}

interface ClaimPrizeSheetProps {
  prize: string;
  claimData: ClaimData;
  onClose: () => void;
  onSubmit: (info: ShippingInfo) => void;
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

export default function ClaimPrizeSheet({ prize, claimData, onClose, onSubmit }: ClaimPrizeSheetProps) {
  const [form, setForm] = useState<ShippingInfo>({
    fullName: '',
    phone: '',
    email: '',
    country: '',
    address: '',
    zipCode: '',
    telegram: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ShippingInfo, string>>>({});
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  const filteredCountries = COUNTRIES.filter((c) =>
    c.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ShippingInfo, string>> = {};
    if (!form.fullName.trim()) newErrors.fullName = 'Required';
    if (!form.phone.trim()) newErrors.phone = 'Required';
    if (!form.email.trim()) newErrors.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Invalid email';
    if (!form.country.trim()) newErrors.country = 'Required';
    if (!form.address.trim()) newErrors.address = 'Required';
    if (!form.zipCode.trim()) newErrors.zipCode = 'Required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit(form);
    }
  };

  const updateField = (key: keyof ShippingInfo, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

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
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">
                Please provide your shipping details. We&apos;ll deliver the prize to your address.
              </p>

              {/* Full Name */}
              <Field
                label="Full Name"
                required
                error={errors.fullName}
                value={form.fullName}
                onChange={(v) => updateField('fullName', v)}
                placeholder="Your full name"
              />

              {/* Email */}
              <Field
                label="Email"
                required
                error={errors.email}
                value={form.email}
                onChange={(v) => updateField('email', v)}
                placeholder="your@email.com"
                type="email"
              />

              {/* Phone */}
              <Field
                label="Phone"
                required
                error={errors.phone}
                value={form.phone}
                onChange={(v) => updateField('phone', v)}
                placeholder="+1 234 567 8900"
                type="tel"
              />

              {/* Country */}
              <div>
                <label className="text-gray-300 text-sm font-medium mb-1.5 block">
                  Country / Region <span className="text-red-400">*</span>
                </label>
                <button
                  onClick={() => setShowCountryPicker(true)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg bg-white/5 border text-sm ${
                    errors.country ? 'border-red-500/50' : 'border-white/10'
                  } ${form.country ? 'text-white' : 'text-gray-500'}`}
                >
                  {form.country || 'Select country'}
                </button>
                {errors.country && <p className="text-red-400 text-xs mt-1">{errors.country}</p>}
              </div>

              {/* Address */}
              <div>
                <label className="text-gray-300 text-sm font-medium mb-1.5 block">
                  Address <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={form.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="Street address, apartment, suite, etc."
                  rows={2}
                  className={`w-full px-3 py-2.5 rounded-lg bg-white/5 border text-white text-sm placeholder-gray-500 resize-none focus:outline-none focus:border-purple-500/50 ${
                    errors.address ? 'border-red-500/50' : 'border-white/10'
                  }`}
                />
                {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
              </div>

              {/* Zip Code */}
              <Field
                label="Zip / Postal Code"
                required
                error={errors.zipCode}
                value={form.zipCode}
                onChange={(v) => updateField('zipCode', v)}
                placeholder="10001"
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
                    value={form.telegram}
                    onChange={(e) => updateField('telegram', e.target.value)}
                    placeholder="username"
                    className="w-full pl-7 pr-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                  />
                </div>
                <p className="text-gray-500 text-xs mt-1">
                  We&apos;ll send shipping updates via Telegram Bot.
                </p>
              </div>

              {/* 底部留白，给固定按钮腾出空间 */}
              <div className="h-4" />
            </div>
          )}

          {/* === 已提交，等待处理 === */}
          {claimData.status === 'info_submitted' && (
            <div className="py-6 text-center space-y-4">
              {/* 图标 */}
              <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h4 className="text-white font-bold text-lg">Info Received!</h4>
              <p className="text-gray-400 text-sm leading-relaxed">
                We&apos;re preparing your <span className="text-amber-400 font-medium">{prize}</span>.
                You&apos;ll be notified once it&apos;s shipped.
              </p>

              {/* 收货信息摘要 */}
              {claimData.shippingInfo && (
                <div className="mt-4 bg-white/5 rounded-xl p-4 text-left space-y-3">
                  <h5 className="text-gray-400 text-xs font-medium uppercase tracking-wider">Shipping To</h5>
                  <div className="text-sm leading-relaxed">
                    <p className="text-white font-medium">{claimData.shippingInfo.fullName}</p>
                    <p className="text-gray-400 mt-1">
                      {[
                        claimData.shippingInfo.address,
                        claimData.shippingInfo.zipCode,
                      ].filter(Boolean).join(', ')}
                    </p>
                    {claimData.shippingInfo.country && (
                      <p className="text-gray-400">{claimData.shippingInfo.country}</p>
                    )}
                    {claimData.shippingInfo.phone && (
                      <p className="text-gray-400 mt-1">{claimData.shippingInfo.phone}</p>
                    )}
                    {claimData.shippingInfo.email && (
                      <p className="text-gray-400">{claimData.shippingInfo.email}</p>
                    )}
                    {claimData.shippingInfo.telegram && (
                      <p className="text-gray-500 mt-1">Telegram: @{claimData.shippingInfo.telegram}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* === 已发货 === */}
          {claimData.status === 'shipped' && claimData.tracking && (
            <div className="py-6 text-center space-y-4">
              {/* 图标 */}
              <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
              </div>
              <h4 className="text-white font-bold text-lg">Prize Shipped!</h4>
              <p className="text-gray-400 text-sm">
                Your <span className="text-amber-400 font-medium">{prize}</span> is on its way.
              </p>

              {/* 快递信息卡片 */}
              <div className="bg-white/5 rounded-xl p-4 text-left space-y-3">
                <h5 className="text-gray-400 text-xs font-medium uppercase tracking-wider">Tracking Info</h5>
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
              </div>
            </div>
          )}

          {/* === 已签收 === */}
          {claimData.status === 'delivered' && (
            <div className="py-6 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
              <h4 className="text-white font-bold text-lg">Prize Delivered!</h4>
              <p className="text-gray-400 text-sm">
                Your <span className="text-amber-400 font-medium">{prize}</span> has been delivered. Enjoy!
              </p>
              {claimData.deliveredAt && (
                <p className="text-gray-500 text-xs">Delivered on {claimData.deliveredAt}</p>
              )}
            </div>
          )}
        </div>

        {/* 固定底部：unclaimed 显示提交按钮，其他状态显示时间线 */}
        {claimData.status === 'unclaimed' ? (
          <div className="flex-shrink-0 px-5 pt-4 border-t border-white/[0.06]">
            <button
              onClick={handleSubmit}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-[15px]"
            >
              Submit Shipping Info
            </button>
            <div className="h-6" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} />
          </div>
        ) : (
          <div className="flex-shrink-0 px-5 py-4 border-t border-white/[0.06]">
            <StatusTimeline current={claimData.status} />
            <div className="h-2" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} />
          </div>
        )}

        {/* Country Picker Overlay */}
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
                    updateField('country', country);
                    setShowCountryPicker(false);
                    setCountrySearch('');
                  }}
                  className={`w-full text-left px-5 py-3 text-sm border-b border-white/[0.03] ${
                    form.country === country ? 'text-amber-400 bg-amber-500/5' : 'text-gray-300'
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
  label,
  required,
  error,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  required?: boolean;
  error?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
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
        }`}
      />
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

/** 状态时间线 */
function StatusTimeline({ current }: { current: ClaimStatus }) {
  const steps: { key: ClaimStatus; label: string }[] = [
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
            {/* Step dot */}
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full border-2 ${
                isCompleted
                  ? isCurrent
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
            {/* Connector line */}
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