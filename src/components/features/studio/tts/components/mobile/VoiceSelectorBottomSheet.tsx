'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { Voice } from '@/types/voice';
import type { LocaleOption } from '@/types/config';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useVoices } from '@/components/features/studio/voices/hooks/useVoices';
import VoiceSearchBar from '@/components/features/studio/voices/VoiceSearchBar';
import VoiceFilters from '@/components/features/studio/voices/VoiceFilters';
import VoiceList from '@/components/features/studio/voices/VoiceList';
import LanguageSelectorModal from '@/components/common/LanguageSelectorModal';
import { getAllLocaleOptions } from '@/utils/localeMapper';

interface VoiceSelectorBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVoice: Voice | null;
  onSelect: (voice: Voice, style: string | null) => void;
  /** Height of the bottom sheet, e.g. '70%' or '100%'. Defaults to fullscreen (100%) */
  height?: string;
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
  onSelect,
  height,
}: VoiceSelectorBottomSheetProps) {
  const { locale, t } = useLanguage();
  const { user, loading: authLoading } = useFirebaseAuth();
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);

  // Get all locale options
  const availableLanguages = getAllLocaleOptions();

  // 计算初始语言（在 hook 调用前确定，避免后续修改触发重新加载）
  const getInitialLanguage = () => {
    const savedLanguageCode = localStorage.getItem('voiceLanguageFilter');
    if (savedLanguageCode && savedLanguageCode !== 'all') {
      const savedLanguage = availableLanguages.find(lang => lang.code === savedLanguageCode);
      if (savedLanguage) return savedLanguage;
    }

    // 使用当前语言
    const currentLanguage = availableLanguages.find(lang => lang.code === locale);
    if (currentLanguage) return currentLanguage;

    // 默认英语
    return availableLanguages.find(lang => lang.code === 'en-US') || null;
  };

  // 保存初始语言值（虽然当前未使用，但保留以备将来使用）
  useState(getInitialLanguage);

  // Use voices hook - 传入初始语言避免后续修改
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
    selectedRole,
    setSelectedRole,
    usedOnly,
    setUsedOnly,
    playingVoiceId,
    handlePlayVoice,
    loadingMore,
    hasMore,
    loadMoreVoices,
    refreshVoices,
    total,
  } = useVoices({ locale, user, authLoading });

  const handleLanguageSelect = (language: LocaleOption | null) => {
    setSelectedLanguage(language);
    if (language) {
      localStorage.setItem('voiceLanguageFilter', language.code);
    } else {
      localStorage.setItem('voiceLanguageFilter', 'all');
    }
  };

  const handleSelectVoice = (voice: Voice, style: string | null) => {
    onSelect(voice, style);
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

  // If height is specified, render as a bottom sheet with backdrop
  const isBottomSheet = !!height;

  return (
    <>
      {/* Backdrop for bottom sheet mode */}
      {isBottomSheet && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Mobile Voice Selector - Fullscreen or Bottom Sheet */}
      <div
        className={`fixed z-50 bg-white flex flex-col animate-slide-up ${
          isBottomSheet
            ? 'inset-x-0 bottom-0 rounded-t-2xl'
            : 'inset-0'
        }`}
        style={isBottomSheet ? { height } : undefined}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-purple-100 flex-shrink-0 bg-gradient-to-r from-white to-purple-50/30">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            {t('tts.selectVoice')}
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-purple-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
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
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Filters */}
          <div className="flex-shrink-0">
            <VoiceFilters
              selectedGender={selectedGender}
              onGenderChange={setSelectedGender}
              selectedRole={selectedRole}
              onRoleChange={setSelectedRole}
              usedOnly={usedOnly}
              onUsedOnlyChange={setUsedOnly}
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
                usedOnly={usedOnly}
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
                    {t('voiceFilters.allVoicesLoaded').replace('{{total}}', String(total))}
                  </div>
                </div>
              )}
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