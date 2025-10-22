import { useState, useMemo } from 'react';
import type { VoiceModel } from '@/hooks/useTTSGenerator';
import { getLanguageFromLocale, getCountryFromLocale } from '../utils/localeUtils';
import { getLanguagesByCountry } from '../utils/localeConfig';

interface UseVoiceFiltersProps {
  voices: VoiceModel[];
  languages: string[];
}

/**
 * 语音筛选 Hook
 */
export function useVoiceFilters({ voices, languages }: UseVoiceFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');

  // 根据选择的国家，从本地配置获取该国家支持的语言列表
  const availableLanguages = useMemo(() => {
    if (selectedCountry === 'all') {
      return languages;
    }
    const countryLanguages = getLanguagesByCountry(selectedCountry);
    console.log(`✅ 国家 ${selectedCountry} 支持的语言:`, countryLanguages);
    return countryLanguages.length > 0 ? countryLanguages : languages;
  }, [selectedCountry, languages]);

  // 当国家改变时，重置语言选择
  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    setSelectedLanguage('all');
  };

  // 过滤语音列表
  const filteredVoices = useMemo(() => {
    return voices.filter((voice) => {
      const voiceCountry = getCountryFromLocale(voice.locale);
      const voiceLanguage = getLanguageFromLocale(voice.locale);

      const matchesSearch = voice.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           voice.display_name?.en?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCountry = selectedCountry === 'all' || voiceCountry === selectedCountry;
      const matchesLanguage = selectedLanguage === 'all' || voiceLanguage === selectedLanguage;
      const matchesGender = selectedGender === 'all' || voice.gender === selectedGender;

      return matchesSearch && matchesCountry && matchesLanguage && matchesGender;
    });
  }, [voices, searchQuery, selectedCountry, selectedLanguage, selectedGender]);

  return {
    searchQuery,
    setSearchQuery,
    selectedCountry,
    setSelectedCountry: handleCountryChange,
    selectedLanguage,
    setSelectedLanguage,
    selectedGender,
    setSelectedGender,
    availableLanguages,
    filteredVoices,
  };
}
