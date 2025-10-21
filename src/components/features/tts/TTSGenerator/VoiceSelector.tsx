import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import type { VoiceModel } from '@/hooks/useTTSGenerator';
import { voiceAPI } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import CustomSelect, { type SelectOption } from '@/components/ui/CustomSelect';
import * as CountryFlags from 'country-flag-icons/react/3x2';

interface VoiceSelectorProps {
  selectedVoice: VoiceModel | null;
  onSelect: (voice: VoiceModel) => void;
  disabled?: boolean;
}

/**
 * 语音选择器组件
 *
 * 显示可用的语音模型列表，从后端 API 获取数据
 */
export default function VoiceSelector({
  selectedVoice,
  onSelect,
  disabled = false,
}: VoiceSelectorProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [voices, setVoices] = useState<VoiceModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 筛选状态
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');

  // 从 API 获取语音列表
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const voicesData = await voiceAPI.getVoices({ is_active: true, limit: 1000 });
        setVoices(voicesData as VoiceModel[]);
        console.log('✅ 成功获取语音列表:', voicesData);
      } catch (err) {
        const error = err as Error;
        console.error('❌ 获取数据失败:', error);
        setError('Failed to load voices. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, []);

  // 从 locale 提取语言代码（例如：en-US -> en）
  const getLanguageFromLocale = (locale: string): string => {
    return locale.split('-')[0].toLowerCase();
  };

  // 从 locale 提取国家代码（例如：en-US -> US）
  const getCountryFromLocale = (locale: string): string => {
    const parts = locale.split('-');
    if (parts.length >= 2) {
      // 处理特殊格式如 zh-CN-sichuan
      return parts[1].toUpperCase();
    }
    return '';
  };

  // 计算唯一的国家、语言和性别列表
  const { countries, languages, genders } = useMemo(() => {
    const countrySet = new Set<string>();
    const languageSet = new Set<string>();
    const genderSet = new Set<string>();

    voices.forEach((voice) => {
      const country = getCountryFromLocale(voice.locale);
      const language = getLanguageFromLocale(voice.locale);

      if (country) countrySet.add(country);
      if (language) languageSet.add(language);
      if (voice.gender) genderSet.add(voice.gender);
    });

    return {
      countries: Array.from(countrySet).sort(),
      languages: Array.from(languageSet).sort(),
      genders: Array.from(genderSet).sort(),
    };
  }, [voices]);

  // 过滤语音列表
  const filteredVoices = voices.filter((voice) => {
    const voiceCountry = getCountryFromLocale(voice.locale);
    const voiceLanguage = getLanguageFromLocale(voice.locale);

    // 搜索过滤
    const matchesSearch = voice.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         voice.display_name?.en?.toLowerCase().includes(searchQuery.toLowerCase());

    // 国家过滤
    const matchesCountry = selectedCountry === 'all' || voiceCountry === selectedCountry;

    // 语言过滤
    const matchesLanguage = selectedLanguage === 'all' || voiceLanguage === selectedLanguage;

    // 性别过滤
    const matchesGender = selectedGender === 'all' || voice.gender === selectedGender;

    return matchesSearch && matchesCountry && matchesLanguage && matchesGender;
  });

  // 获取国家名称（带国旗）
  const getCountryDisplayName = (countryCode: string): string => {
    const translatedName = t(`countries.${countryCode}`);
    return translatedName !== `countries.${countryCode}` ? translatedName : countryCode;
  };

  // 获取国旗 SVG 组件
  const getCountryFlagComponent = (countryCode: string) => {
    // 使用 UK 映射到 GB
    const code = countryCode === 'UK' ? 'GB' : countryCode;
    const FlagComponent = (CountryFlags as any)[code];
    if (FlagComponent) {
      return <FlagComponent className="w-5 h-4" />;
    }
    return null;
  };

  // 准备自定义选择器的选项
  const countryOptions: SelectOption[] = useMemo(() => {
    return [
      { value: 'all', label: 'All Countries' },
      ...countries.map((country) => ({
        value: country,
        label: getCountryDisplayName(country),
        icon: getCountryFlagComponent(country),
      })),
    ];
  }, [countries, t]);

  const languageOptions: SelectOption[] = useMemo(() => {
    return [
      { value: 'all', label: 'All Languages' },
      ...languages.map((lang) => ({
        value: lang,
        label: lang.toUpperCase(),
      })),
    ];
  }, [languages]);

  const genderOptions: SelectOption[] = useMemo(() => {
    return [
      { value: 'all', label: 'All Genders' },
      ...genders.map((gender) => ({
        value: gender,
        label: gender,
      })),
    ];
  }, [genders]);

  return (
    <div className="space-y-4">
      {/* 第一行：标题 */}
      <div>
        <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
          Select a voice
        </h2>
      </div>

      {/* 第二行：三个筛选器 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 国家选择 */}
        <CustomSelect
          value={selectedCountry}
          onChange={setSelectedCountry}
          options={countryOptions}
          placeholder="Select Country"
          disabled={disabled || loading}
        />

        {/* 语言选择 */}
        <CustomSelect
          value={selectedLanguage}
          onChange={setSelectedLanguage}
          options={languageOptions}
          placeholder="Select Language"
          disabled={disabled || loading}
        />

        {/* 性别选择 */}
        <CustomSelect
          value={selectedGender}
          onChange={setSelectedGender}
          options={genderOptions}
          placeholder="Select Gender"
          disabled={disabled || loading}
        />
      </div>

      {/* 第三行：搜索框 */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search voices by name..."
          disabled={disabled || loading}
          className="w-full px-4 py-2.5 pr-10 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors text-sm"
        />
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* 语音列表 */}
      <div className="max-h-96 overflow-y-auto pr-2">
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-gray-600">Loading voices...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-purple-600 hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && filteredVoices.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No voices found matching your criteria
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {!loading && !error && filteredVoices.map((voice) => (
            <div
              key={voice.id}
              className={`flex flex-col gap-3 p-4 rounded-xl border-2 transition-all ${
                selectedVoice?.id === voice.id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              onClick={() => !disabled && onSelect(voice)}
            >
              {/* 顶部：头像和播放按钮 */}
              <div className="flex items-center justify-between">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center flex-shrink-0">
                  {voice.avatar_url ? (
                    <Image
                      src={voice.avatar_url}
                      alt={voice.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl text-white">🎤</span>
                  )}
                </div>

                {/* 播放按钮 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const audio = new Audio(voice.voice_sample_url);
                    audio.play().catch(err => console.error('播放失败:', err));
                  }}
                  disabled={disabled || !voice.voice_sample_url}
                  className="w-10 h-10 rounded-full bg-black hover:bg-gray-800 flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              </div>

              {/* 信息区域 */}
              <div className="flex-1 space-y-2">
                <div className="space-y-1">
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                    {voice.display_name?.en || voice.name}
                  </h3>
                  <p className="text-xs text-gray-600">
                    {voice.role} • {voice.locale}
                  </p>
                </div>

                {/* 标签 */}
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded flex items-center gap-1">
                    <span className="w-4 h-3 inline-flex">{getCountryFlagComponent(getCountryFromLocale(voice.locale))}</span>
                    <span>{getCountryFromLocale(voice.locale)}</span>
                  </span>
                  {voice.gender && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                      {voice.gender}
                    </span>
                  )}
                </div>

                {/* 风格列表 */}
                {voice.style_list.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {voice.style_list.slice(0, 2).map((style, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded"
                      >
                        {style}
                      </span>
                    ))}
                    {voice.style_list.length > 2 && (
                      <span className="text-xs text-gray-500">
                        +{voice.style_list.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}