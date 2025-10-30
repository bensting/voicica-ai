import { useState } from 'react';

interface VoiceFiltersProps {
  selectedGender: string;
  onGenderChange: (gender: string) => void;
}

/**
 * Voice filters component (Gender, Tier, etc.)
 */
export default function VoiceFilters({
  selectedGender,
  onGenderChange,
}: VoiceFiltersProps) {
  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);

  return (
    <div className="flex-shrink-0 px-3 py-2 bg-white border-b border-gray-200">
      <div className="flex items-center gap-2">
        {/* Gender filter */}
        <div className="relative">
          <button
            onClick={() => setIsGenderDropdownOpen(!isGenderDropdownOpen)}
            className={`px-3 py-1.5 text-xs font-medium bg-white border rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5 ${
              selectedGender !== 'all' ? 'border-purple-500 text-purple-600' : 'border-gray-200 text-gray-700'
            }`}
          >
            {selectedGender === 'all' ? 'Gender' : selectedGender === 'male' ? 'Male' : selectedGender === 'female' ? 'Female' : 'Neutral'}
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
                  {gender === 'all' ? 'All' : gender.charAt(0).toUpperCase() + gender.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pro/Basic filter - disabled for now */}
        <button
          disabled
          className="px-3 py-1.5 text-xs font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded-lg cursor-not-allowed flex items-center gap-1.5 opacity-50"
        >
          Pro/Basic
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </div>
  );
}