'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useStudio } from '@/contexts/StudioContext';
import LanguageSelectorModal from '@/components/common/LanguageSelectorModal';
import VoiceSearchBar from '@/components/features/studio/voices/VoiceSearchBar';
import VoiceFilters from '@/components/features/studio/voices/VoiceFilters';
import VoiceGrid from '@/components/features/studio/voices/VoiceGrid';
import { useVoices } from '@/components/features/studio/voices/hooks/useVoices';
import { getAllLocaleOptions } from '@/utils/localeMapper';
import type { LocaleOption } from '@/types/config';
import type { Voice } from '@/types/voice';

/**
 * Voices Gallery Page - Grid Layout
 *
 * Features:
 * - Search bar with language selector
 * - Filters (gender, used only)
 * - Circular avatar grid
 * - Bottom select button
 */
export default function VoicesPage() {
  const router = useRouter();
  const { locale, t } = useLanguage();
  const { user, loading: authLoading } = useFirebaseAuth();
  const { setTitle } = useStudio();

  // Selected voice state
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);

  // Language selector modal state
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);

  // Use voices hook for all business logic
  const {
    filteredVoices,
    loading,
    loadingMore,
    error,
    hasMore,
    total,
    searchQuery,
    setSearchQuery,
    selectedLanguage,
    setSelectedLanguage,
    selectedGender,
    setSelectedGender,
    usedOnly,
    setUsedOnly,
    playingVoiceId,
    handlePlayVoice,
    loadMoreVoices,
    refreshVoices,
  } = useVoices({ locale, user, authLoading });

  // Handle scroll to load more
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      const bottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;

      if (bottom && hasMore && !loading && !loadingMore) {
        void loadMoreVoices();
      }
    },
    [hasMore, loading, loadingMore, loadMoreVoices]
  );

  // Set page title
  useEffect(() => {
    setTitle('Voice Gallery');
  }, [setTitle]);

  // Get all available language options
  const availableLanguages = getAllLocaleOptions();

  // Initialize language selection based on localStorage or current locale
  useEffect(() => {
    const savedLanguageCode = localStorage.getItem('voiceLanguageFilter');
    if (savedLanguageCode) {
      if (savedLanguageCode === 'all') {
        if (selectedLanguage !== null) {
          setSelectedLanguage(null);
        }
        return;
      }

      const savedLanguage = availableLanguages.find(lang => lang.code === savedLanguageCode);
      if (savedLanguage && selectedLanguage?.code !== savedLanguageCode) {
        setSelectedLanguage(savedLanguage);
        return;
      }
    }

    if (!savedLanguageCode && selectedLanguage === null) {
      const currentLanguage = availableLanguages.find(lang => lang.code === locale);
      if (currentLanguage) {
        setSelectedLanguage(currentLanguage);
        return;
      }

      const defaultLanguage = availableLanguages.find(lang => lang.code === 'en-US');
      if (defaultLanguage) {
        setSelectedLanguage(defaultLanguage);
      }
    }
  }, [availableLanguages, locale, selectedLanguage, setSelectedLanguage]);

  const handleLanguageSelect = (language: LocaleOption | null) => {
    setSelectedLanguage(language);
    if (language) {
      localStorage.setItem('voiceLanguageFilter', language.code);
    } else {
      localStorage.setItem('voiceLanguageFilter', 'all');
    }
  };

  // Handle voice selection (just select, don't navigate)
  const handleSelectVoice = (voice: Voice) => {
    setSelectedVoice(voice);
  };

  // Handle play voice
  const handlePlay = (voice: Voice) => {
    handlePlayVoice(voice, null);
  };

  // Handle confirm selection (navigate to TTS)
  const handleConfirmSelection = () => {
    if (selectedVoice) {
      console.log('[Voices] Selected voice:', selectedVoice.name, selectedVoice.id);
      sessionStorage.setItem('ttsPreSelectedVoice', JSON.stringify(selectedVoice));
      router.push('/studio/tts');
    }
  };

  // Helper to get voice display name
  const getVoiceName = (voice: Voice) => voice.display_name;

  return (
    <div className="h-[calc(100vh-60px)] lg:h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* ========== Fixed Header: Search + Filters ========== */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 shadow-sm">
        {/* Search bar + Language selector */}
        <VoiceSearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedLanguage={selectedLanguage}
          onLanguageClick={() => setIsLanguageModalOpen(true)}
        />

        {/* Filters */}
        <VoiceFilters
          selectedGender={selectedGender}
          onGenderChange={setSelectedGender}
          usedOnly={usedOnly}
          onUsedOnlyChange={setUsedOnly}
        />
      </div>

      {/* Language selector modal */}
      <LanguageSelectorModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
        selectedLocale={selectedLanguage}
        availableLocales={availableLanguages}
        onSelect={handleLanguageSelect}
      />

      {/* ========== Voice Grid (scrollable) ========== */}
      <div className="flex-1 overflow-y-auto bg-white" onScroll={handleScroll}>
        <VoiceGrid
          voices={filteredVoices}
          loading={loading}
          error={error}
          playingVoiceId={playingVoiceId}
          selectedVoice={selectedVoice}
          getVoiceName={getVoiceName}
          onPlayVoice={handlePlay}
          onSelectVoice={handleSelectVoice}
          onRetry={refreshVoices}
          usedOnly={usedOnly}
        />

        {/* Loading more indicator */}
        {loadingMore && (
          <div className="flex justify-center py-4">
            <div className="text-sm text-gray-500">Loading more voices...</div>
          </div>
        )}

        {/* End of list indicator */}
        {!loading && !loadingMore && !hasMore && filteredVoices.length > 0 && (
          <div className="flex justify-center py-4 pb-24">
            <div className="text-xs text-gray-400">All voices loaded ({total} total)</div>
          </div>
        )}
      </div>

      {/* ========== Bottom Select Button (fixed, above bottom nav) ========== */}
      <div className="fixed bottom-[72px] left-0 right-0 p-4 bg-gradient-to-t from-white via-white/95 to-transparent lg:hidden">
        <button
          onClick={handleConfirmSelection}
          disabled={!selectedVoice}
          className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg ${
            selectedVoice
              ? 'bg-purple-600 text-white hover:bg-purple-700 active:scale-[0.98]'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <span>
            {selectedVoice
              ? `${t('studio.voices.selectVoice')} - ${getVoiceName(selectedVoice)}`
              : t('studio.voices.selectVoicePrompt')}
          </span>
          {selectedVoice && <ArrowRight className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}