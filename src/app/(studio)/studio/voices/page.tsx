'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudio } from '@/contexts/StudioContext';
import { useVoices } from '@/components/features/studio/tts/hooks/useVoices';
import { useVoiceFilters } from '@/components/features/studio/tts/hooks/useVoiceFilters';
import { useVoiceOptions } from '@/components/features/studio/tts/hooks/useVoiceOptions';
import { useAudioPlayer } from '@/components/features/studio/tts/hooks/useAudioPlayer';
import VoiceFilters from '@/components/features/studio/tts/components/VoiceFilters';
import VoiceCard from '@/components/features/studio/tts/components/VoiceCard';
import type { VoiceModel } from '@/hooks/useTTSGenerator';

/**
 * Voices Gallery Page
 *
 * Browse and preview all available voice models with:
 * - Search and filter functionality
 * - Voice preview playback
 * - Voice details and metadata
 */
export default function VoicesPage() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const { setTitle } = useStudio();
  const [selectedVoice, setSelectedVoice] = useState<VoiceModel | null>(null);

  // Set page title
  useEffect(() => {
    setTitle('Voice Gallery');
  }, [setTitle]);

  // 获取语音数据
  const { voices, loading, error } = useVoices();

  // 音频播放控制
  const { playingVoiceId, handlePlayPause } = useAudioPlayer();

  // 生成选项
  const { languages } = useVoiceOptions({
    voices,
    availableLanguages: [],
    locale,
    t,
  });

  // 筛选逻辑
  const {
    searchQuery,
    setSearchQuery,
    selectedCountry,
    setSelectedCountry,
    selectedLanguage,
    setSelectedLanguage,
    selectedGender,
    setSelectedGender,
    availableLanguages,
    filteredVoices,
  } = useVoiceFilters({ voices, languages });

  // 更新选项（使用实际的 availableLanguages）
  const updatedOptions = useVoiceOptions({
    voices,
    availableLanguages,
    locale,
    t,
  });

  const handleVoiceSelect = (voice: VoiceModel) => {
    setSelectedVoice(voice);
  };

  const handleUseTTS = () => {
    if (selectedVoice) {
      // 跳转到 TTS 页面，并将选中的 voice 通过 state 传递
      router.push(`/studio/tts?voiceId=${selectedVoice.id}`);
    }
  };

  return (
    <div className="bg-gradient-to-b from-white to-purple-50 min-h-screen">
      <section className="pb-12">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Voice Gallery
            </h1>
            <p className="text-gray-600">
              Browse and preview all available voice models. Select a voice to use it in text-to-speech generation.
            </p>
          </div>

          {/* Selected Voice Banner */}
          {selectedVoice && (
            <div className="mb-6 p-4 bg-purple-50 border-2 border-purple-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                  {selectedVoice.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedVoice.name}</h3>
                  <p className="text-sm text-gray-600">
                    {selectedVoice.locale} • {selectedVoice.gender}
                  </p>
                </div>
              </div>
              <button
                onClick={handleUseTTS}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Use in TTS
              </button>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
            <VoiceFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCountry={selectedCountry}
              onCountryChange={setSelectedCountry}
              selectedLanguage={selectedLanguage}
              onLanguageChange={setSelectedLanguage}
              selectedGender={selectedGender}
              onGenderChange={setSelectedGender}
              countryOptions={updatedOptions.countryOptions}
              languageOptions={updatedOptions.languageOptions}
              genderOptions={updatedOptions.genderOptions}
              disabled={loading}
              t={t}
            />
          </div>

          {/* Voice Grid */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            {loading && (
              <div className="text-center py-16">
                <div className="inline-block w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600 font-medium">Loading voices...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-red-600 font-medium mb-3">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {!loading && !error && filteredVoices.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">No voices found matching your criteria</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
              </div>
            )}

            {!loading && !error && filteredVoices.length > 0 && (
              <>
                <div className="mb-4 text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{filteredVoices.length}</span> voice{filteredVoices.length !== 1 ? 's' : ''}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredVoices.map((voice) => (
                    <VoiceCard
                      key={voice.id}
                      voice={voice}
                      isSelected={selectedVoice?.id === voice.id}
                      isPlaying={playingVoiceId === voice.id}
                      disabled={false}
                      onSelect={handleVoiceSelect}
                      onPlayPause={handlePlayPause}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}