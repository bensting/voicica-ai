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
    selectedRole,
    setSelectedRole,
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
    <div className="lg:h-screen bg-white overflow-y-auto" style={{ height: 'calc(100vh - 60px - var(--safe-area-inset-top, 0px))' }} onScroll={handleScroll}>
      {/* ========== Sticky Header: Search + Filters ========== */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
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
          selectedRole={selectedRole}
          onRoleChange={setSelectedRole}
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
        showAllOption={false}
      />

      {/* ========== Voice Grid ========== */}
      <div className="bg-gradient-to-b from-gray-50/50 to-white min-h-[calc(100%-120px)]">
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

      {/* ========== Bottom Select Button ========== */}
      {/* Mobile: fixed above bottom nav */}
      <div className="fixed left-0 right-0 p-4 bg-gradient-to-t from-white via-white/95 to-transparent lg:hidden" style={{ bottom: 'calc(72px + var(--safe-area-inset-bottom, 0px))' }}>
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

      {/* Desktop: fixed at bottom of content area */}
      <div className="hidden lg:block fixed bottom-0 right-0 p-4 bg-gradient-to-t from-white via-white/95 to-transparent" style={{ left: '72px' }}>
        <div className="max-w-2xl mx-auto">
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
    </div>
  );
}