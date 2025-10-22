import { useMemo } from 'react';
import type { VoiceModel } from '@/hooks/useTTSGenerator';
import type { SelectOption } from '@/components/ui/CustomSelect';
import { getLanguageFromLocale, getCountryFromLocale } from '../utils/localeUtils';
import { getCountryFlagComponent, sortCountriesByLanguage } from '../utils/countryUtils';
import { SUPPORTED_COUNTRIES, SUPPORTED_LANGUAGES } from '../utils/localeConfig';

interface UseVoiceOptionsProps {
  voices: VoiceModel[];
  availableLanguages: string[];
  locale: string;
  t: (key: string) => string;
}

/**
 * 语音选项生成 Hook
 */
export function useVoiceOptions({ voices, availableLanguages, locale, t }: UseVoiceOptionsProps) {
  // 从本地配置获取国家和语言列表，从 voices 获取性别列表
  const { countries, languages, genders } = useMemo(() => {
    const genderSet = new Set<string>();

    voices.forEach((voice) => {
      if (voice.gender) genderSet.add(voice.gender);
    });

    return {
      countries: [...SUPPORTED_COUNTRIES],
      languages: [...SUPPORTED_LANGUAGES],
      genders: Array.from(genderSet).sort(),
    };
  }, [voices]);

  // 获取国家显示名称（使用国际化翻译）
  const getCountryDisplayName = (countryCode: string): string => {
    const translatedName = t(`countries.${countryCode}`);
    // 如果翻译不存在，返回国家代码
    return translatedName !== `countries.${countryCode}` ? translatedName : countryCode;
  };

  // 获取语言显示名称（使用国际化翻译）
  const getLanguageDisplayName = (languageCode: string): string => {
    const translatedName = t(`languages.${languageCode}`);
    // 如果翻译不存在，返回语言代码
    return translatedName !== `languages.${languageCode}` ? translatedName : languageCode;
  };

  // 国家选项
  const countryOptions: SelectOption[] = useMemo(() => {
    const sortedCountries = sortCountriesByLanguage(countries, locale);

    return [
      { value: 'all', label: 'All Countries' },
      ...sortedCountries.map((country) => {
        const FlagComponent = getCountryFlagComponent(country);
        return {
          value: country,
          label: getCountryDisplayName(country),
          icon: FlagComponent ? <FlagComponent className="w-5 h-4" /> : undefined,
        };
      }),
    ];
  }, [countries, locale, t]);

  // 语言选项
  const languageOptions: SelectOption[] = useMemo(() => {
    const languagesToShow = availableLanguages.length > 0 ? availableLanguages : languages;

    return [
      { value: 'all', label: 'All Languages' },
      ...languagesToShow.map((lang) => ({
        value: lang,
        label: getLanguageDisplayName(lang),
      })),
    ];
  }, [availableLanguages, languages, t]);

  // 性别选项
  const genderOptions: SelectOption[] = useMemo(() => {
    return [
      { value: 'all', label: 'All Genders' },
      ...genders.map((gender) => ({
        value: gender,
        label: gender,
      })),
    ];
  }, [genders]);

  return {
    countries,
    languages,
    genders,
    countryOptions,
    languageOptions,
    genderOptions,
  };
}
