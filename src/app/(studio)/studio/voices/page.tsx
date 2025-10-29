'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight, Play, Pause } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudio } from '@/contexts/StudioContext';
import LanguageSelector from '@/components/common/LanguageSelector';
import LanguageSelectorModal from '@/components/common/LanguageSelectorModal';
import VoiceTagSelector from '@/components/features/voices/VoiceTagSelector';
import { getAllLocaleOptions } from '@/utils/localeMapper';
import { getVoices } from '@/lib/api/voice';
import { getLocalizedVoiceName } from '@/types/voice';
import type { LocaleOption } from '@/types/config';
import type { Voice } from '@/types/voice';

/**
 * Voices Gallery Page (Mobile-First Design)
 *
 * Features:
 * - Search bar with language selector
 * - Left panel: Voice filters and categories
 * - Right panel: Voice cards grid
 */
export default function VoicesPage() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const { setTitle } = useStudio();

  // Voices data state
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Language selector state
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<LocaleOption | null>(null);

  // Tag selector state
  const [selectedTagId, setSelectedTagId] = useState('all');

  // Filter state
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all'); // pro/basic
  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);
  const [isTierDropdownOpen, setIsTierDropdownOpen] = useState(false);

  // Audio player state
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Set page title
  useEffect(() => {
    setTitle('Voice Gallery');
  }, [setTitle]);

  // Load voices
  useEffect(() => {
    const loadVoices = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getVoices({ is_active: true });
        setVoices(data);
      } catch (err) {
        console.error('Failed to load voices:', err);
        setError('Failed to load voices');
      } finally {
        setLoading(false);
      }
    };

    loadVoices();
  }, []);

  // Get all available language options from localeMapper
  const availableLanguages = getAllLocaleOptions();

  const handleLanguageSelect = (language: LocaleOption) => {
    setSelectedLanguage(language);
  };

  // Filter voices based on all criteria
  const filteredVoices = voices.filter((voice) => {
    // Search filter
    if (searchQuery) {
      const voiceName = getLocalizedVoiceName(voice, locale).toLowerCase();
      if (!voiceName.includes(searchQuery.toLowerCase())) {
        return false;
      }
    }

    // Language filter
    if (selectedLanguage && voice.locale !== selectedLanguage.code) {
      return false;
    }

    // Gender filter
    if (selectedGender !== 'all' && voice.gender !== selectedGender) {
      return false;
    }

    // Tag filter
    if (selectedTagId !== 'all') {
      if (selectedTagId === 'my-clone') {
        // TODO: Implement my clone logic
        return false;
      }
      if (selectedTagId === 'used') {
        // TODO: Implement used voices logic
        return false;
      }
      // Check if voice has this tag
      if (!voice.tags.includes(selectedTagId)) {
        return false;
      }
    }

    // Tier filter (Pro/Basic) - TODO: Add tier field to Voice type
    // if (selectedTier !== 'all') {
    //   return voice.tier === selectedTier;
    // }

    return true;
  });

  // Handle audio playback
  const handlePlayVoice = (voice: Voice) => {
    if (playingVoiceId === voice.id) {
      // Pause current
      audioElement?.pause();
      setPlayingVoiceId(null);
    } else {
      // Stop previous and play new
      audioElement?.pause();
      const audio = new Audio(voice.voice_sample_url);
      audio.play();
      audio.onended = () => setPlayingVoiceId(null);
      setAudioElement(audio);
      setPlayingVoiceId(voice.id);
    }
  };

  // Handle voice selection (return to TTS page)
  const handleSelectVoice = (voice: Voice) => {
    // Save selected voice to sessionStorage for TTS page to pick up
    sessionStorage.setItem('ttsPreSelectedVoice', JSON.stringify(voice));
    // Navigate back to TTS page
    router.push('/studio/tts');
  };

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* ========== 顶部区域：搜索框 + 语言选择器 ========== */}
      <div className="flex-shrink-0 px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          {/* 搜索框 */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full h-[48px] pl-10 pr-4 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>

          {/* 语言选择器 - 点击打开模态框 */}
          <div className="w-[160px]">
            <button
              onClick={() => setIsLanguageModalOpen(true)}
              className="w-full h-[48px] flex items-center justify-between gap-2 px-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm text-gray-900 truncate">
                {selectedLanguage ? selectedLanguage.name : 'English (US)'}
              </span>
              <svg className="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 语言选择器模态框 */}
      <LanguageSelectorModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
        selectedLocale={selectedLanguage}
        availableLocales={availableLanguages}
        onSelect={handleLanguageSelect}
      />

      {/* ========== 内容区域：左侧标签 + 右侧（上部筛选器 + 下部列表）========== */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧标签选择器 - 固定，自适应内容宽度 */}
        <div className="flex-shrink-0 border-r border-gray-200">
          <VoiceTagSelector
            selectedTagId={selectedTagId}
            onTagSelect={setSelectedTagId}
          />
        </div>

        {/* 右侧区域 - 占据剩余空间 */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* 右上筛选器 - 固定 */}
          <div className="flex-shrink-0 px-3 py-2 bg-white border-b border-gray-200">
            <div className="flex items-center gap-2">
              {/* Gender 筛选 */}
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

                {/* Gender 下拉菜单 */}
                {isGenderDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[100px]">
                    {['all', 'male', 'female', 'neutral'].map((gender) => (
                      <button
                        key={gender}
                        onClick={() => {
                          setSelectedGender(gender);
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

              {/* Pro/Basic 筛选 - 暂时禁用 */}
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

          {/* 右下语音卡片列表 - 可滚动 */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            <div className="p-6">
              {/* 加载状态 */}
              {loading && (
                <div className="flex justify-center items-center py-12">
                  <div className="text-sm text-gray-500">Loading voices...</div>
                </div>
              )}

              {/* 错误状态 */}
              {error && (
                <div className="flex justify-center items-center py-12">
                  <div className="text-sm text-red-500">{error}</div>
                </div>
              )}

              {/* 空状态 */}
              {!loading && !error && filteredVoices.length === 0 && (
                <div className="flex justify-center items-center py-12">
                  <div className="text-sm text-gray-500">No voices found</div>
                </div>
              )}

              {/* 语音卡片列表 */}
              {!loading && !error && filteredVoices.length > 0 && (
                <div className="space-y-3">
                  {filteredVoices.map((voice) => {
                    const isPlaying = playingVoiceId === voice.id;
                    const voiceName = getLocalizedVoiceName(voice, locale);

                    return (
                      <div
                        key={voice.id}
                        className="bg-white rounded-lg p-4 border border-gray-200 flex items-center gap-4 hover:shadow-md transition-shadow"
                      >
                        {/* 头像 + 播放按钮 */}
                        <div className="relative w-12 h-12 flex-shrink-0">
                          {voice.avatar_url ? (
                            <img
                              src={voice.avatar_url}
                              alt={voiceName}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-sm font-bold">
                              {voiceName.charAt(0).toUpperCase()}
                            </div>
                          )}

                          {/* 播放按钮始终显示在头像上 */}
                          <button
                            onClick={() => handlePlayVoice(voice)}
                            className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 rounded-full transition-all active:scale-95"
                          >
                            {isPlaying ? (
                              <Pause className="w-4 h-4 text-white drop-shadow-lg" />
                            ) : (
                              <Play className="w-4 h-4 text-white drop-shadow-lg" />
                            )}
                          </button>
                        </div>

                        {/* 语音信息 */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">{voiceName}</h3>
                          <p className="text-xs text-orange-500 capitalize">{voice.role || 'General'}</p>
                          <p className="text-xs text-gray-500">
                            {voice.gender === 'male' ? 'Male' : voice.gender === 'female' ? 'Female' : 'Neutral'} | {voice.locale}
                          </p>
                        </div>

                        {/* 选择并使用按钮 */}
                        <button
                          onClick={() => handleSelectVoice(voice)}
                          className="w-8 h-8 rounded-lg border border-gray-200 hover:border-purple-500 hover:bg-purple-50 flex items-center justify-center flex-shrink-0 transition-colors group"
                        >
                          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}