'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { VoiceModel } from '@/hooks/useTTSGenerator';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLocalizedVoiceName } from '@/types/voice';
import { useVoices } from '@/components/features/studio/voices/hooks/useVoices';
import VoiceSearchBar from '@/components/features/studio/voices/VoiceSearchBar';
import VoiceFilters from '@/components/features/studio/voices/VoiceFilters';
import VoiceList from '@/components/features/studio/voices/VoiceList';
import { getAllLocaleOptions } from '@/utils/localeMapper';
import type { LocaleOption } from '@/types/config';

interface VoiceSelectorProps {
  selectedVoice: VoiceModel | null;
  onSelect: (voice: VoiceModel) => void;
  disabled?: boolean;
}

/**
 * Responsive Voice Selector Component (Mobile-First)
 *
 * Mobile: Compact button that navigates to /studio/voices
 * Desktop: VoiceSearchBar + VoiceFilters + VoiceList (from voices/ directory)
 */
export default function VoiceSelector({
  selectedVoice,
  onSelect,
  disabled = false,
}: VoiceSelectorProps) {
  const router = useRouter();
  const { locale } = useLanguage();
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);

  // Use voices hook for desktop (only runs on desktop)
  const {
    filteredVoices,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    selectedLanguage,
    setSelectedLanguage,
    selectedGender,
    setSelectedGender,
    playingVoiceId,
    handlePlayVoice,
    loadingMore,
    hasMore,
    loadMoreVoices,
  } = useVoices({ locale });

  // Mobile: Navigate to voices page
  const handleOpenVoiceModal = () => {
    router.push('/studio/voices');
  };

  // Get localized voice name for mobile button
  const voiceName = selectedVoice ? getLocalizedVoiceName(selectedVoice, locale) : '晓臻';

  // Helper function to get voice display name
  const getVoiceName = (voice: VoiceModel) => getLocalizedVoiceName(voice, locale);

  // Get all locale options for language modal
  const allLocaleOptions = getAllLocaleOptions();

  // Handle language selection modal
  const handleLanguageClick = () => {
    setIsLanguageModalOpen(true);
  };

  const handleSelectLanguage = (language: LocaleOption | null) => {
    setSelectedLanguage(language);
    setIsLanguageModalOpen(false);
  };

  return (
    <>
      {/* Mobile: Compact Button */}
      <button
        type="button"
        onClick={handleOpenVoiceModal}
        disabled={disabled}
        className="lg:hidden w-full flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-2xl hover:border-purple-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-3">
          {/* Voice Avatar */}
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center flex-shrink-0">
            {selectedVoice?.avatar_url ? (
              <Image
                src={selectedVoice.avatar_url}
                alt={voiceName}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl text-white">🎤</span>
            )}
          </div>

          {/* Voice Name */}
          <div className="text-left">
            <div className="text-base font-semibold text-gray-900">
              {voiceName}
            </div>
            {selectedVoice && (
              <div className="text-xs text-gray-500">
                {selectedVoice.locale} • {selectedVoice.gender === 'male' ? 'Male' : selectedVoice.gender === 'female' ? 'Female' : 'Neutral'}
              </div>
            )}
          </div>
        </div>

        {/* Arrow Icon */}
        <svg
          className="w-5 h-5 text-gray-400 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Desktop: Voice Search Bar + Filters + List */}
      <div className="hidden lg:flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Search Bar */}
        <VoiceSearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedLanguage={selectedLanguage}
          onLanguageClick={handleLanguageClick}
        />

        {/* Filters */}
        <VoiceFilters
          selectedGender={selectedGender}
          onGenderChange={setSelectedGender}
        />

        {/* Voice List - Scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          <VoiceList
            voices={filteredVoices}
            loading={loading}
            error={error}
            playingVoiceId={playingVoiceId}
            locale={locale}
            getVoiceName={getVoiceName}
            onPlayVoice={handlePlayVoice}
            onSelectVoice={onSelect}
            loadingMore={loadingMore}
            hasMore={hasMore}
            onLoadMore={loadMoreVoices}
          />
        </div>
      </div>

      {/* Language Selection Modal (Desktop) */}
      {isLanguageModalOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setIsLanguageModalOpen(false)}
          />

          {/* Modal */}
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] max-h-[600px] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Select Language</h3>
              <button
                onClick={() => setIsLanguageModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Language List */}
            <div className="overflow-y-auto max-h-[500px]">
              {/* All Languages Option */}
              <button
                onClick={() => handleSelectLanguage(null)}
                className={`w-full px-6 py-3 text-left hover:bg-gray-50 transition-colors ${
                  !selectedLanguage ? 'bg-purple-50 text-purple-600 font-medium' : 'text-gray-700'
                }`}
              >
                All Languages
              </button>

              {/* Language Options */}
              {allLocaleOptions.map((option) => (
                <button
                  key={option.code}
                  onClick={() => handleSelectLanguage(option)}
                  className={`w-full px-6 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${
                    selectedLanguage?.code === option.code ? 'bg-purple-50 text-purple-600 font-medium' : 'text-gray-700'
                  }`}
                >
                  <span>{option.name}</span>
                  {selectedLanguage?.code === option.code && (
                    <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}