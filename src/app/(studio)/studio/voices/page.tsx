'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useStudio } from '@/contexts/StudioContext';
import LanguageSelectorModal from '@/components/common/LanguageSelectorModal';
import VoiceSearchBar from '@/components/features/studio/voices/VoiceSearchBar';
import VoiceFilters from '@/components/features/studio/voices/VoiceFilters';
import VoiceList from '@/components/features/studio/voices/VoiceList';
import { useVoices } from '@/components/features/studio/voices/hooks/useVoices';
import { getAllLocaleOptions } from '@/utils/localeMapper';
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
  const { locale } = useLanguage();
  const { user, loading: authLoading } = useFirebaseAuth();
  const { setTitle } = useStudio();

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
      const savedLanguage = availableLanguages.find(lang => lang.code === savedLanguageCode);
      if (savedLanguage && selectedLanguage?.code !== savedLanguageCode) {
        setSelectedLanguage(savedLanguage);
        return;
      }
    }

    // 2. Only set default if no localStorage and no selection yet
    if (!savedLanguageCode && selectedLanguage === null) {
      // Try to match current website locale
      const currentLanguage = availableLanguages.find(lang => lang.code === locale);
      if (currentLanguage) {
        setSelectedLanguage(currentLanguage);
        return;
      }

      // Default to en-US
      const defaultLanguage = availableLanguages.find(lang => lang.code === 'en-US');
      if (defaultLanguage) {
        setSelectedLanguage(defaultLanguage);
      }
    }
  }, [availableLanguages, locale, selectedLanguage, setSelectedLanguage]);

  const handleLanguageSelect = (language: LocaleOption | null) => {
    setSelectedLanguage(language);
    // Save to localStorage
    if (language) {
      localStorage.setItem('voiceLanguageFilter', language.code);
    } else {
      // Save 'all' to indicate user selected "All Languages"
      localStorage.setItem('voiceLanguageFilter', 'all');
    }
  };

  // Handle voice selection (return to TTS page)
  const handleSelectVoice = (voice: Voice) => {
    console.log('🎯 [Voices] 选中语音:', voice.name, voice.id);
    sessionStorage.setItem('ttsPreSelectedVoice', JSON.stringify(voice));
    console.log('💾 [Voices] 已保存到 sessionStorage');
    router.push('/studio/tts');
  };

  // Helper to get voice display name
  const getVoiceName = (voice: Voice) => voice.display_name;

  return (
    <div className="h-[calc(100vh-60px)] lg:h-screen flex flex-col bg-white overflow-hidden">
      {/* ========== Search bar + Language selector ========== */}
      <VoiceSearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedLanguage={selectedLanguage}
        onLanguageClick={() => setIsLanguageModalOpen(true)}
      />

      {/* Language selector modal */}
      <LanguageSelectorModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
        selectedLocale={selectedLanguage}
        availableLocales={availableLanguages}
        onSelect={handleLanguageSelect}
      />

      {/* ========== 内容区域：筛选器 + 列表 ========== */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {/* Filters */}
        <VoiceFilters
          selectedGender={selectedGender}
          onGenderChange={setSelectedGender}
          usedOnly={usedOnly}
          onUsedOnlyChange={setUsedOnly}
        />

        {/* Voice List with Infinite Scroll */}
        <div className="flex-1 overflow-y-auto bg-gray-50" onScroll={handleScroll}>
          <div className="p-4 pb-20 lg:p-6 lg:pb-6">
            <VoiceList
              voices={filteredVoices}
              loading={loading}
              error={error}
              playingVoiceId={playingVoiceId}
              locale={locale}
              getVoiceName={getVoiceName}
              onPlayVoice={handlePlayVoice}
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
              <div className="flex justify-center py-4">
                <div className="text-xs text-gray-400">All voices loaded ({total} total)</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}