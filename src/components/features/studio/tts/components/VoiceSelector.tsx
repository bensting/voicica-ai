'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { Voice } from '@/types/voice';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useVoices } from '@/components/features/studio/voices/hooks/useVoices';
import VoiceSearchBar from '@/components/features/studio/voices/VoiceSearchBar';
import VoiceFilters from '@/components/features/studio/voices/VoiceFilters';
import VoiceList from '@/components/features/studio/voices/VoiceList';
import { getAllLocaleOptions } from '@/utils/localeMapper';
import type { LocaleOption } from '@/types/config';
import LanguageSelectorModal from '@/components/common/LanguageSelectorModal';

interface VoiceSelectorProps {
  selectedVoice: Voice | null;
  onSelect: (voice: Voice) => void;
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
  const { user, loading: authLoading } = useAuth();
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
  } = useVoices({ locale, user, authLoading });

  // Mobile: Navigate to voices page
  const handleOpenVoiceModal = () => {
    router.push('/studio/voices');
  };

  // Get voice display name for mobile button
  const voiceName = selectedVoice?.display_name || '晓臻';

  // Helper function to get voice display name
  const getVoiceName = (voice: Voice) => voice.display_name;

  // Get all locale options for language modal
  const allLocaleOptions = getAllLocaleOptions();

  // Initialize language selection based on localStorage or current locale
  useEffect(() => {
    // 1. Try to get from localStorage (user's previous selection)
    const savedLanguageCode = localStorage.getItem('voiceLanguageFilter');
    if (savedLanguageCode) {
      // Special case: user selected "All Languages"
      if (savedLanguageCode === 'all') {
        if (selectedLanguage !== null) {
          setSelectedLanguage(null);
        }
        return;
      }

      // Find saved language
      const savedLanguage = allLocaleOptions.find(lang => lang.code === savedLanguageCode);
      if (savedLanguage && selectedLanguage?.code !== savedLanguageCode) {
        setSelectedLanguage(savedLanguage);
        return;
      }
    }

    // 2. Only set default if no localStorage and no selection yet
    if (!savedLanguageCode && selectedLanguage === null) {
      // Try to match current website locale
      const currentLanguage = allLocaleOptions.find(lang => lang.code === locale);
      if (currentLanguage) {
        setSelectedLanguage(currentLanguage);
        return;
      }

      // Default to en-US
      const defaultLanguage = allLocaleOptions.find(lang => lang.code === 'en-US');
      if (defaultLanguage) {
        setSelectedLanguage(defaultLanguage);
      }
    }
  }, [allLocaleOptions, locale, selectedLanguage, setSelectedLanguage]);

  // Handle language selection modal
  const handleLanguageClick = () => {
    setIsLanguageModalOpen(true);
  };

  const handleSelectLanguage = (language: LocaleOption | null) => {
    setSelectedLanguage(language);
    // Save to localStorage
    if (language) {
      localStorage.setItem('voiceLanguageFilter', language.code);
    } else {
      // Save 'all' to indicate user selected "All Languages"
      localStorage.setItem('voiceLanguageFilter', 'all');
    }
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
        <div className="flex-1 min-h-0 overflow-y-auto p-3">
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

      {/* Language Selection Modal */}
      <LanguageSelectorModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
        selectedLocale={selectedLanguage}
        availableLocales={allLocaleOptions}
        onSelect={handleSelectLanguage}
        title="Select Language"
        searchPlaceholder="Search languages..."
        showAllOption={true}
      />
    </>
  );
}