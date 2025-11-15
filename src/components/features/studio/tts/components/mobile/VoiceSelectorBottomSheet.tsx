'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { Voice } from '@/types/voice';
import type { LocaleOption } from '@/types/config';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useVoices } from '@/components/features/studio/voices/hooks/useVoices';
import VoiceSearchBar from '@/components/features/studio/voices/VoiceSearchBar';
import VoiceTagSelector from '@/components/features/studio/voices/VoiceTagSelector';
import VoiceFilters from '@/components/features/studio/voices/VoiceFilters';
import VoiceList from '@/components/features/studio/voices/VoiceList';
import LanguageSelectorModal from '@/components/common/LanguageSelectorModal';
import { getAllLocaleOptions } from '@/utils/localeMapper';

interface VoiceSelectorBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVoice: Voice | null;
  onSelect: (voice: Voice) => void;
}

/**
 * Mobile Bottom Sheet for Voice Selection
 *
 * Features:
 * - Slides up from bottom
 * - Full-height sheet with search and filters
 * - Reuses voice selection components from voices page
 */
export default function VoiceSelectorBottomSheet({
  isOpen,
  onClose,
  selectedVoice,
  onSelect,
}: VoiceSelectorBottomSheetProps) {
  const { locale, t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);

  // Use voices hook
  const {
    filteredVoices,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    selectedLanguage,
    setSelectedLanguage,
    selectedTagId,
    setSelectedTagId,
    selectedGender,
    setSelectedGender,
    playingVoiceId,
    handlePlayVoice,
    loadingMore,
    hasMore,
    loadMoreVoices,
    refreshVoices,
    total,
  } = useVoices({ locale, user, authLoading });

  // Get all locale options
  const availableLanguages = getAllLocaleOptions();

  // Initialize language selection
  useEffect(() => {
    if (!isOpen) return;

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
  }, [isOpen, availableLanguages, locale, selectedLanguage, setSelectedLanguage]);

  const handleLanguageSelect = (language: LocaleOption | null) => {
    setSelectedLanguage(language);
    if (language) {
      localStorage.setItem('voiceLanguageFilter', language.code);
    } else {
      localStorage.setItem('voiceLanguageFilter', 'all');
    }
  };

  const handleSelectVoice = (voice: Voice) => {
    onSelect(voice);
    onClose();
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const bottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;

    if (bottom && hasMore && !loading && !loadingMore) {
      void loadMoreVoices();
    }
  };

  const getVoiceName = (voice: Voice) => voice.display_name;

  // Prevent body scroll when sheet is open
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

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh] animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('studio.selectVoice')}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex-shrink-0 px-4 pt-3">
          <VoiceSearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedLanguage={selectedLanguage}
            onLanguageClick={() => setIsLanguageModalOpen(true)}
          />
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left: Tag Selector */}
          <div className="flex-shrink-0 border-r border-gray-200">
            <VoiceTagSelector
              selectedTagId={selectedTagId}
              onTagSelect={setSelectedTagId}
            />
          </div>

          {/* Right: Filters + List */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            {/* Filters */}
            <div className="flex-shrink-0">
              <VoiceFilters
                selectedGender={selectedGender}
                onGenderChange={setSelectedGender}
              />
            </div>

            {/* Voice List */}
            <div className="flex-1 overflow-y-auto bg-gray-50" onScroll={handleScroll}>
              <div className="p-4 pb-6">
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
                />

                {/* Loading more indicator */}
                {loadingMore && (
                  <div className="flex justify-center py-4">
                    <div className="text-sm text-gray-500">{t('common.loading')}</div>
                  </div>
                )}

                {/* End of list */}
                {!loading && !loadingMore && !hasMore && filteredVoices.length > 0 && (
                  <div className="flex justify-center py-4">
                    <div className="text-xs text-gray-400">
                      {t('voiceFilters.allVoicesLoaded', { total })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Language Selector Modal */}
      <LanguageSelectorModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
        selectedLocale={selectedLanguage}
        availableLocales={availableLanguages}
        onSelect={handleLanguageSelect}
      />
    </>
  );
}