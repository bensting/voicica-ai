import { useState, useEffect, useCallback } from 'react';
import { listVoices, getUsedVoiceNames } from '@/actions/voice';
import type { Voice } from '@/types/voice';
import type { LocaleOption } from '@/types/config';

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

  // Gender filter state
  selectedGender: string;
  setSelectedGender: (gender: string) => void;

  // Used only filter state
  usedOnly: boolean;
  setUsedOnly: (usedOnly: boolean) => void;

  // Audio playback state
  playingVoiceId: string | null;
  handlePlayVoice: (voice: Voice) => void;

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
export function useVoices({ authLoading }: UseVoicesProps): UseVoicesReturn {
  // Voices data state
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 20;

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Language filter state
  const [selectedLanguage, setSelectedLanguage] = useState<LocaleOption | null>(null);

  // Gender filter state
  const [selectedGender, setSelectedGender] = useState<string>('all');

  // Used only filter state
  const [usedOnly, setUsedOnly] = useState(false);
  const [usedVoiceNames, setUsedVoiceNames] = useState<string[]>([]);

  // Audio player state
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Load used voice names when usedOnly filter is enabled
  useEffect(() => {
    if (usedOnly && usedVoiceNames.length === 0) {
      void getUsedVoiceNames().then(setUsedVoiceNames);
    }
  }, [usedOnly, usedVoiceNames.length]);

  // Load voices (initial load or refresh)
  const loadVoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build API params
      // When usedOnly is enabled, don't apply locale/gender filters
      const params: {
        is_active: boolean;
        page: number;
        page_size: number;
        locale?: string;
        gender?: string;
      } = {
        is_active: true,
        page: 1,
        page_size: usedOnly ? 1000 : pageSize, // Load more when filtering by usedOnly
      };

      // Only apply filters when usedOnly is NOT enabled
      if (!usedOnly) {
        if (selectedLanguage) {
          params.locale = selectedLanguage.code;
        }

        if (selectedGender !== 'all') {
          params.gender = selectedGender;
        }
      }

      const response = await listVoices(params);

      setVoices(response.voices as Voice[]);
      setTotal(response.total);
      setTotalPages(response.total_pages);
      setCurrentPage(response.page);
    } catch (err) {
      console.error('Failed to load voices:', err);
      setError('Failed to load voices');
    } finally {
      setLoading(false);
    }
  }, [selectedLanguage, selectedGender, pageSize, usedOnly]);

  // Load more voices (pagination)
  const loadMoreVoices = useCallback(async () => {
    if (loadingMore || currentPage >= totalPages) return;

    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;

      // Build API params
      const params: {
        is_active: boolean;
        page: number;
        page_size: number;
        locale?: string;
        gender?: string;
      } = {
        is_active: true,
        page: nextPage,
        page_size: pageSize,
      };

      if (selectedLanguage) {
        params.locale = selectedLanguage.code;
      }

      if (selectedGender !== 'all') {
        params.gender = selectedGender;
      }

      const response = await listVoices(params);

      setVoices((prev) => [...prev, ...(response.voices as Voice[])]);
      setTotal(response.total);
      setTotalPages(response.total_pages);
      setCurrentPage(response.page);
    } catch (err) {
      console.error('Failed to load more voices:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, currentPage, totalPages, selectedLanguage, selectedGender, pageSize]);

  // Initial load and reload when filters change
  // Wait for authentication to complete before loading voices
  useEffect(() => {
    // Skip if auth is still loading
    if (authLoading) {
      return;
    }

    // Load voices for both authenticated and anonymous users
    // API client will handle authentication automatically:
    // - Authenticated users: use Firebase token
    // - Anonymous users: use device fingerprint
    void loadVoices();
  }, [loadVoices, authLoading]);

  // Filter voices based on search query and usedOnly (client-side)
  // Other filters (language, gender) are handled by API
  const filteredVoices = voices.filter((voice) => {
    // Search filter (client-side for better UX)
    if (searchQuery) {
      const voiceName = voice.display_name.toLowerCase();
      if (!voiceName.includes(searchQuery.toLowerCase())) {
        return false;
      }
    }

    // Used only filter (client-side)
    // When usedOnly is enabled, only show voices that user has used
    // If user has never used any voice, this will correctly show empty list
    if (usedOnly) {
      if (!usedVoiceNames.includes(voice.name)) {
        return false;
      }
    }

    return true;
  });

  // Handle audio playback
  const handlePlayVoice = useCallback((voice: Voice) => {
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
  }, [audioElement, playingVoiceId]);

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

    // Gender filter state
    selectedGender,
    setSelectedGender,

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