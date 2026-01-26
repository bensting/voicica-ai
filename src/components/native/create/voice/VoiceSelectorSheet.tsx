'use client';

import { useEffect, useState, useRef } from 'react';
import type { Voice } from '@/types/voice';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useBottomNav } from '@/contexts/BottomNavContext';
import { useVoices } from '@/components/features/studio/voices/hooks/useVoices';
import { getAllLocaleOptions } from '@/utils/localeMapper';
import type { LocaleOption } from '@/types/config';
import { TTS_GENDER_OPTIONS, TTS_PROVIDER_OPTIONS } from '@/config/ttsVoiceFilters';
import ProviderIcon from '@/components/ui/icons/ProviderIcon';
import { User, UserRound, Users, Layers } from 'lucide-react';

interface VoiceSelectorSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVoice: Voice | null;
  onSelect: (voice: Voice) => void;
}

// 常用语言列表（按使用频率排序）
const POPULAR_LANGUAGES = [
  'en-US', 'zh-CN', 'zh-TW', 'ja-JP', 'ko-KR',
  'es-ES', 'fr-FR', 'de-DE', 'pt-BR', 'ru-RU',
  'ar-SA', 'hi-IN', 'th-TH', 'vi-VN', 'id-ID',
];

// 将国家代码转换为国旗 Emoji
function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// 关闭图标
const CloseIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

// 搜索图标
const SearchIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

// 播放图标
const PlayIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

// 暂停图标
const PauseIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
);

// 选中图标
const CheckIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20,6 9,17 4,12" />
  </svg>
);

// 下拉箭头图标
const ChevronDownIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

// 地球图标
const GlobeIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
  </svg>
);

/**
 * Native Voice Selector Bottom Sheet
 */
export default function NativeVoiceSelectorSheet({
  isOpen,
  onClose,
  selectedVoice,
  onSelect,
}: VoiceSelectorSheetProps) {
  const { locale } = useLanguage();
  const { user, loading: authLoading } = useFirebaseAuth();
  const { hideAll, showAll } = useBottomNav();
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);
  const [isProviderDropdownOpen, setIsProviderDropdownOpen] = useState(false);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const genderDropdownRef = useRef<HTMLDivElement>(null);
  const providerDropdownRef = useRef<HTMLDivElement>(null);

  // 隐藏顶部和底部导航栏
  useEffect(() => {
    if (isOpen) {
      hideAll();
    } else {
      showAll();
    }
  }, [isOpen, hideAll, showAll]);

  const {
    filteredVoices,
    loading,
    searchQuery,
    setSearchQuery,
    selectedLanguage,
    setSelectedLanguage,
    selectedGender,
    setSelectedGender,
    selectedProvider,
    setSelectedProvider,
    usedOnly,
    setUsedOnly,
    playingVoiceId,
    handlePlayVoice,
    hasMore,
    loadMoreVoices,
    loadingMore,
  } = useVoices({ locale, user, authLoading });

  // 获取所有可用语言，但优先显示常用语言
  const allLanguages = getAllLocaleOptions();
  const popularLanguages = POPULAR_LANGUAGES
    .map(code => allLanguages.find(lang => lang.code === code))
    .filter((lang): lang is LocaleOption => lang !== null);
  const otherLanguages = allLanguages.filter(
    lang => !POPULAR_LANGUAGES.includes(lang.code)
  );

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        languageDropdownRef.current &&
        !languageDropdownRef.current.contains(event.target as Node)
      ) {
        setIsLanguageDropdownOpen(false);
      }
      if (
        genderDropdownRef.current &&
        !genderDropdownRef.current.contains(event.target as Node)
      ) {
        setIsGenderDropdownOpen(false);
      }
      if (
        providerDropdownRef.current &&
        !providerDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProviderDropdownOpen(false);
      }
    };

    if (isLanguageDropdownOpen || isGenderDropdownOpen || isProviderDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLanguageDropdownOpen, isGenderDropdownOpen, isProviderDropdownOpen]);

  // 处理语言选择
  const handleLanguageSelect = (language: LocaleOption) => {
    setSelectedLanguage(language);
    // 保存到 localStorage
    localStorage.setItem('voiceLanguageFilter', language.code);
    setIsLanguageDropdownOpen(false);
  };

  // 处理性别选择
  const handleGenderSelect = (gender: string) => {
    setSelectedGender(gender);
    setIsGenderDropdownOpen(false);
  };

  // 处理供应商选择
  const handleProviderSelect = (provider: string) => {
    setSelectedProvider(provider);
    setIsProviderDropdownOpen(false);
  };

  // 禁止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // 滚动加载更多
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const bottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;
    if (bottom && hasMore && !loading && !loadingMore) {
      void loadMoreVoices();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Full Screen Sheet */}
      <div
        className="fixed inset-0 z-50 bg-gray-900 flex flex-col"
        style={{ paddingTop: 'calc(var(--safe-area-inset-top, 0px) + 12px)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 flex-shrink-0">
          <h2 className="text-white font-semibold text-lg">Select Voice</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-white">
            <CloseIcon />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 flex-shrink-0">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search voices..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800 text-white placeholder-gray-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              <SearchIcon />
            </div>
          </div>
        </div>

        {/* Language Selector */}
        <div className="px-4 pb-3" ref={languageDropdownRef}>
          <div className="relative">
            <button
              onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-800 text-white rounded-xl text-sm"
            >
              <div className="flex items-center gap-2">
                <GlobeIcon />
                <span>
                  {selectedLanguage?.name || 'Select Language'}
                </span>
              </div>
              <ChevronDownIcon />
            </button>

            {/* Dropdown */}
            {isLanguageDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 rounded-xl shadow-xl z-10 max-h-96 overflow-y-auto">
                {/* Popular Languages */}
                <div className="p-2">
                  <div className="text-xs text-gray-500 px-2 py-1">Popular</div>
                  {popularLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageSelect(lang)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedLanguage?.code === lang.code
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <span className="mr-2">
                        {getFlagEmoji(lang.countryCode)}
                      </span>
                      {lang.name}
                    </button>
                  ))}
                </div>

                {/* Divider */}
                <div className="border-t border-gray-700 my-1" />

                {/* Other Languages */}
                <div className="p-2">
                  <div className="text-xs text-gray-500 px-2 py-1">All Languages</div>
                  {otherLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageSelect(lang)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedLanguage?.code === lang.code
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <span className="mr-2">
                        {getFlagEmoji(lang.countryCode)}
                      </span>
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filter Row: Gender, Provider, Used */}
        <div className="px-4 pb-3 flex items-center gap-2">
          {/* Gender Dropdown */}
          <div className="relative" ref={genderDropdownRef}>
            <button
              onClick={() => setIsGenderDropdownOpen(!isGenderDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 text-white rounded-lg text-sm"
            >
              {selectedGender === 'male' && <User className="w-4 h-4 text-blue-400" />}
              {selectedGender === 'female' && <UserRound className="w-4 h-4 text-pink-400" />}
              {selectedGender === 'all' && <Users className="w-4 h-4 text-gray-400" />}
              <ChevronDownIcon />
            </button>

            {isGenderDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 bg-gray-800 rounded-xl shadow-xl z-10 p-2 min-w-[120px]">
                {TTS_GENDER_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleGenderSelect(option.value)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedGender === option.value
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {option.value === 'male' && <User className="w-4 h-4 text-blue-400" />}
                    {option.value === 'female' && <UserRound className="w-4 h-4 text-pink-400" />}
                    {option.value === 'all' && <Users className="w-4 h-4 text-gray-400" />}
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Provider Dropdown */}
          <div className="relative" ref={providerDropdownRef}>
            <button
              onClick={() => setIsProviderDropdownOpen(!isProviderDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 text-white rounded-lg text-sm"
            >
              {selectedProvider === 'all' ? (
                <Layers className="w-4 h-4 text-gray-400" />
              ) : (
                <ProviderIcon provider={selectedProvider.toLowerCase()} className="w-4 h-4" />
              )}
              <ChevronDownIcon />
            </button>

            {isProviderDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 bg-gray-800 rounded-xl shadow-xl z-10 p-2 min-w-[130px]">
                {TTS_PROVIDER_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleProviderSelect(option.value)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedProvider === option.value
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {option.value === 'all' ? (
                      <Layers className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ProviderIcon provider={option.value.toLowerCase()} className="w-4 h-4" />
                    )}
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Used Toggle */}
          <button
            onClick={() => setUsedOnly(!usedOnly)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              usedOnly
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            Used
          </button>
        </div>

        {/* Voice List */}
        <div
          className="flex-1 overflow-y-auto px-4"
          style={{ paddingBottom: 'calc(var(--safe-area-inset-bottom, 0px) + 24px)' }}
          onScroll={handleScroll}
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredVoices.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No voices found
            </div>
          ) : (
            <div className="space-y-2 pb-6">
              {filteredVoices.map((voice) => {
                const isSelected = selectedVoice?.name === voice.name;
                const isPlaying = playingVoiceId === voice.id;

                return (
                  <div
                    key={voice.name}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                      isSelected
                        ? 'bg-purple-600/20 border border-purple-500/50'
                        : 'bg-gray-800/60 hover:bg-gray-800'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {voice.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={voice.avatar_url}
                          alt={voice.display_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 text-lg font-medium">
                          {voice.display_name.charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => onSelect(voice)}
                    >
                      <div className="text-white font-medium text-sm truncate">
                        {voice.display_name}
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                        <span>{voice.locale}</span>
                        <span>·</span>
                        {voice.gender === 'male' && <User className="w-3 h-3 text-blue-400" />}
                        {voice.gender === 'female' && <UserRound className="w-3 h-3 text-pink-400" />}
                        {voice.gender === 'neutral' && <Users className="w-3 h-3 text-gray-400" />}
                        <span>·</span>
                        <ProviderIcon provider={voice.provider.toLowerCase()} className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* Play Button */}
                    <button
                      onClick={() => handlePlayVoice(voice)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isPlaying
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {isPlaying ? <PauseIcon /> : <PlayIcon />}
                    </button>

                    {/* Select Indicator */}
                    {isSelected && (
                      <div className="text-purple-500">
                        <CheckIcon />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Loading more */}
              {loadingMore && (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
