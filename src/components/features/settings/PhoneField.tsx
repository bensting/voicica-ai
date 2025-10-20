'use client';

import { useState } from 'react';

interface PhoneFieldProps {
  label: string;
  countryCode: string;
  phoneNumber: string;
  onCountryCodeChange: (code: string) => void;
  onPhoneChange: (phone: string) => void;
}

const countryOptions = [
  { code: '+1', country: 'US', flag: '🇺🇸' },
  { code: '+86', country: 'CN', flag: '🇨🇳' },
  { code: '+66', country: 'TH', flag: '🇹🇭' },
  { code: '+81', country: 'JP', flag: '🇯🇵' },
  { code: '+82', country: 'KR', flag: '🇰🇷' },
  { code: '+65', country: 'SG', flag: '🇸🇬' },
  { code: '+60', country: 'MY', flag: '🇲🇾' },
  { code: '+63', country: 'PH', flag: '🇵🇭' },
  { code: '+84', country: 'VN', flag: '🇻🇳' },
  { code: '+62', country: 'ID', flag: '🇮🇩' },
];

export default function PhoneField({
  label,
  countryCode,
  phoneNumber,
  onCountryCodeChange,
  onPhoneChange
}: PhoneFieldProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedCountry = countryOptions.find(option => option.code === countryCode) || countryOptions[2]; // Default to Thailand

  const filteredCountries = countryOptions.filter(option =>
    option.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.code.includes(searchTerm)
  );

  const handleCountrySelect = (code: string) => {
    onCountryCodeChange(code);
    setIsDropdownOpen(false);
    setSearchTerm('');
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="flex">
        {/* Country Code Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-l-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <span className="text-lg">{selectedCountry.flag}</span>
            <span className="text-sm font-medium">{selectedCountry.code}</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-300 rounded-md shadow-lg z-10">
              {/* Search Input */}
              <div className="p-2 border-b border-gray-200">
                <input
                  type="text"
                  placeholder="Search country..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              
              {/* Country List */}
              <div className="max-h-48 overflow-y-auto">
                {filteredCountries.map((option) => (
                  <button
                    key={option.code}
                    type="button"
                    onClick={() => handleCountrySelect(option.code)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-100 ${
                      option.code === countryCode ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                    }`}
                  >
                    <span className="text-lg">{option.flag}</span>
                    <span className="font-medium">{option.code}</span>
                    <span className="text-gray-500">{option.country}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Phone Number Input */}
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder="81 234 5678"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md border-l-0 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        />
      </div>
    </div>
  );
}
