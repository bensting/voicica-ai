import { useState, useEffect, useCallback, useRef } from 'react';
import { getVoicesByLocale, getUsedVoiceNames } from '@/actions/voice';
import type { Voice } from '@/types/voice';
import { getVoiceSampleUrl } from '@/types/voice';
import type { LocaleOption } from '@/types/config';
import { getAllLocaleOptions } from '@/utils/localeMapper';

interface UseVoicesProps {
  locale: string;
  user: { uid: string } | null;
  authLoading: boolean;
}

interface UseVoicesReturn {
  // Data state
  voices: Voice[];
  filteredVoices: Voice[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;

  // Search state
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Language filter state
  selectedLanguage: LocaleOption | null;
  setSelectedLanguage: (language: LocaleOption | null) => void;
  isLanguageInitialized: boolean;

  // Gender filter state
  selectedGender: string;
  setSelectedGender: (gender: string) => void;

  // Role filter state
  selectedRole: string;
  setSelectedRole: (role: string) => void;

  // Used only filter state
  usedOnly: boolean;
  setUsedOnly: (usedOnly: boolean) => void;

  // Audio playback state
  playingVoiceId: string | null;
  handlePlayVoice: (voice: Voice, style?: string | null) => void;

  // Actions
  refreshVoices: () => Promise<void>;
  loadMoreVoices: () => Promise<void>;
}

/**
 * Custom hook for Voices Gallery business logic
 *
 * Handles:
 * - Voice data fetching
 * - Search and filtering
 * - Audio playback
 */
export function useVoices({ locale, authLoading }: UseVoicesProps): UseVoicesReturn {
  // Voices data state
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state (kept for compatibility, but all data loaded at once)
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Language filter state - 初始为 null，在客户端 useEffect 中设置
  const [selectedLanguage, setSelectedLanguage] = useState<LocaleOption | null>(null);
  const [isLanguageInitialized, setIsLanguageInitialized] = useState(false);

  // Gender filter state
  const [selectedGender, setSelectedGender] = useState<string>('all');

  // Role filter state
  const [selectedRole, setSelectedRole] = useState<string>('all');

  // Used only filter state
  const [usedOnly, setUsedOnly] = useState(false);
  const [usedVoiceNames, setUsedVoiceNames] = useState<string[]>([]);

  // Audio player state
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [playingStyle, setPlayingStyle] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Track if initial load has been done
  const hasInitializedRef = useRef(false);

  // Initialize language from localStorage on client side (only once)
  // Note: No longer supports "all" option - must select a specific language
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const availableLanguages = getAllLocaleOptions();
    const savedLanguageCode = localStorage.getItem('voiceLanguageFilter');

    let initialLang: LocaleOption | null = null;

    if (savedLanguageCode && savedLanguageCode !== 'all') {
      initialLang = availableLanguages.find(lang => lang.code === savedLanguageCode) ?? null;
    }

    // If no saved language or was "all", use current locale or fallback to en-US
    if (!initialLang) {
      initialLang = availableLanguages.find(lang => lang.code === locale)
        ?? availableLanguages.find(lang => lang.code === 'en-US')
        ?? availableLanguages[0]; // Fallback to first available language
    }

    setSelectedLanguage(initialLang);
    setIsLanguageInitialized(true);
  }, [locale]);

  // Load used voice names when usedOnly filter is enabled
  useEffect(() => {
    if (usedOnly && usedVoiceNames.length === 0) {
      void getUsedVoiceNames().then(setUsedVoiceNames);
    }
  }, [usedOnly, usedVoiceNames.length]);

  // Load all voices for current locale (uses server cache)
  // Client-side filtering and pagination for better UX
  const loadVoices = useCallback(async () => {
    if (!selectedLanguage) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch all voices for the locale (cached on server)
      const allVoices = await getVoicesByLocale(selectedLanguage.code);

      setVoices(allVoices);
      setTotal(allVoices.length);
      // No server-side pagination needed - all data loaded at once
      setTotalPages(1);
      setCurrentPage(1);
    } catch (err) {
      console.error('Failed to load voices:', err);
      setError('Failed to load voices');
    } finally {
      setLoading(false);
    }
  }, [selectedLanguage]);

  // Load more voices - not needed with new strategy but keep for compatibility
  const loadMoreVoices = useCallback(async () => {
    // All voices are loaded at once, no more to load
    return;
  }, []);

  // Initial load and reload when language changes
  // Wait for authentication and language initialization to complete before loading voices
  useEffect(() => {
    // Skip if auth is still loading or language not initialized
    if (authLoading || !isLanguageInitialized || !selectedLanguage) {
      return;
    }

    void loadVoices();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLanguage, authLoading, isLanguageInitialized]);

  // Filter voices based on all criteria (client-side)
  // All filtering is now done on client side using cached data
  const filteredVoices = voices.filter((voice) => {
    // Search filter
    if (searchQuery) {
      const voiceName = voice.display_name.toLowerCase();
      if (!voiceName.includes(searchQuery.toLowerCase())) {
        return false;
      }
    }

    // Gender filter
    if (selectedGender !== 'all' && voice.gender !== selectedGender) {
      return false;
    }

    // Role filter
    if (selectedRole !== 'all' && voice.role !== selectedRole) {
      return false;
    }

    // Used only filter
    if (usedOnly && !usedVoiceNames.includes(voice.name)) {
      return false;
    }

    return true;
  });

  // Handle audio playback
  const handlePlayVoice = useCallback((voice: Voice, style?: string | null) => {
    const currentStyle = style ?? null;

    // 判断是否是同一个语音和风格
    const isSameVoiceAndStyle = playingVoiceId === voice.id && playingStyle === currentStyle;

    if (isSameVoiceAndStyle) {
      // 暂停当前播放
      audioElement?.pause();
      setPlayingVoiceId(null);
      setPlayingStyle(null);
    } else {
      // 停止之前的音频并播放新的
      audioElement?.pause();
      const sampleUrl = getVoiceSampleUrl(voice, currentStyle);
      const audio = new Audio(sampleUrl);
      audio.play();
      audio.onended = () => {
        setPlayingVoiceId(null);
        setPlayingStyle(null);
      };
      setAudioElement(audio);
      setPlayingVoiceId(voice.id);
      setPlayingStyle(currentStyle);
    }
  }, [audioElement, playingVoiceId, playingStyle]);

  // Calculate hasMore
  const hasMore = currentPage < totalPages;

  return {
    // Data state
    voices,
    filteredVoices,
    loading,
    loadingMore,
    error,
    hasMore,
    total,

    // Search state
    searchQuery,
    setSearchQuery,

    // Language filter state
    selectedLanguage,
    setSelectedLanguage,
    isLanguageInitialized,

    // Gender filter state
    selectedGender,
    setSelectedGender,

    // Role filter state
    selectedRole,
    setSelectedRole,

    // Used only filter state
    usedOnly,
    setUsedOnly,

    // Audio playback state
    playingVoiceId,
    handlePlayVoice,

    // Actions
    refreshVoices: loadVoices,
    loadMoreVoices,
  };
}