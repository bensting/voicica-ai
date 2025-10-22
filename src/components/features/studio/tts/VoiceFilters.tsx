import CustomSelect, { type SelectOption } from '@/components/ui/CustomSelect';
import SearchInput from '@/components/ui/SearchInput';
import { Globe, Users, Flag } from 'lucide-react';

interface VoiceFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCountry: string;
  onCountryChange: (country: string) => void;
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  selectedGender: string;
  onGenderChange: (gender: string) => void;
  countryOptions: SelectOption[];
  languageOptions: SelectOption[];
  genderOptions: SelectOption[];
  disabled?: boolean;
  t: (key: string) => string;
}

/**
 * 语音筛选器组件
 */
export default function VoiceFilters({
  searchQuery,
  onSearchChange,
  selectedCountry,
  onCountryChange,
  selectedLanguage,
  onLanguageChange,
  selectedGender,
  onGenderChange,
  countryOptions,
  languageOptions,
  genderOptions,
  disabled = false,
  t,
}: VoiceFiltersProps) {
  return (
    <>
      {/* 搜索框 */}
      <SearchInput
        value={searchQuery}
        onChange={onSearchChange}
        placeholder={t('voiceFilters.searchPlaceholder')}
        disabled={disabled}
      />
      {/* 三个筛选器 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 国家选择 */}
        <CustomSelect
          value={selectedCountry}
          onChange={onCountryChange}
          options={countryOptions}
          placeholder={t('voiceFilters.selectCountry')}
          disabled={disabled}
          prefixIcon={<Flag className="w-4 h-4" />}
        />

        {/* 语言选择 */}
        <CustomSelect
          value={selectedLanguage}
          onChange={onLanguageChange}
          options={languageOptions}
          placeholder={t('voiceFilters.selectLanguage')}
          disabled={disabled}
          prefixIcon={<Globe className="w-4 h-4" />}
        />

        {/* 性别选择 */}
        <CustomSelect
          value={selectedGender}
          onChange={onGenderChange}
          options={genderOptions}
          placeholder={t('voiceFilters.selectGender')}
          disabled={disabled}
          prefixIcon={<Users className="w-4 h-4" />}
        />
      </div>


    </>
  );
}
