import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface VoiceFiltersProps {
  selectedGender: string;
  onGenderChange: (gender: string) => void;
  usedOnly: boolean;
  onUsedOnlyChange: (usedOnly: boolean) => void;
}

/**
 * Voice filters component (Gender, Tier, etc.)
 */
export default function VoiceFilters({
  selectedGender,
  onGenderChange,
  usedOnly,
  onUsedOnlyChange,
}: VoiceFiltersProps) {
  const { t } = useLanguage();
  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);

  // Gender label helper
  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case 'all':
        return t('voiceFilters.gender');
      case 'male':
        return t('voiceFilters.male');
      case 'female':
        return t('voiceFilters.female');
      case 'neutral':
        return t('voiceFilters.neutral');
      default:
        return t('voiceFilters.gender');
    }
  };

  return (
    <div className="flex-shrink-0 px-3 py-2 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between">
        {/* Left: Gender filter */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setIsGenderDropdownOpen(!isGenderDropdownOpen)}
              className={`px-3 py-1.5 text-xs font-medium bg-white border rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5 ${
                selectedGender !== 'all' ? 'border-purple-500 text-purple-600' : 'border-gray-200 text-gray-700'
              }`}
            >
              {getGenderLabel(selectedGender)}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Gender dropdown */}
            {isGenderDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[100px]">
                {['all', 'male', 'female', 'neutral'].map((gender) => (
                  <button
                    key={gender}
                    onClick={() => {
                      onGenderChange(gender);
                      setIsGenderDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-xs text-left hover:bg-gray-50 transition-colors ${
                      selectedGender === gender ? 'bg-purple-50 text-purple-600 font-medium' : 'text-gray-700'
                    } ${gender === 'all' ? 'rounded-t-lg' : ''} ${gender === 'neutral' ? 'rounded-b-lg' : ''}`}
                  >
                    {gender === 'all' ? t('voiceFilters.all') : getGenderLabel(gender)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Used Only query button */}
        <button
          onClick={() => onUsedOnlyChange(!usedOnly)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
            usedOnly
              ? 'bg-purple-100 text-purple-700 border border-purple-300'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t('voiceFilters.usedOnly')}
        </button>
      </div>
    </div>
  );
}